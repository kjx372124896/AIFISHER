import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { RUNTIME_PATHS } from '../workspace/runtimePaths.js';

const DEFAULT_PATH = path.join(RUNTIME_PATHS.PRIVATE_DIR, 'provider-framework.json');

function cleanString(value, max = 2000) {
  const result = String(value ?? '').trim();
  if (result.length > max || /[\0]/.test(result)) throw new Error('配置内容无效');
  return result;
}

function writeAtomic(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tmp = `${filePath}.${process.pid}.${crypto.randomUUID()}.tmp`;
  try {
    fs.writeFileSync(tmp, JSON.stringify(value, null, 2), { encoding: 'utf8', mode: 0o600 });
    try { fs.chmodSync(tmp, 0o600); } catch {}
    fs.renameSync(tmp, filePath);
    try { fs.chmodSync(filePath, 0o600); } catch {}
  } finally {
    if (fs.existsSync(tmp)) fs.rmSync(tmp, { force: true });
  }
}

function normalizeProvider(input, previous = {}) {
  const id = cleanString(input.id || previous.id || crypto.randomUUID(), 120);
  return {
    id,
    name: cleanString(input.name ?? previous.name, 120),
    baseUrl: cleanString(input.baseUrl ?? previous.baseUrl, 2000).replace(/\/+$/, ''),
    apiKey: input.apiKey === '********' ? String(previous.apiKey || '') : cleanString(input.apiKey ?? previous.apiKey, 8000),
    modelsPath: cleanString(input.modelsPath ?? previous.modelsPath ?? '/v1/models', 500) || '/v1/models',
    headers: input.headers && typeof input.headers === 'object' && !Array.isArray(input.headers)
      ? Object.fromEntries(Object.entries(input.headers).map(([key, value]) => [cleanString(key, 120), cleanString(value, 2000)]))
      : (previous.headers || {}),
  };
}

function normalizeProtocol(input, previous = {}) {
  const id = cleanString(input.id || previous.id || crypto.randomUUID(), 120);
  const capability = cleanString(input.capability ?? previous.capability, 40);
  if (!['text', 'image', 'video', 'audio'].includes(capability)) throw new Error('协议能力类型无效');
  return {
    id,
    label: cleanString(input.label ?? previous.label, 120),
    capability,
    adapter: 'declarative',
    createPath: cleanString(input.createPath ?? previous.createPath, 500),
    pollPath: cleanString(input.pollPath ?? previous.pollPath, 500),
    method: cleanString(input.method ?? previous.method ?? 'POST', 16).toUpperCase(),
    contentType: cleanString(input.contentType ?? previous.contentType ?? 'application/json', 120),
    requestTemplate: input.requestTemplate && typeof input.requestTemplate === 'object' ? input.requestTemplate : (previous.requestTemplate || {}),
    response: input.response && typeof input.response === 'object' ? input.response : (previous.response || {}),
  };
}

function normalizeModel(input, previous = {}) {
  const id = cleanString(input.id || previous.id || crypto.randomUUID(), 120);
  const capability = cleanString(input.capability ?? previous.capability, 40);
  if (!['text', 'image', 'video', 'audio'].includes(capability)) throw new Error('模型类型无效');
  return {
    id,
    providerId: cleanString(input.providerId ?? previous.providerId, 120),
    name: cleanString(input.name ?? previous.name, 160),
    upstreamModelId: cleanString(input.upstreamModelId ?? previous.upstreamModelId, 240),
    capability,
    protocolId: cleanString(input.protocolId ?? previous.protocolId, 120),
    maxConcurrent: Math.max(1, Math.min(100, Number(input.maxConcurrent ?? previous.maxConcurrent ?? 1) || 1)),
    useProxy: Boolean(input.useProxy ?? previous.useProxy ?? false),
    modes: Array.isArray(input.modes) ? input.modes.map((value) => cleanString(value, 80)).filter(Boolean) : (previous.modes || []),
    advancedParams: Array.isArray(input.advancedParams) ? input.advancedParams : (previous.advancedParams || []),
  };
}

export function createProviderFrameworkStore({ filePath = DEFAULT_PATH } = {}) {
  const read = () => {
    try {
      const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return {
        providers: Array.isArray(parsed.providers) ? parsed.providers : [],
        models: Array.isArray(parsed.models) ? parsed.models : [],
        protocols: Array.isArray(parsed.protocols) ? parsed.protocols : [],
      };
    } catch (error) {
      if (error?.code !== 'ENOENT') console.warn('[ProviderFramework] 配置读取失败：', error?.message || error);
      return { providers: [], models: [], protocols: [] };
    }
  };
  const save = (state) => writeAtomic(filePath, state);
  const update = (fn) => {
    const current = read();
    const next = fn(current) || current;
    save(next);
    return next;
  };

  return {
    read,
    publicState() {
      const state = read();
      return {
        ...state,
        providers: state.providers.map(({ apiKey, ...provider }) => ({
          ...provider,
          apiKey: apiKey ? '********' : '',
          configured: Boolean(provider.baseUrl),
        })),
      };
    },
    upsertProvider(input) {
      let result;
      update((state) => {
        const index = state.providers.findIndex((item) => item.id === input.id);
        const previous = index >= 0 ? state.providers[index] : {};
        result = normalizeProvider(input, previous);
        if (!result.name || !result.baseUrl) throw new Error('供应商名称和 Base URL 必填');
        if (index >= 0) state.providers[index] = result;
        else state.providers.push(result);
        return state;
      });
      return result;
    },
    deleteProvider(id) {
      update((state) => ({
        ...state,
        providers: state.providers.filter((item) => item.id !== id),
        models: state.models.filter((item) => item.providerId !== id),
      }));
    },
    upsertModel(input) {
      let result;
      update((state) => {
        if (!state.providers.some((item) => item.id === input.providerId)) throw new Error('供应商不存在');
        const index = state.models.findIndex((item) => item.id === input.id);
        const previous = index >= 0 ? state.models[index] : {};
        result = normalizeModel(input, previous);
        if (!result.name || !result.upstreamModelId || !result.protocolId) throw new Error('模型名称、上游 Model ID、协议必填');
        if (index >= 0) state.models[index] = result;
        else state.models.push(result);
        return state;
      });
      return result;
    },
    deleteModel(id) {
      update((state) => ({ ...state, models: state.models.filter((item) => item.id !== id) }));
    },
    upsertProtocol(input) {
      let result;
      update((state) => {
        const index = state.protocols.findIndex((item) => item.id === input.id);
        const previous = index >= 0 ? state.protocols[index] : {};
        result = normalizeProtocol(input, previous);
        if (!result.label || !result.createPath) throw new Error('协议名称和创建路径必填');
        if (index >= 0) state.protocols[index] = result;
        else state.protocols.push(result);
        return state;
      });
      return result;
    },
    deleteProtocol(id) {
      update((state) => ({
        ...state,
        protocols: state.protocols.filter((item) => item.id !== id),
        models: state.models.filter((item) => item.protocolId !== id),
      }));
    },
    filePath,
  };
}

export const providerFrameworkStore = createProviderFrameworkStore();
