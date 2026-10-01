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
  const source = await fetchPluginSource(url, options?.bustCache);
  const plugin = await evaluatePluginSource(source);
  const record = canvasPluginStore.upsert({
    id: plugin.id,
    name: plugin.name || plugin.id,
    version: plugin.version || '0.0.0',
    description: plugin.description,
    url: plugin.updateUrl || url,
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
  const source = record.local ? await fetchPluginSource(record.url, true) : record.source;
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
      const source = record.local ? await fetchPluginSource(record.url, true) : record.source;
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
      const source = await fetchPluginSource(item, true);
      const plugin = await evaluatePluginSource(source);
      const existing = canvasPluginStore.list().find((record) => record.id === plugin.id);
      if (existing && !existing.local) continue;
      canvasPluginStore.upsert({
        id: plugin.id,
        name: plugin.name || plugin.id,
        version: plugin.version || '0.0.0',
        description: plugin.description,
        url: plugin.updateUrl || item,
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
