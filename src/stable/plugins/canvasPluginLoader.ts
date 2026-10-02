import { getCanvasPluginRuntime } from './canvasPluginRuntime';
import { registerCanvasPluginNodes, unregisterCanvasPluginNodes } from './canvasPluginRegistry';
import { canvasPluginStore } from './canvasPluginStore';
import type { CanvasPlugin, InstalledCanvasPlugin } from './canvasPluginTypes';

const cleanups = new Map<string, () => void>();
const activePlugins = new Map<string, CanvasPlugin>();

function assertPlugin(value: unknown): asserts value is CanvasPlugin {
  const plugin = value as Partial<CanvasPlugin> | null;
  if (!plugin || typeof plugin !== 'object') throw new Error('插件默认导出无效');
  if (!plugin.id || !Array.isArray(plugin.nodes) || plugin.nodes.length === 0)
    throw new Error('插件缺少 id 或 nodes');
}

async function evaluatePluginSource(source: string): Promise<CanvasPlugin> {
  getCanvasPluginRuntime();
  const blob = new Blob([source], { type: 'text/javascript' });
  const url = URL.createObjectURL(blob);
  try {
    const mod = await import(/* @vite-ignore */ url) as { default?: unknown; plugin?: unknown };
    const exported = mod.default ?? mod.plugin;
    const plugin = typeof exported === 'function'
      ? (exported as (runtime: unknown) => unknown)(getCanvasPluginRuntime())
      : exported;
    assertPlugin(plugin);
    return plugin;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function fetchPluginSource(url: string, bust = false) {
  const target = bust ? `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}` : url;
  const response = await fetch(target, { cache: bust ? 'no-store' : 'default' });
  if (!response.ok) throw new Error(`插件下载失败：HTTP ${response.status}`);
  return response.text();
}

type ResolvedPluginSource = {
  source: string;
  resolvedUrl: string;
  sourceKind: 'url' | 'github';
};

function safeUrl(value: string) {
  try {
    return new URL(value.trim());
  } catch {
    return null;
  }
}

function githubRawUrl(owner: string, repo: string, ref: string, filePath: string) {
  const clean = filePath.replace(/^\/+/, '');
  return `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${clean}`;
}

function githubRepoParts(value: string) {
  const parsed = safeUrl(value);
  if (!parsed || parsed.hostname.toLowerCase() !== 'github.com') return null;
  const parts = parsed.pathname.split('/').filter(Boolean);
  if (parts.length < 2) return null;
  return { parsed, parts, owner: parts[0], repo: parts[1].replace(/\.git$/i, '') };
}

async function githubDefaultBranches(owner: string, repo: string, bust: boolean) {
  const result: string[] = [];
  try {
    const api = `https://api.github.com/repos/${owner}/${repo}${bust ? `?t=${Date.now()}` : ''}`;
    const response = await fetch(api, { cache: bust ? 'no-store' : 'default' });
    if (response.ok) {
      const body = await response.json() as { default_branch?: unknown };
      if (typeof body.default_branch === 'string' && body.default_branch.trim())
        result.push(body.default_branch.trim());
    }
  } catch {
    // GitHub API 受限时仍可尝试常见默认分支。
  }
  for (const fallback of ['main', 'master']) if (!result.includes(fallback)) result.push(fallback);
  return result;
}

async function tryFetch(url: string, bust: boolean) {
  try {
    return { source: await fetchPluginSource(url, bust), url };
  } catch {
    return null;
  }
}

async function resolveGithubPluginSource(input: string, bust: boolean): Promise<ResolvedPluginSource | null> {
  const parsed = safeUrl(input);
  if (!parsed) return null;
  if (parsed.hostname.toLowerCase() === 'raw.githubusercontent.com') {
    return { source: await fetchPluginSource(input, bust), resolvedUrl: input, sourceKind: 'github' };
  }
  const repo = githubRepoParts(input);
  if (!repo) return null;
  const { parts, owner } = repo;
  const repoName = repo.repo;

  // github.com/<owner>/<repo>/blob/<ref>/<path>.js
  if (parts[2] === 'blob' && parts.length >= 5) {
    const raw = githubRawUrl(owner, repoName, parts[3], parts.slice(4).join('/'));
    return { source: await fetchPluginSource(raw, bust), resolvedUrl: raw, sourceKind: 'github' };
  }

  const treeRef = parts[2] === 'tree' && parts.length >= 4 ? parts[3] : null;
  const folder = treeRef ? parts.slice(4).join('/') : '';
  const refs = treeRef ? [treeRef] : await githubDefaultBranches(owner, repoName, bust);
  const pluginName = (folder.split('/').filter(Boolean).at(-1) || repoName).replace(/\.git$/i, '');

  for (const ref of refs) {
    const basePath = folder ? `${folder.replace(/\/$/, '')}/` : '';
    const manifestUrl = githubRawUrl(owner, repoName, ref, `${basePath}aifisher-plugin.json`);
    const manifest = await tryFetch(manifestUrl, bust);
    if (manifest) {
      try {
        const value = JSON.parse(manifest.source.replace(/^\uFEFF/, '')) as { entry?: unknown };
        if (typeof value.entry === 'string' && value.entry.trim()) {
          const entry = value.entry.trim().replace(/^\.\//, '');
          const entryUrl = githubRawUrl(owner, repoName, ref, `${basePath}${entry}`);
          const result = await tryFetch(entryUrl, bust);
          if (result) return { source: result.source, resolvedUrl: result.url, sourceKind: 'github' };
        }
      } catch {
        // 清单无效时继续按约定目录探测。
      }
    }

    const candidates = [
      `${basePath}dist/${pluginName}.js`,
      `${basePath}dist/plugin.js`,
      `${basePath}${pluginName}.js`,
      `${basePath}plugin.js`,
    ];
    for (const candidate of candidates) {
      const raw = githubRawUrl(owner, repoName, ref, candidate);
      const result = await tryFetch(raw, bust);
      if (result) return { source: result.source, resolvedUrl: result.url, sourceKind: 'github' };
    }
  }
  throw new Error('GitHub 仓库中没有找到可加载的插件 JS。建议提交 aifisher-plugin.json，或将构建产物放在 dist/<插件名>.js。');
}

async function resolvePluginSource(input: string, bust = false): Promise<ResolvedPluginSource> {
  const value = input.trim();
  if (!value) throw new Error('插件地址不能为空');
  const github = await resolveGithubPluginSource(value, bust);
  if (github) return github;
  return {
    source: await fetchPluginSource(value, bust),
    resolvedUrl: value,
    sourceKind: 'url',
  };
}

export function activateCanvasPlugin(plugin: CanvasPlugin) {
  deactivateCanvasPlugin(plugin.id);
  registerCanvasPluginNodes(plugin.id, plugin.nodes);
  const runtime = getCanvasPluginRuntime();
  const disposers: Array<() => void> = [];
  if (plugin.css) disposers.push(runtime.injectCSS(plugin.css, plugin.id));
  const setupCleanup = plugin.setup?.(runtime);
  if (typeof setupCleanup === 'function') disposers.push(setupCleanup);
  if (disposers.length) cleanups.set(plugin.id, () => disposers.forEach((dispose) => dispose()));
  activePlugins.set(plugin.id, plugin);
}

export function deactivateCanvasPlugin(pluginId: string) {
  cleanups.get(pluginId)?.();
  cleanups.delete(pluginId);
  activePlugins.delete(pluginId);
  unregisterCanvasPluginNodes(pluginId);
}

export async function installCanvasPluginFromUrl(url: string, options?: { local?: boolean; official?: boolean; bustCache?: boolean }) {
  const resolved = await resolvePluginSource(url, options?.bustCache);
  const source = resolved.source;
  const plugin = await evaluatePluginSource(source);
  const updateUrl = plugin.updateUrl || url;
  const record = canvasPluginStore.upsert({
    id: plugin.id,
    name: plugin.name || plugin.id,
    version: plugin.version || '0.0.0',
    description: plugin.description,
    url: updateUrl,
    resolvedUrl: resolved.resolvedUrl,
    sourceKind: resolved.sourceKind,
    source,
    enabled: true,
    local: options?.local,
    official: options?.official,
  });
  activateCanvasPlugin(plugin);
  return { plugin, record };
}

export async function updateCanvasPlugin(record: InstalledCanvasPlugin) {
  return installCanvasPluginFromUrl(record.url, {
    local: record.local,
    official: record.official,
    bustCache: true,
  });
}

export async function setCanvasPluginEnabled(record: InstalledCanvasPlugin, enabled: boolean) {
  canvasPluginStore.setEnabled(record.id, enabled);
  if (!enabled) {
    deactivateCanvasPlugin(record.id);
    return;
  }
  const source = record.local ? (await resolvePluginSource(record.url, true)).source : record.source;
  activateCanvasPlugin(await evaluatePluginSource(source));
}

export function uninstallCanvasPlugin(id: string) {
  deactivateCanvasPlugin(id);
  canvasPluginStore.remove(id);
}

let loaded = false;
export async function ensureCanvasPluginsLoaded() {
  if (loaded) return;
  loaded = true;
  getCanvasPluginRuntime();
  await discoverLocalCanvasPlugins();
  for (const record of canvasPluginStore.list().filter((item) => item.enabled)) {
    try {
      const source = record.local ? (await resolvePluginSource(record.url, true)).source : record.source;
      activateCanvasPlugin(await evaluatePluginSource(source));
    } catch (error) {
      console.error('[CanvasPlugin] 加载失败：', record.id, error);
    }
  }
}

export async function discoverLocalCanvasPlugins() {
  let urls: unknown;
  try {
    const response = await fetch('/plugins/index.json', { cache: 'no-store' });
    if (!response.ok) return;
    urls = await response.json();
  } catch {
    return;
  }
  if (!Array.isArray(urls)) return;
  for (const item of urls) {
    if (typeof item !== 'string' || !item.trim()) continue;
    try {
      const resolved = await resolvePluginSource(item, true);
      const source = resolved.source;
      const plugin = await evaluatePluginSource(source);
      const existing = canvasPluginStore.list().find((record) => record.id === plugin.id);
      if (existing && !existing.local) continue;
      canvasPluginStore.upsert({
        id: plugin.id,
        name: plugin.name || plugin.id,
        version: plugin.version || '0.0.0',
        description: plugin.description,
        url: plugin.updateUrl || item,
        resolvedUrl: resolved.resolvedUrl,
        sourceKind: resolved.sourceKind,
        source,
        enabled: existing?.enabled ?? false,
        local: !plugin.updateUrl,
        installedAt: existing?.installedAt,
      });
    } catch (error) {
      console.error('[CanvasPlugin] 本地插件发现失败：', item, error);
    }
  }
}

export function activeCanvasPlugins() {
  return [...activePlugins.values()];
}
