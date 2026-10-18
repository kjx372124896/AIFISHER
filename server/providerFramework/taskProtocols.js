/**
 * taskProtocols.js
 *
 * 「提交任务 → 轮询任务 → 取媒体直链」这一类异步任务接口的通用适配层。
 * 目前覆盖 Seedance 中转站（api.seedance.nz）的六组接口，它们只有请求体、状态枚举和
 * 结果位置不同，因此用「协议描述表 + 统一执行器」实现，避免为每个模型写一份 provider：
 *
 *   - 图片：POST /v1/image/generations   → GET /v1/image/generations/{taskId}
 *   - 视频：POST /v1/videos              → GET /v1/videos/{taskId}
 *   - 视频：POST /v1/video/generations   → GET /v1/video/generations/{taskId}
 *   - 音频：POST /v1/audio/generations   → GET /v1/audio/generations/{taskId}
 *   - 音乐：POST /v1/music/generations   → GET /v1/music/tasks/{taskId}
 *   - 图片：POST /v1/midjourney/generations → GET /v1/midjourney/tasks/{taskId}
 *
 * 该中转站要求参考素材是公网直链，不接受 base64 / 本地路径，所以本地素材会先走
 * POST /v1/files/upload 换成 24 小时有效的地址（spec.uploadPath）。
 */

import { BaseProvider } from '../providers/baseProvider.js';

const HTTP_URL = /^https?:\/\//i;
const DATA_URL = /^data:([^;,]*)?(;base64)?,(.*)$/is;

/** 这些模型的 metadata.ratio 是公开参数，其它图片模型只认 resolution / 尺寸。 */
const IMAGE_RATIO_MODELS =
  /zhenzhen-image-g2|zhenzhen-image-nb|zhenzhen-image-gk-v2-edit|zhenzhen-image-g-v2-lowprice|qwen-image|flux-3-image|mai-image|wan-2\.7-global/i;

/** 海螺 H3 Max / MiniMax H3 OW 的分辨率枚举是大写。 */
const UPPERCASE_RESOLUTION_MODELS = /^hailuo-h3-max|^minimax-h3-ow/i;

/** 视频超分族：只接受 metadata.content 里的一条 video_url。 */
const UPSCALE_VIDEO_MODELS = /upscal|flashvsr|vosr2-video/i;

/** 视频改写族：参考视频走 metadata.video_url。 */
const VIDEO_EDIT_MODELS = /-v2v$|draft-enhance/i;

/** Seedance 多模态族：参考素材统一放进 metadata.content。 */
const MULTIMODAL_VIDEO_MODELS = /-multi$/i;

/** 动作迁移：images 恰好一张 + metadata.video_url 一条（数组形式）。 */
const ANIMATE_VIDEO_MODELS = /^animate-/i;

const IMAGE_RESOLUTION_ALIASES = Object.freeze({
  '512': '1k',
  '1k': '1k',
  '1.5k': '1.5k',
  '2k': '2k',
  '4k': '4k',
  auto: 'auto',
});

const KNOWN_FORMATS = new Set([
  'png',
  'jpg',
  'jpeg',
  'webp',
  'mp4',
  'mov',
  'webm',
  'mp3',
  'wav',
  'ogg',
  'm4a',
  'glb',
]);

const SUNO_VERSIONS = new Set(['v3.5', 'v4', 'v4.5', 'v4.5+', 'v4.5-all', 'v5', 'v5.5']);

const IMAGE_EXTS = Object.freeze({
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
});

const MEDIA_EXTS = Object.freeze({
  ...IMAGE_EXTS,
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
});

function lower(value) {
  return String(value ?? '').trim().toLowerCase();
}

function compact(entries) {
  return Object.fromEntries(
    Object.entries(entries).filter(([, value]) => {
      if (value === undefined || value === null || value === '') return false;
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'object') return Object.keys(value).length > 0;
      return true;
    }),
  );
}

export function valueAt(input, path) {
  if (!path) return undefined;
  return String(path)
    .split('.')
    .reduce((value, key) => (value == null ? undefined : value[key]), input);
}

function firstValue(input, paths) {
  for (const path of paths || []) {
    const value = valueAt(input, path);
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return undefined;
}

export function normalizeImageResolution(value) {
  return IMAGE_RESOLUTION_ALIASES[lower(value)];
}

export function normalizeVideoResolution(value, model = '') {
  const key = lower(value);
  if (!key) return undefined;
  if (!/^[0-9]{3,4}p$|^[0-9]k$|^native[0-9]k$/i.test(key)) return undefined;
  return UPPERCASE_RESOLUTION_MODELS.test(String(model)) ? key.toUpperCase() : key;
}

export function normalizeRatio(value) {
  const key = lower(value);
  if (!key || key === 'adaptive' || key === 'auto') return undefined;
  return /^\d{1,2}:\d{1,2}$/.test(key) ? key : undefined;
}

export function normalizeSeconds(value) {
  const seconds = Number(value);
  if (!Number.isFinite(seconds)) return undefined;
  const rounded = Math.trunc(seconds);
  return String(rounded >= -1 ? rounded : 1);
}

function mediaExtension(mime) {
  return MEDIA_EXTS[lower(mime)] || 'png';
}

/** 把本地 data URL 换成公网直链；http(s) 地址原样保留。 */
async function ensurePublicAsset(value, { uploadPath, request, url, authHeaders, signal }) {
  if (HTTP_URL.test(value)) return value;
  if (!uploadPath) return value;
  const match = DATA_URL.exec(value);
  if (!match) return value;
  const mime = (match[1] || 'application/octet-stream').trim() || 'application/octet-stream';
  const buffer = Buffer.from(String(match[3] || '').replace(/\s+/g, ''), match[2] ? 'base64' : 'utf8');
  const form = BaseProvider.createFormData();
  form.append('file', new Blob([buffer], { type: mime }), `asset.${mediaExtension(mime)}`);
  const payload = await request(url(uploadPath), {
    method: 'POST',
    headers: authHeaders,
    body: form,
    signal,
  });
  const uploaded = firstValue(payload, ['url', 'data.url', 'file_url', 'data.file_url']);
  if (typeof uploaded !== 'string' || !HTTP_URL.test(uploaded)) {
    throw new Error('参考素材上传失败：上游没有返回公网地址');
  }
  return uploaded;
}

async function resolveAssets(spec, { params, request, url, authHeaders, signal }) {
  const options = { uploadPath: spec.uploadPath, request, url, authHeaders, signal };
  const images = BaseProvider.resolveInputImages(params.images || params.imageBase64 || []).slice(0, 16);
  const videos = BaseProvider.resolveInputVideos(params.videos || params.videoUrl || []).slice(0, 4);
  const audios = BaseProvider.resolveInputAudios(params.audios || params.audioBase64 || []).slice(0, 4);
  const upload = async (item) => {
    try {
      return await ensurePublicAsset(item, options);
    } catch (error) {
      if (error?.code === 'REFERENCE_UPLOAD_FAILED') throw error;
      // 统一成框架认识的诊断码：这类失败发生在提交之前，不会产生上游扣费。
      throw Object.assign(new Error(error?.message || '参考素材上传失败'), {
        code: 'REFERENCE_UPLOAD_FAILED',
        status: Number(error?.status) || 0,
        cause: error?.cause,
      });
    }
  };
  const [uploadedImages, uploadedVideos, uploadedAudios] = await Promise.all([
    Promise.all(images.map((item) => upload(item))),
    Promise.all(videos.map((item) => upload(item))),
    Promise.all(audios.map((item) => upload(item))),
  ]);
  return {
    images: uploadedImages.filter((item) => HTTP_URL.test(item)),
    videos: uploadedVideos.filter((item) => HTTP_URL.test(item)),
    audios: uploadedAudios.filter((item) => HTTP_URL.test(item)),
  };
}

export function buildImageTaskBody(model, assets = { images: [] }, params = {}) {
  const metadata = compact({
    resolution: normalizeImageResolution(params.resolution),
    ratio: IMAGE_RATIO_MODELS.test(String(model)) ? normalizeRatio(params.aspectRatio) : undefined,
    output_format: params.outputFormat ? lower(params.outputFormat) : undefined,
  });
  return compact({
    model,
    prompt: String(params.prompt || '').trim(),
    images: (assets.images || []).length ? assets.images : undefined,
    metadata,
  });
}

function assetContent(assets) {
  return [
    ...(assets.images || []).map((url) => ({ type: 'image_url', image_url: { url } })),
    ...(assets.videos || []).map((url) => ({ type: 'video_url', video_url: { url } })),
    ...(assets.audios || []).map((url) => ({ type: 'audio_url', audio_url: { url } })),
  ];
}

export function buildVideoTaskBody(
  model,
  assets = { images: [], videos: [], audios: [] },
  params = {},
) {
  const name = String(model || '');
  const images = assets.images || [];
  const videos = assets.videos || [];
  const audios = assets.audios || [];
  const body = compact({
    model,
    prompt: String(params.prompt || '').trim(),
    seconds: normalizeSeconds(params.duration),
  });
  const metadata = compact({
    resolution: normalizeVideoResolution(params.resolution, name),
    ratio: normalizeRatio(params.aspectRatio),
    generate_audio: typeof params.generate_audio === 'boolean' ? params.generate_audio : undefined,
  });

  if (UPSCALE_VIDEO_MODELS.test(name)) {
    if (!videos[0]) throw new Error('视频超分需要 1 个参考视频');
    // 超分模型不接受 prompt / seconds，时长由上游从输入视频读取。
    delete body.prompt;
    delete body.seconds;
    metadata.content = [{ type: 'video_url', video_url: { url: videos[0] } }];
  } else if (ANIMATE_VIDEO_MODELS.test(name)) {
    if (!images[0]) throw new Error('动作迁移需要 1 张角色图片');
    if (!videos[0]) throw new Error('动作迁移需要 1 个参考视频');
    body.images = [images[0]];
    metadata.video_url = [videos[0]];
  } else if (VIDEO_EDIT_MODELS.test(name)) {
    if (videos[0]) metadata.video_url = videos[0];
    if (images.length) body.images = images;
  } else if (MULTIMODAL_VIDEO_MODELS.test(name)) {
    const content = assetContent({ images, videos, audios });
    if (!content.length) throw new Error('多模态视频至少需要 1 个参考素材');
    // 一旦传 metadata.content，顶层 images 会被整体覆盖，所以图片也只放在 content 里。
    metadata.content = content;
  } else {
    if (images.length) body.images = images;
    if (videos[0]) metadata.video_url = videos[0];
    if (audios[0]) metadata.audio_url = audios[0];
  }

  return compact({ ...body, metadata });
}

export function buildAudioTaskBody(model, assets = { images: [], audios: [] }, params = {}) {
  const images = assets.images || [];
  const audios = assets.audios || [];
  const metadata = compact({
    ...(/voice-clone/i.test(String(model)) && audios[0] ? { audio_url: audios[0] } : {}),
  });
  return compact({
    model,
    prompt: String(params.prompt || '').trim(),
    // 参考图与 speaker / 参考音频互斥，这里只透传用户明确挂上的图片（取首张）。
    images: images.length ? [images[0]] : undefined,
    metadata,
  });
}

export function buildMusicTaskBody(model, params = {}) {
  const requested = lower(params.musicVersion || params.version);
  const version = SUNO_VERSIONS.has(requested) ? requested : 'v5.5';
  return compact({
    // Suno 的 model 字段不参与路由，固定写 suno，避免被上游当成未知模型。
    model: 'suno',
    version,
    prompt: String(params.prompt || '').trim(),
    custom: params.customLyrics === true ? true : false,
    instrumental: params.instrumental === true ? true : undefined,
    title: params.title ? String(params.title) : undefined,
  });
}

export function buildMidjourneyBody(model, assets = { images: [] }, params = {}) {
  const images = assets.images || [];
  return compact({
    prompt: String(params.prompt || '').trim(),
    // MJ 的 size 直接使用比例枚举；未指定时交给上游默认。
    size: normalizeRatio(params.aspectRatio),
    image_urls: images.length ? images : undefined,
  });
}

const BODY_BUILDERS = Object.freeze({
  image: buildImageTaskBody,
  video: buildVideoTaskBody,
  audio: buildAudioTaskBody,
  music: buildMusicTaskBody,
  midjourney: buildMidjourneyBody,
});

export function buildTaskBody(kind, model, assets, params) {
  const builder = BODY_BUILDERS[kind];
  if (!builder) throw new Error(`未知的任务类型：${kind}`);
  return builder(model, assets, params);
}

export function readTaskId(spec, payload) {
  const value = firstValue(payload, spec.taskIdPaths);
  return value === undefined || value === null ? '' : String(value);
}

export function readTaskStatus(spec, payload) {
  return lower(firstValue(payload, spec.statusPaths));
}

export function readTaskFailure(spec, payload, status) {
  const hint = spec.failureHints?.[status];
  const message = firstValue(payload, spec.errorPaths);
  if (typeof message === 'string' && message.trim()) return message.trim();
  return hint || `上游任务失败（${status || 'unknown'}）`;
}

function urlsFromValue(value, itemKeys) {
  const items = Array.isArray(value) ? value : [value];
  const urls = [];
  for (const item of items) {
    if (typeof item === 'string' && HTTP_URL.test(item)) {
      urls.push(item);
      continue;
    }
    if (!item || typeof item !== 'object') continue;
    for (const key of itemKeys) {
      const candidate = item[key];
      if (typeof candidate === 'string' && HTTP_URL.test(candidate)) {
        urls.push(candidate);
        break;
      }
    }
  }
  return urls;
}

export function collectResultUrls(spec, payload) {
  for (const path of spec.resultPaths || []) {
    const urls = urlsFromValue(valueAt(payload, path), spec.itemKeys);
    if (urls.length) return [...new Set(urls)];
  }
  return [];
}

function formatForUrl(spec, mediaUrl) {
  const match = /\.([a-z0-9]{2,4})(?:[?#]|$)/i.exec(mediaUrl);
  const extension = match?.[1]?.toLowerCase();
  if (extension && KNOWN_FORMATS.has(extension)) return extension === 'jpeg' ? 'jpg' : extension;
  return spec.defaultFormat;
}

function resolveUrl(baseUrl, path) {
  const suffix = String(path || '').trim();
  if (HTTP_URL.test(suffix)) return suffix;
  return `${String(baseUrl || '').replace(/\/+$/, '')}/${suffix.replace(/^\/+/, '')}`;
}

async function pollTask({ spec, taskId, request, baseUrl, authHeaders, signal, timeoutMs }) {
  const pollPath = String(spec.pollPath).replace(/\{taskId\}/g, encodeURIComponent(taskId));
  return BaseProvider.pollTask({
    interval: Math.max(250, Number(spec.pollIntervalMs) || 3000),
    timeoutMs,
    taskId,
    pollFn: async () => {
      const payload = await request(resolveUrl(baseUrl, pollPath), {
        method: 'GET',
        headers: authHeaders,
        signal,
      });
      const status = readTaskStatus(spec, payload);
      if (!status) return { done: false };
      if ((spec.successStatuses || []).includes(status)) return { done: true, data: payload };
      if ((spec.failureStatuses || []).includes(status)) {
        return { error: readTaskFailure(spec, payload, status) };
      }
      return { done: false };
    },
  });
}

async function downloadResult(spec, mediaUrl, download) {
  const buffer = await download(mediaUrl);
  return { buffer, format: formatForUrl(spec, mediaUrl) };
}

/** 结果下载也对外暴露，恢复流程复用同一套格式推断。 */
export async function downloadTaskResult(spec, mediaUrl, download) {
  return downloadResult(spec, mediaUrl, download);
}

function authHeadersFor(provider) {
  return {
    ...(provider.apiKey ? { Authorization: `Bearer ${provider.apiKey}` } : {}),
    ...(provider.headers || {}),
  };
}

/** 只查询一次任务状态；恢复流程按轮询间隔反复调用它，返回 pending 时由上层继续等待。 */
export async function fetchTaskSnapshot({ spec, provider, taskId, request, signal }) {
  const pollPath = String(spec.pollPath).replace(/\{taskId\}/g, encodeURIComponent(String(taskId)));
  return request(resolveUrl(provider.baseUrl, pollPath), {
    method: 'GET',
    headers: authHeadersFor(provider),
    signal,
  });
}

/**
 * 执行一次异步任务协议：提交 → 轮询 → 下载结果。
 * 图片族支持 generateCount > 1（逐张提交，兼容不支持 n 的模型）。
 */
export async function runTaskProtocol({
  spec,
  provider,
  protocol,
  model,
  params,
  request,
  download,
  timeoutMs,
  onBeforeSubmit,
  onSubmitted,
  markSubmissionUncertain = false,
}) {
  const authHeaders = authHeadersFor(provider);
  const jsonHeaders = {
    ...(protocol.contentType ? { 'Content-Type': protocol.contentType } : {}),
    ...authHeaders,
  };
  const baseUrl = provider.baseUrl;
  const url = (path) => resolveUrl(baseUrl, path);
  const signal = params.signal;
  const assets = await resolveAssets(spec, { params, request, url, authHeaders, signal });
  const modelId = model.upstreamModelId;
  const count =
    spec.bodyKind === 'image'
      ? Math.max(1, Math.min(10, Math.trunc(Number(params.generateCount) || 1)))
      : 1;

  const results = [];
  for (let index = 0; index < count; index += 1) {
    const body = buildTaskBody(spec.bodyKind, modelId, assets, params);
    onBeforeSubmit?.(index);
    let created;
    try {
      created = await request(url(spec.createPath), {
        method: protocol.method || 'POST',
        headers: jsonHeaders,
        body: JSON.stringify(body),
        signal,
      });
    } catch (error) {
      // 没有任何 HTTP 响应时无法判断上游是否已经接单：只有框架能核对远端任务时才标记
      // 「提交未确认」，否则按普通网络错误返回，避免任务卡在无法核对的未知状态。
      if (markSubmissionUncertain && !Number(error?.status)) error.submissionUncertain = true;
      throw error;
    }

    let finalPayload = created;
    const immediate = collectResultUrls(spec, created);
    if (!immediate.length) {
      const taskId = readTaskId(spec, created);
      if (!taskId) throw new Error('提交成功但没有返回任务 ID，无法继续轮询');
      onSubmitted?.(taskId, index);
      finalPayload = await pollTask({ spec, taskId, request, baseUrl, authHeaders, signal, timeoutMs });
    }

    const urls = immediate.length ? immediate : collectResultUrls(spec, finalPayload);
    if (!urls.length) throw new Error('任务已完成但没有返回结果地址');
    for (const mediaUrl of urls) results.push(await downloadResult(spec, mediaUrl, download));
  }

  if (spec.multipleResults) return results;
  return results[0];
}

function baseSpec(overrides) {
  return Object.freeze({
    method: 'POST',
    contentType: 'application/json',
    uploadPath: '/v1/files/upload',
    pollIntervalMs: 3000,
    taskIdPaths: ['task_id', 'id', 'data.task_id', 'data.id'],
    statusPaths: ['data.status', 'status'],
    successStatuses: ['success', 'succeeded', 'completed'],
    failureStatuses: ['failure', 'failed', 'error', 'cancelled', 'canceled'],
    errorPaths: ['error.message', 'error', 'fail_reason', 'data.fail_reason', 'message', 'data.message'],
    itemKeys: ['url', 'audio_url', 'video_url', 'image_url'],
    multipleResults: false,
    ...overrides,
  });
}

export const TASK_PROTOCOL_SPECS = Object.freeze({
  'async-image-tasks': baseSpec({
    id: 'async-image-tasks',
    bodyKind: 'image',
    capability: 'image',
    label: '图片任务（/v1/image/generations）',
    createPath: '/v1/image/generations',
    pollPath: '/v1/image/generations/{taskId}',
    resultPaths: [
      'data.result_url',
      'data.data.content.image_urls',
      'data.data.content.image_url',
      'result_url',
      'data.result_urls',
    ],
    defaultFormat: 'png',
    multipleResults: true,
  }),
  'openai-videos': baseSpec({
    id: 'openai-videos',
    bodyKind: 'video',
    capability: 'video',
    label: '视频任务（/v1/videos）',
    createPath: '/v1/videos',
    pollPath: '/v1/videos/{taskId}',
    taskIdPaths: ['id', 'task_id', 'data.id'],
    statusPaths: ['status'],
    resultPaths: [
      'metadata.url',
      'metadata.video_url',
      'data.result_url',
      'data.data.content.video_urls',
      'data.data.content.video_url',
      'data.video_url',
      'result_url',
      'video_url',
    ],
    defaultFormat: 'mp4',
  }),
  'async-video-tasks': baseSpec({
    id: 'async-video-tasks',
    bodyKind: 'video',
    capability: 'video',
    label: '视频任务（/v1/video/generations）',
    createPath: '/v1/video/generations',
    pollPath: '/v1/video/generations/{taskId}',
    resultPaths: [
      'data.result_url',
      'data.data.content.video_urls',
      'data.data.content.video_url',
      'data.result.video_url',
      'result_url',
      'video_url',
    ],
    defaultFormat: 'mp4',
  }),
  'async-audio-tasks': baseSpec({
    id: 'async-audio-tasks',
    bodyKind: 'audio',
    capability: 'audio',
    label: '音频任务（/v1/audio/generations）',
    createPath: '/v1/audio/generations',
    pollPath: '/v1/audio/generations/{taskId}',
    resultPaths: [
      'data.result_url',
      'data.data.content.audio_url',
      'data.data.content.audio_urls',
      'result_url',
    ],
    defaultFormat: 'mp3',
  }),
  'suno-music': baseSpec({
    id: 'suno-music',
    bodyKind: 'music',
    capability: 'audio',
    label: 'Suno 音乐（/v1/music）',
    createPath: '/v1/music/generations',
    pollPath: '/v1/music/tasks/{taskId}',
    taskIdPaths: ['data.0.task_id', 'task_id', 'id'],
    statusPaths: ['data.status', 'status'],
    resultPaths: ['data.result.music', 'data.result.audio_url', 'data.result.music.0.audio_url'],
    defaultFormat: 'mp3',
  }),
  'midjourney-images': baseSpec({
    id: 'midjourney-images',
    bodyKind: 'midjourney',
    capability: 'image',
    label: 'Midjourney（/v1/midjourney）',
    createPath: '/v1/midjourney/generations',
    pollPath: '/v1/midjourney/tasks/{taskId}',
    taskIdPaths: ['data.0.task_id', 'task_id', 'id'],
    statusPaths: ['status', 'data.status'],
    failureStatuses: ['failure', 'failed', 'error', 'cancelled', 'canceled', 'modal'],
    failureHints: {
      modal: 'Midjourney 任务需要人工交互（MODAL），请在 Midjourney 页面处理后再继续',
    },
    resultPaths: ['image_urls', 'grid_image_url', 'data.image_urls', 'data.grid_image_url', 'image_url'],
    defaultFormat: 'png',
    multipleResults: true,
  }),
});

export const TASK_PROTOCOLS = Object.freeze(
  Object.values(TASK_PROTOCOL_SPECS).map((spec) =>
    Object.freeze({
      id: spec.id,
      label: spec.label,
      capability: spec.capability,
      adapter: spec.id,
      createPath: spec.createPath,
      pollPath: spec.pollPath,
      method: spec.method,
      contentType: spec.contentType,
    }),
  ),
);

export function taskProtocolSpec(adapter) {
  return TASK_PROTOCOL_SPECS[String(adapter || '')] || null;
}

export function isTaskProtocolAdapter(adapter) {
  return Boolean(taskProtocolSpec(adapter));
}
