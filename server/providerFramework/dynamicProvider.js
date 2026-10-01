import { BaseProvider } from '../providers/baseProvider.js';
import { providerFrameworkStore } from './store.js';
import { protocolById } from './protocols.js';

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

function openAiImageBody(params, model) {
  const count = Math.max(1, Number(params.generateCount) || 1);
  const size = params.size || ({
    '1:1': '1024x1024',
    '2:3': '1024x1536',
    '3:2': '1536x1024',
    '9:16': '1024x1536',
    '16:9': '1536x1024',
  }[params.aspectRatio] || undefined);
  return {
    model: model.upstreamModelId,
    prompt: String(params.prompt || ''),
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

async function generateImage(params) {
  const { provider, protocol, model } = runtimeFor(params);
  if (protocol.adapter === 'openai-images') {
    const images = BaseProvider.resolveInputImages(params.images || params.imageBase64 || []);
    if (params.imageMode === 'image-to-image' && images.length) {
      const source = await BaseProvider.asyncDownloadToBuffer(images[0], params.useProxy, { signal: params.signal });
      const form = new FormData();
      const fields = openAiImageBody(params, model);
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
      const entries = Array.isArray(result?.data) ? result.data : [];
      if (!entries.length) throw new Error('图片编辑接口没有返回 data');
      return Promise.all(entries.map((entry) => imageResultToBuffer(entry, params)));
    }
    const result = await fetchJson(joinUrl(provider.baseUrl, protocol.createPath), {
      method: 'POST',
      headers: headers(provider, protocol),
      body: JSON.stringify(openAiImageBody(params, model)),
      signal: params.signal,
    }, params);
    const entries = Array.isArray(result?.data) ? result.data : [];
    if (!entries.length) throw new Error('图片接口没有返回 data');
    return Promise.all(entries.map((entry) => imageResultToBuffer(entry, params)));
  }
  return generateDeclarativeMedia('image', params, { provider, protocol, model });
}

async function generateDeclarativeMedia(kind, params, runtime = runtimeFor(params)) {
  const { provider, protocol, model } = runtime;
  const context = {
    model: model.upstreamModelId,
    prompt: String(params.prompt || ''),
    images: BaseProvider.resolveInputImages(params.images || params.imageBase64 || []),
    videos: (params.videos || []).map(normalizeAsset).filter(Boolean),
    audios: (params.audios || []).map(normalizeAsset).filter(Boolean),
    duration: params.duration,
    aspectRatio: params.aspectRatio,
    resolution: params.resolution,
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
  generateVideo: (params) => generateDeclarativeMedia('video', params),
  generateAudio: (params) => generateDeclarativeMedia('audio', params),
});
