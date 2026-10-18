import { BaseProvider } from '../providers/baseProvider.js';
import {
  isRecoverableProvider,
  matchesRemoteTask,
  remoteTaskReference,
} from '../generation/generationTaskRecovery.js';
import { providerFrameworkStore } from './store.js';
import { protocolById } from './protocols.js';
import {
  collectResultUrls,
  downloadTaskResult,
  fetchTaskSnapshot,
  isTaskProtocolAdapter,
  readTaskFailure,
  readTaskStatus,
  runTaskProtocol,
  taskProtocolSpec,
} from './taskProtocols.js';

function joinUrl(baseUrl, path) {
  const base = String(baseUrl || '').replace(/\/+$/, '');
  const suffix = String(path || '').trim();
  if (/^https?:\/\//i.test(suffix)) return suffix;
  return `${base}/${suffix.replace(/^\/+/, '')}`;
}

function valueAt(input, path) {
  if (!path) return undefined;
  return String(path).split('.').reduce((value, key) => value == null ? undefined : value[key], input);
}

function firstDefined(input, paths) {
  for (const path of paths || []) {
    const value = valueAt(input, path);
    if (value !== undefined && value !== null && value !== '') return value;
  }
}

function normalizeAsset(value) {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') return value.url || value.dataUrl || value.data_url || '';
  return '';
}

function templateValue(value, context) {
  if (typeof value === 'string') {
    const exact = /^\$([a-zA-Z0-9_.]+)$/.exec(value);
    if (exact) return valueAt(context, exact[1]);
    return value.replace(/\$\{([a-zA-Z0-9_.]+)\}/g, (_all, key) => {
      const resolved = valueAt(context, key);
      return resolved == null ? '' : String(resolved);
    });
  }
  if (Array.isArray(value)) return value.map((item) => templateValue(item, context));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, templateValue(item, context)]));
  }
  return value;
}

function runtimeFor(params) {
  const dynamic = params?.modelConfig?.dynamic;
  if (!dynamic) throw new Error('动态模型缺少运行配置');
  const state = providerFrameworkStore.read();
  const provider = state.providers.find((item) => item.id === dynamic.providerId);
  const protocol = protocolById(state, dynamic.protocolId);
  const model = state.models.find((item) => item.id === dynamic.modelId);
  if (!provider || !protocol || !model) throw new Error('动态供应商、协议或模型已不存在');
  return { state, provider, protocol, model };
}

function headers(provider, protocol, extra = {}) {
  return {
    ...(provider.apiKey ? { Authorization: `Bearer ${provider.apiKey}` } : {}),
    ...(protocol.contentType ? { 'Content-Type': protocol.contentType } : {}),
    ...(provider.headers || {}),
    ...extra,
  };
}

async function fetchJson(url, options, params) {
  BaseProvider.injectProxy(options, params.useProxy);
  const response = await BaseProvider.fetchWithSystemProxyFallback(url, options);
  const text = await response.text();
  let body;
  try { body = text ? JSON.parse(text) : {}; } catch { body = { raw: text }; }
  if (!response.ok) {
    const message = firstDefined(body, ['error.message', 'message', 'error', 'raw']);
    throw Object.assign(new Error(message ? String(message) : `HTTP ${response.status}`), { status: response.status });
  }
  return body;
}

function openAiMessages(params) {
  const images = BaseProvider.resolveInputImages(params.images || params.imageBase64 || []);
  const text = String(params.prompt || '');
  return [{
    role: 'user',
    content: images.length
      ? [
        { type: 'text', text },
        ...images.map((url) => ({ type: 'image_url', image_url: { url } })),
      ]
      : text,
  }];
}

async function generateText(params) {
  const { provider, protocol, model } = runtimeFor(params);
  const url = joinUrl(provider.baseUrl, protocol.createPath);
  let body;
  if (protocol.adapter === 'openai-chat-completions') {
    body = {
      model: model.upstreamModelId,
      messages: openAiMessages(params),
      ...(params.temperature == null ? {} : { temperature: params.temperature }),
      ...(params.max_tokens == null ? {} : { max_tokens: params.max_tokens }),
    };
  } else if (protocol.adapter === 'openai-responses') {
    const images = BaseProvider.resolveInputImages(params.images || params.imageBase64 || []);
    body = {
      model: model.upstreamModelId,
      input: [{
        role: 'user',
        content: [
          { type: 'input_text', text: String(params.prompt || '') },
          ...images.map((image_url) => ({ type: 'input_image', image_url })),
        ],
      }],
    };
  } else {
    body = templateValue(protocol.requestTemplate || {}, {
      model: model.upstreamModelId,
      prompt: String(params.prompt || ''),
      images: BaseProvider.resolveInputImages(params.images || params.imageBase64 || []),
      duration: params.duration,
      aspectRatio: params.aspectRatio,
      resolution: params.resolution,
      quality: params.quality,
      count: params.generateCount || 1,
      params,
    });
  }
  const result = await fetchJson(url, {
    method: protocol.method || 'POST',
    headers: headers(provider, protocol),
    body: JSON.stringify(body),
    signal: params.signal,
  }, params);
  const text = protocol.adapter === 'openai-chat-completions'
    ? firstDefined(result, ['choices.0.message.content'])
    : protocol.adapter === 'openai-responses'
      ? firstDefined(result, ['output_text', 'output.0.content.0.text'])
      : firstDefined(result, [protocol.response?.textPath, 'text', 'output_text'].filter(Boolean));
  if (typeof text !== 'string' || !text.trim()) throw new Error('模型响应中未找到文本结果');
  return { text: text.trim() };
}

const GPT_WEB_BASE_SIZE_MAP = Object.freeze({
  '1:1': [1254, 1254],
  '2:3': [1024, 1536],
  '3:2': [1536, 1024],
  '9:16': [941, 1672],
  '16:9': [1672, 941],
  '3:4': [1086, 1448],
  '4:3': [1448, 1086],
  '5:4': [1402, 1122],
  '4:5': [1122, 1402],
  '21:9': [1915, 821],
  '1:4': [626, 2508],
  '1:8': [443, 3544],
  '4:1': [2508, 626],
  '8:1': [3544, 443],
  '2:1': [1773, 887],
});

const CUSTOM_IMAGE_RESOLUTION_SCALE = Object.freeze({
  '512': 0.5,
  '1K': 1,
  '2K': 2,
  '4K': 4,
});

function normalizePixel(value) {
  return Math.max(1, Math.round(Number(value)));
}

export function resolveOpenAiImageSize(params = {}) {
  if (params.size) return String(params.size);

  const aspectRatio = String(params.aspectRatio || '1:1');
  const base = GPT_WEB_BASE_SIZE_MAP[aspectRatio] || GPT_WEB_BASE_SIZE_MAP['1:1'];
  const resolution = String(params.resolution || '1K').toUpperCase();
  const scale = CUSTOM_IMAGE_RESOLUTION_SCALE[resolution] || 1;
  const width = normalizePixel(base[0] * scale);
  const height = normalizePixel(base[1] * scale);
  return `${width}x${height}`;
}

export function buildImagePromptWithControls(params = {}, countOverride) {
  const count = Math.max(1, Math.trunc(Number(countOverride ?? params.generateCount) || 1));
  const aspectRatio = String(params.aspectRatio || '1:1');
  const size = resolveOpenAiImageSize(params);
  const prompt = String(params.prompt || '').trim();
  const controlText = [
    '输出要求：',
    `- 画面比例：${aspectRatio}`,
    `- 生成数量：${count}`,
    `- 目标尺寸：${size}`,
  ].join('\n');
  return prompt ? `${prompt}\n\n${controlText}` : controlText;
}

export function openAiImageBody(params, model, countOverride) {
  const count = Math.max(1, Math.trunc(Number(countOverride ?? params.generateCount) || 1));
  const size = resolveOpenAiImageSize(params);
  return {
    model: model.upstreamModelId,
    prompt: buildImagePromptWithControls(params, count),
    n: count,
    ...(size ? { size } : {}),
    ...(params.quality ? { quality: params.quality } : {}),
    ...(params.outputFormat ? { output_format: params.outputFormat } : {}),
  };
}

async function imageResultToBuffer(entry, params) {
  if (entry?.b64_json) return { buffer: Buffer.from(entry.b64_json, 'base64'), format: 'png' };
  const url = normalizeAsset(entry);
  if (!url) throw new Error('图片响应中未找到 URL 或 base64');
  return {
    buffer: await BaseProvider.asyncDownloadToBuffer(url, params.useProxy, { signal: params.signal }),
    format: String(params.outputFormat || 'png').toLowerCase(),
  };
}

const DYNAMIC_PROVIDER_NAME = 'DynamicProtocolProvider';

/** 收集当前配置里所有走异步任务协议的模型（恢复流程要按指纹重新匹配它们）。 */
function taskRuntimes(kind) {
  const state = providerFrameworkStore.read();
  const runtimes = [];
  for (const model of state.models) {
    if (model.capability !== kind) continue;
    const protocol = protocolById(state, model.protocolId);
    if (!protocol || !isTaskProtocolAdapter(protocol.adapter)) continue;
    const provider = state.providers.find((item) => item.id === model.providerId);
    if (!provider) continue;
    runtimes.push({ provider, protocol, model });
  }
  return runtimes;
}

function taskRecoveryContext(runtime, taskId) {
  const { provider, protocol, model } = runtime;
  return {
    taskId,
    providerName: DYNAMIC_PROVIDER_NAME,
    modelId: model.id,
    submitUrl: joinUrl(provider.baseUrl, protocol.createPath),
    queryUrl: joinUrl(
      provider.baseUrl,
      String(protocol.pollPath || '').replace('{taskId}', encodeURIComponent(String(taskId))),
    ),
    apiKey: provider.apiKey,
  };
}

function runtimeForReference(kind, reference, hint) {
  if (!reference?.taskId) return null;
  const runtimes = taskRuntimes(kind);
  const preferred = hint
    ? runtimes.filter((runtime) => runtime.model.upstreamModelId === hint || runtime.model.name === hint)
    : [];
  for (const runtime of [...preferred, ...runtimes]) {
    try {
      if (matchesRemoteTask(reference, taskRecoveryContext(runtime, reference.taskId))) return runtime;
    } catch {
      // 配置里的 URL 不合法时跳过这个候选。
    }
  }
  return null;
}

export function canRecoverTask(kind, reference, hint) {
  return Boolean(runtimeForReference(kind, reference, hint));
}

export async function recoverTask(kind, task, params, _config, signal, io = {}) {
  const references = (kind === 'image' ? task.remoteTasks || [] : [task.remoteTask]).filter(Boolean);
  if (!references.length) return { status: 'unknown' };
  const useProxy = params?.useProxy === true || task.useProxy === true;
  const request =
    io.request || ((target, options) => fetchJson(target, options, { useProxy }));
  const download =
    io.download ||
    ((target) => BaseProvider.asyncDownloadToBuffer(target, useProxy, { signal }));
  const hint = kind === 'image' ? params?.imageModel : params?.videoModel;
  const downloaded = [];
  let pending = false;
  let failureMessage = '';
  for (const reference of references) {
    const runtime = runtimeForReference(kind, reference, hint);
    if (!runtime) return { status: 'unknown', reason: 'settings_changed' };
    const spec = taskProtocolSpec(runtime.protocol.adapter);
    if (!spec) return { status: 'unknown' };
    const payload = await fetchTaskSnapshot({
      spec,
      provider: runtime.provider,
      protocol: runtime.protocol,
      taskId: reference.taskId,
      request,
      signal,
    });
    const status = readTaskStatus(spec, payload);
    if (!status) {
      pending = true;
      continue;
    }
    if ((spec.failureStatuses || []).includes(status)) {
      failureMessage = readTaskFailure(spec, payload, status);
      continue;
    }
    if (!(spec.successStatuses || []).includes(status)) {
      pending = true;
      continue;
    }
    const urls = collectResultUrls(spec, payload);
    if (!urls.length) {
      pending = true;
      continue;
    }
    for (const mediaUrl of urls) {
      downloaded.push(await downloadTaskResult(spec, mediaUrl, download));
    }
  }
  if (!downloaded.length) {
    return pending
      ? { status: 'pending' }
      : { status: 'failed', error: new Error(failureMessage || '上游任务未返回结果') };
  }
  if (kind === 'video') return { status: 'success', buffer: downloaded[0].buffer, format: downloaded[0].format };
  const requested = Math.max(1, Number(task.requestedCount) || references.length);
  return { status: downloaded.length < requested ? 'partial' : 'success', results: downloaded };
}

async function generateTaskMedia(kind, params, runtime, config) {
  const { provider, protocol, model } = runtime;
  const spec = taskProtocolSpec(protocol.adapter);
  if (!spec) throw new Error('未知的异步任务协议');
  return runTaskProtocol({
    spec,
    provider,
    protocol,
    model,
    params,
    request: (target, options) => fetchJson(target, options, params),
    download: (target) =>
      BaseProvider.asyncDownloadToBuffer(target, params.useProxy, { signal: params.signal }),
    timeoutMs: BaseProvider.parseTimeToMs(params.timeEstimate || (kind === 'image' ? '5min' : '20min')),
    // 提交、轮询、下载都可能中途断线：把上游任务编号报给框架后，画布可以稍后核对同一任务，
    // 而不是让用户重新付费生成一次。
    onBeforeSubmit: (slot) => config?.generationTaskSubmitting?.(slot),
    onSubmitted: (taskId, slot) => {
      const reference = remoteTaskReference(taskRecoveryContext(runtime, taskId));
      if (reference) config?.generationTaskSubmitted?.(reference, slot);
    },
    markSubmissionUncertain: isRecoverableProvider(kind, DYNAMIC_PROVIDER_NAME),
  });
}

async function generateImage(params, config) {
  const runtime = runtimeFor(params);
  const { provider, protocol, model } = runtime;
  if (protocol.adapter === 'openai-images') {
    const images = BaseProvider.resolveInputImages(params.images || params.imageBase64 || []);
    const desiredCount = Math.max(1, Math.trunc(Number(params.generateCount) || 1));
    if (params.imageMode === 'image-to-image' && images.length) {
      const source = await BaseProvider.asyncDownloadToBuffer(images[0], params.useProxy, { signal: params.signal });
      const entries = [];
      while (entries.length < desiredCount) {
        const remaining = desiredCount - entries.length;
        const form = new FormData();
        const fields = openAiImageBody(params, model, remaining);
        for (const [key, value] of Object.entries(fields)) {
          if (value !== undefined && value !== null) form.append(key, String(value));
        }
        form.append('image', new Blob([source], { type: 'image/png' }), 'image.png');
        const result = await fetchJson(joinUrl(provider.baseUrl, protocol.editPath || '/v1/images/edits'), {
          method: 'POST',
          headers: {
            ...(provider.apiKey ? { Authorization: `Bearer ${provider.apiKey}` } : {}),
            ...(provider.headers || {}),
          },
          body: form,
          signal: params.signal,
        }, params);
        const batch = Array.isArray(result?.data) ? result.data : [];
        if (!batch.length) throw new Error('图片编辑接口没有返回 data');
        entries.push(...batch.slice(0, remaining));
      }
      return Promise.all(entries.map((entry) => imageResultToBuffer(entry, params)));
    }

    const entries = [];
    while (entries.length < desiredCount) {
      const remaining = desiredCount - entries.length;
      const result = await fetchJson(joinUrl(provider.baseUrl, protocol.createPath), {
        method: 'POST',
        headers: headers(provider, protocol),
        body: JSON.stringify(openAiImageBody(params, model, remaining)),
        signal: params.signal,
      }, params);
      const batch = Array.isArray(result?.data) ? result.data : [];
      if (!batch.length) throw new Error('图片接口没有返回 data');
      entries.push(...batch.slice(0, remaining));
    }
    return Promise.all(entries.map((entry) => imageResultToBuffer(entry, params)));
  }
  if (isTaskProtocolAdapter(protocol.adapter))
    return generateTaskMedia('image', params, runtime, config);
  return generateDeclarativeMedia('image', params, { provider, protocol, model });
}

async function generateDeclarativeMedia(kind, params, runtime = runtimeFor(params)) {
  const { provider, protocol, model } = runtime;
  const context = {
    model: model.upstreamModelId,
    prompt: kind === 'image'
      ? buildImagePromptWithControls(params, params.generateCount)
      : String(params.prompt || ''),
    images: BaseProvider.resolveInputImages(params.images || params.imageBase64 || []),
    videos: (params.videos || []).map(normalizeAsset).filter(Boolean),
    audios: (params.audios || []).map(normalizeAsset).filter(Boolean),
    duration: params.duration,
    aspectRatio: params.aspectRatio,
    resolution: params.resolution,
    size: kind === 'image' ? resolveOpenAiImageSize(params) : undefined,
    quality: params.quality,
    count: params.generateCount || 1,
    params,
  };
  const body = templateValue(protocol.requestTemplate || {}, context);
  let payload = await fetchJson(joinUrl(provider.baseUrl, protocol.createPath), {
    method: protocol.method || 'POST',
    headers: headers(provider, protocol),
    body: JSON.stringify(body),
    signal: params.signal,
  }, params);

  const responseMap = protocol.response || {};
  const taskId = valueAt(payload, responseMap.taskIdPath);
  if (taskId && protocol.pollPath) {
    const success = new Set(responseMap.successStatuses || ['succeeded', 'success', 'completed']);
    const failed = new Set(responseMap.failureStatuses || ['failed', 'error', 'cancelled']);
    const timeout = Date.now() + BaseProvider.parseTimeToMs(params.timeEstimate || '10min');
    while (Date.now() < timeout) {
      await new Promise((resolve) => setTimeout(resolve, Math.max(500, Number(responseMap.pollIntervalMs) || 1500)));
      const pollPath = String(protocol.pollPath).replace(/\{taskId\}/g, encodeURIComponent(String(taskId)));
      payload = await fetchJson(joinUrl(provider.baseUrl, pollPath), {
        method: 'GET',
        headers: headers(provider, protocol, { 'Content-Type': undefined }),
        signal: params.signal,
      }, params);
      const status = String(valueAt(payload, responseMap.statusPath) || '').toLowerCase();
      if (success.has(status)) break;
      if (failed.has(status)) throw new Error(String(firstDefined(payload, [responseMap.errorPath, 'error.message', 'message']) || '上游任务失败'));
    }
  }

  if (kind === 'text') {
    const text = valueAt(payload, responseMap.textPath);
    if (typeof text !== 'string') throw new Error('声明式协议未找到文本结果');
    return { text };
  }

  let urls = [];
  const mapped = valueAt(payload, responseMap.resultPath);
  if (Array.isArray(mapped)) urls = mapped.map(normalizeAsset).filter(Boolean);
  else if (mapped) urls = [normalizeAsset(mapped)].filter(Boolean);
  if (!urls.length) {
    const common = firstDefined(payload, ['data', 'output', 'results', 'result.url', 'url']);
    if (Array.isArray(common)) urls = common.map(normalizeAsset).filter(Boolean);
    else if (common) urls = [normalizeAsset(common)].filter(Boolean);
  }
  if (!urls.length) throw new Error('声明式协议未找到媒体结果');

  return Promise.all(urls.map(async (url) => ({
    buffer: await BaseProvider.asyncDownloadToBuffer(url, params.useProxy, { signal: params.signal }),
    format: kind === 'video' ? 'mp4' : kind === 'audio' ? 'mp3' : 'png',
  })));
}

export const DynamicProtocolProvider = Object.freeze({
  generateText,
  generateImage,
  generateVideo: (params, config) => {
    const runtime = runtimeFor(params);
    return isTaskProtocolAdapter(runtime.protocol.adapter)
      ? generateTaskMedia('video', params, runtime, config)
      : generateDeclarativeMedia('video', params, runtime);
  },
  generateAudio: (params, config) => {
    const runtime = runtimeFor(params);
    return isTaskProtocolAdapter(runtime.protocol.adapter)
      ? generateTaskMedia('audio', params, runtime, config)
      : generateDeclarativeMedia('audio', params, runtime);
  },
  // 断线后的核对入口：只要上游任务编号还在，就能取回已经生成好的结果，不必重新付费生成。
  canRecoverImage: (reference, params) => canRecoverTask('image', reference, params?.imageModel),
  recoverImage: (task, params, config, signal) => recoverTask('image', task, params, config, signal),
  canRecoverVideo: (reference, params) => canRecoverTask('video', reference, params?.videoModel),
  recoverVideo: (task, params, config, signal) => recoverTask('video', task, params, config, signal),
});
