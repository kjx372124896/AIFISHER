import { describe, expect, it } from 'vitest';
import {
  TASK_PROTOCOL_SPECS,
  buildAudioTaskBody,
  buildImageTaskBody,
  buildMidjourneyBody,
  buildMusicTaskBody,
  buildVideoTaskBody,
  collectResultUrls,
  readTaskId,
  readTaskStatus,
  runTaskProtocol,
} from '../server/providerFramework/taskProtocols.js';
import { BUILTIN_PROTOCOLS, protocolById } from '../server/providerFramework/protocols.js';
import { loadDynamicModelCatalog } from '../server/providerFramework/catalog.js';
import { providerFrameworkStore } from '../server/providerFramework/store.js';
import { canRecoverTask, recoverTask } from '../server/providerFramework/dynamicProvider.js';
import { remoteTaskReference } from '../server/generation/generationTaskRecovery.js';
import {
  isTaskRelayBaseUrl,
  suggestCapability,
  suggestModelPreset,
  suggestProtocolId,
} from '../src/stable/generation/providerFrameworkPresets';

const provider = { baseUrl: 'https://relay.test', apiKey: 'sk-test', headers: { 'X-Test': '1' } };
const protocol = { method: 'POST', contentType: 'application/json' };
const download = async (url) => Buffer.from(String(url));

function createRelay(routes) {
  const calls = [];
  const request = async (url, options = {}) => {
    const call = {
      url: String(url).replace(provider.baseUrl, ''),
      method: String(options.method || 'GET').toUpperCase(),
      headers: options.headers || {},
      body: options.body,
    };
    calls.push(call);
    const handler = routes[call.url];
    if (!handler) throw new Error(`unexpected ${call.method} ${call.url}`);
    return handler(call);
  };
  return { request, calls };
}

describe('task protocol specs', () => {
  it('registers an async task protocol for every supported capability', () => {
    const ids = BUILTIN_PROTOCOLS.map((item) => item.id);
    for (const id of [
      'async-image-tasks',
      'openai-videos',
      'async-video-tasks',
      'async-audio-tasks',
      'suno-music',
      'midjourney-images',
    ]) {
      expect(ids).toContain(id);
      expect(protocolById({ protocols: [] }, id)?.capability).toBe(TASK_PROTOCOL_SPECS[id].capability);
    }
    // 原有协议保持不变，避免老模型失效。
    expect(protocolById({ protocols: [] }, 'openai-chat-completions')?.capability).toBe('text');
    expect(protocolById({ protocols: [] }, 'missing')).toBeNull();
  });
});

describe('task request bodies', () => {
  it('maps image fields to the async image task contract', () => {
    const body = buildImageTaskBody(
      'seedream-v5-pro-t2i',
      { images: ['https://cdn.test/ref.png'] },
      { prompt: 'a glass bottle', resolution: '2K', aspectRatio: '16:9', outputFormat: 'PNG' },
    );
    expect(body).toEqual({
      model: 'seedream-v5-pro-t2i',
      prompt: 'a glass bottle',
      images: ['https://cdn.test/ref.png'],
      metadata: { resolution: '2k', output_format: 'png' },
    });
    // Seedream 不公开 ratio 参数，不要塞进 metadata 触发 400。
    expect(body.metadata.ratio).toBeUndefined();
    expect(buildImageTaskBody('seedream-v5-pro-t2i', { images: [] }, {}).metadata).toBeUndefined();
  });

  it('keeps ratio for the image models that document it', () => {
    const body = buildImageTaskBody(
      'zhenzhen-image-nb-2',
      { images: [] },
      { prompt: 'poster', resolution: '1K', aspectRatio: '3:4' },
    );
    expect(body.metadata).toEqual({ resolution: '1k', ratio: '3:4' });
  });

  it('builds a text-to-video body with seconds and resolution', () => {
    const body = buildVideoTaskBody(
      'seedance-2.0-mini-t2v',
      { images: [], videos: [], audios: [] },
      { prompt: 'lake at sunrise', duration: 5, resolution: '1080p', aspectRatio: '16:9' },
    );
    expect(body).toEqual({
      model: 'seedance-2.0-mini-t2v',
      prompt: 'lake at sunrise',
      seconds: '5',
      metadata: { resolution: '1080p', ratio: '16:9' },
    });
  });

  it('moves references into metadata.content for multimodal video models', () => {
    const body = buildVideoTaskBody(
      'seedance-2.0-standard-multi',
      { images: ['https://cdn.test/p.png'], videos: ['https://cdn.test/v.mp4'], audios: [] },
      { prompt: '换人', duration: 5 },
    );
    expect(body.images).toBeUndefined();
    expect(body.metadata.content).toEqual([
      { type: 'image_url', image_url: { url: 'https://cdn.test/p.png' } },
      { type: 'video_url', video_url: { url: 'https://cdn.test/v.mp4' } },
    ]);
  });

  it('drops prompt and seconds for upscale models', () => {
    const body = buildVideoTaskBody(
      'zhenzhen-upscaler',
      { images: [], videos: ['https://cdn.test/in.mp4'], audios: [] },
      { prompt: 'upscale', duration: 5, resolution: '2k' },
    );
    expect(body.prompt).toBeUndefined();
    expect(body.seconds).toBeUndefined();
    expect(body.metadata).toEqual({
      resolution: '2k',
      content: [{ type: 'video_url', video_url: { url: 'https://cdn.test/in.mp4' } }],
    });
    expect(() =>
      buildVideoTaskBody('zhenzhen-upscaler', { images: [], videos: [], audios: [] }, {}),
    ).toThrow(/参考视频/);
  });

  it('uses the animate contract for motion transfer', () => {
    const body = buildVideoTaskBody(
      'animate-motion-transfer',
      { images: ['https://cdn.test/character.png'], videos: ['https://cdn.test/motion.mp4'], audios: [] },
      { duration: 2, resolution: '480p' },
    );
    expect(body.images).toEqual(['https://cdn.test/character.png']);
    expect(body.metadata.video_url).toEqual(['https://cdn.test/motion.mp4']);
  });

  it('builds audio, music and midjourney bodies', () => {
    expect(
      buildAudioTaskBody('doubao-seed-audio-1.0', { images: [], audios: [] }, { prompt: 'rain' }),
    ).toEqual({ model: 'doubao-seed-audio-1.0', prompt: 'rain' });
    expect(
      buildAudioTaskBody(
        'minimax-voice-clone',
        { images: [], audios: ['https://cdn.test/ref.mp3'] },
        { prompt: 'hello' },
      ).metadata,
    ).toEqual({ audio_url: 'https://cdn.test/ref.mp3' });
    expect(
      buildMusicTaskBody('suno-generation', { prompt: 'lo-fi piano', instrumental: true }),
    ).toEqual({ model: 'suno', version: 'v5.5', prompt: 'lo-fi piano', custom: false, instrumental: true });
    expect(
      buildMidjourneyBody('midjourney-imagine', { images: ['https://cdn.test/a.png'] }, { prompt: 'apple', aspectRatio: '1:1' }),
    ).toEqual({ prompt: 'apple', size: '1:1', image_urls: ['https://cdn.test/a.png'] });
  });
});

describe('task result parsing', () => {
  it('reads task ids and statuses from every documented shape', () => {
    expect(readTaskId({ taskIdPaths: ['id'] }, { id: 'v1' })).toBe('v1');
    expect(readTaskId({ taskIdPaths: ['data.0.task_id'] }, { data: [{ task_id: 't1' }] })).toBe('t1');
    expect(readTaskStatus({ statusPaths: ['status'] }, { status: 'COMPLETED' })).toBe('completed');
    expect(
      readTaskStatus({ statusPaths: ['data.status', 'status'] }, { data: { status: 'SUCCESS' } }),
    ).toBe('success');
  });

  it('collects media urls from nested arrays and objects', () => {
    const imageSpec = TASK_PROTOCOL_SPECS['async-image-tasks'];
    expect(
      collectResultUrls(imageSpec, { data: { result_url: 'https://cdn.test/a.jpg' } }),
    ).toEqual(['https://cdn.test/a.jpg']);
    expect(
      collectResultUrls(imageSpec, {
        data: { data: { content: { image_urls: ['https://cdn.test/a.jpg', 'https://cdn.test/b.png'] } } },
      }),
    ).toEqual(['https://cdn.test/a.jpg', 'https://cdn.test/b.png']);
    expect(
      collectResultUrls(TASK_PROTOCOL_SPECS['suno-music'], {
        data: { result: { music: [{ audio_url: 'https://cdn.test/a.mp3' }, { audio_url: 'https://cdn.test/b.mp3' }] } },
      }),
    ).toEqual(['https://cdn.test/a.mp3', 'https://cdn.test/b.mp3']);
  });
});

describe('task protocol runner', () => {
  it('submits, polls and downloads an image task', async () => {
    let polls = 0;
    const { request, calls } = createRelay({
      '/v1/image/generations': () => ({ id: 'task_1', status: 'queued' }),
      '/v1/image/generations/task_1': () => {
        polls += 1;
        return polls === 1
          ? { code: 'success', data: { status: 'IN_PROGRESS' } }
          : { code: 'success', data: { status: 'SUCCESS', result_url: 'https://cdn.test/out.jpg' } };
      },
    });
    const result = await runTaskProtocol({
      spec: { ...TASK_PROTOCOL_SPECS['async-image-tasks'], pollIntervalMs: 250 },
      provider,
      protocol,
      model: { upstreamModelId: 'seedream-v5-flash-t2i' },
      params: { prompt: 'cat', resolution: '1K', generateCount: 1 },
      request,
      download,
      timeoutMs: 5000,
    });
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
    expect(result[0].format).toBe('jpg');
    expect(result[0].buffer.toString()).toBe('https://cdn.test/out.jpg');
    expect(calls[0].url).toBe('/v1/image/generations');
    expect(calls[0].headers.Authorization).toBe('Bearer sk-test');
    expect(JSON.parse(calls[0].body)).toMatchObject({
      model: 'seedream-v5-flash-t2i',
      prompt: 'cat',
      metadata: { resolution: '1k' },
    });
  });

  it('uploads local reference images before submitting', async () => {
    const localImage = `data:image/png;base64,${Buffer.from('pixels').toString('base64')}`;
    const { request, calls } = createRelay({
      '/v1/files/upload': () => ({ url: 'https://cdn.test/uploaded.png', file_type: 'image' }),
      '/v1/videos': () => ({ id: 'v1', status: 'completed', metadata: { url: 'https://cdn.test/out.mp4' } }),
    });
    const result = await runTaskProtocol({
      spec: { ...TASK_PROTOCOL_SPECS['openai-videos'], pollIntervalMs: 250 },
      provider,
      protocol,
      model: { upstreamModelId: 'seedance-2.0-mini-i2v' },
      params: { prompt: 'wave', images: [localImage], duration: 5 },
      request,
      download,
      timeoutMs: 5000,
    });
    expect(calls[0].url).toBe('/v1/files/upload');
    expect(calls[0].body instanceof FormData).toBe(true);
    expect(calls[0].headers['Content-Type']).toBeUndefined();
    const submitted = JSON.parse(calls[1].body);
    expect(submitted.images).toEqual(['https://cdn.test/uploaded.png']);
    expect(submitted.seconds).toBe('5');
    expect(result).toEqual({ buffer: Buffer.from('https://cdn.test/out.mp4'), format: 'mp4' });
  });

  it('rejects with the upstream failure reason', async () => {
    const { request } = createRelay({
      '/v1/audio/generations': () => ({ task_id: 'a1' }),
      '/v1/audio/generations/a1': () => ({
        code: 'success',
        data: { status: 'FAILURE', fail_reason: '额度不足' },
      }),
    });
    await expect(
      runTaskProtocol({
        spec: { ...TASK_PROTOCOL_SPECS['async-audio-tasks'], pollIntervalMs: 250 },
        provider,
        protocol,
        model: { upstreamModelId: 'doubao-seed-audio-1.0' },
        params: { prompt: 'rain' },
        request,
        download,
        timeoutMs: 5000,
      }),
    ).rejects.toThrow('额度不足');
  });

  it('reports the submitted task so a dropped poll or download can be re-checked later', async () => {
    const events = [];
    let polls = 0;
    const { request } = createRelay({
      '/v1/image/generations': () => ({ task_id: 'task_abc', status: 'queued' }),
      '/v1/image/generations/task_abc': () => {
        polls += 1;
        if (polls === 1) return { data: { status: 'IN_PROGRESS' } };
        const error = new TypeError('fetch failed');
        error.cause = { code: 'ECONNRESET' };
        throw error;
      },
    });
    await expect(
      runTaskProtocol({
        spec: { ...TASK_PROTOCOL_SPECS['async-image-tasks'], pollIntervalMs: 250 },
        provider,
        protocol,
        model: { upstreamModelId: 'zhenzhen-image-g-v2-lowprice' },
        params: { prompt: 'cup', resolution: '1K' },
        request,
        download,
        timeoutMs: 1000,
        onBeforeSubmit: (slot) => events.push(['before', slot]),
        onSubmitted: (taskId, slot) => events.push(['after', taskId, slot]),
      }),
    ).rejects.toThrow();
    expect(events).toEqual([
      ['before', 0],
      ['after', 'task_abc', 0],
    ]);
  });

  it('marks a submit without any response as an uncertain submission', async () => {
    const request = async () => {
      const error = new TypeError('fetch failed');
      error.cause = { code: 'ECONNRESET' };
      throw error;
    };
    await expect(
      runTaskProtocol({
        spec: TASK_PROTOCOL_SPECS['async-image-tasks'],
        provider,
        protocol,
        model: { upstreamModelId: 'seedream-v5-pro-t2i' },
        params: { prompt: 'cup' },
        request,
        download,
        timeoutMs: 2000,
        markSubmissionUncertain: true,
      }),
    ).rejects.toMatchObject({ submissionUncertain: true });
  });

  it('tags reference upload failures so the message stays accurate', async () => {
    const request = async () => {
      throw Object.assign(new Error('HTTP 502'), { status: 502 });
    };
    const localImage = `data:image/png;base64,${Buffer.from('pixels').toString('base64')}`;
    await expect(
      runTaskProtocol({
        spec: TASK_PROTOCOL_SPECS['async-image-tasks'],
        provider,
        protocol,
        model: { upstreamModelId: 'seedream-v5-pro-i2i' },
        params: { prompt: 'cup', images: [localImage] },
        request,
        download,
        timeoutMs: 2000,
      }),
    ).rejects.toMatchObject({ code: 'REFERENCE_UPLOAD_FAILED', status: 502 });
  });
});

describe('remote task recovery', () => {
  const relayState = {
    providers: [
      { id: 'p1', name: 'Seedance 中转', baseUrl: 'https://relay.test', apiKey: 'sk-test', headers: {} },
    ],
    models: [
      {
        id: 'm1',
        providerId: 'p1',
        name: 'zhenzhen-image-g-v2-lowprice',
        upstreamModelId: 'zhenzhen-image-g-v2-lowprice',
        capability: 'image',
        protocolId: 'async-image-tasks',
      },
    ],
    protocols: [],
  };

  const reference = remoteTaskReference({
    taskId: 'task_abc',
    providerName: 'DynamicProtocolProvider',
    modelId: 'm1',
    submitUrl: 'https://relay.test/v1/image/generations',
    queryUrl: 'https://relay.test/v1/image/generations/task_abc',
    apiKey: 'sk-test',
  });

  async function withRelay(run) {
    const original = providerFrameworkStore.read;
    providerFrameworkStore.read = () => relayState;
    try {
      return await run();
    } finally {
      providerFrameworkStore.read = original;
    }
  }

  it('matches a stored receipt against the current provider settings', async () => {
    await withRelay(() => {
      expect(canRecoverTask('image', reference, 'zhenzhen-image-g-v2-lowprice')).toBe(true);
      expect(canRecoverTask('video', reference, 'zhenzhen-image-g-v2-lowprice')).toBe(false);
      // 换了 Key 的收据不能拿来查询，避免误取别的账号的任务。
      expect(canRecoverTask('image', { ...reference, credentialFingerprint: 'f'.repeat(64) }, '')).toBe(false);
    });
  });

  it('fetches the finished result of an already submitted task', async () => {
    const result = await withRelay(() =>
      recoverTask(
        'image',
        { remoteTasks: [reference], requestedCount: 1, projectId: 'p' },
        { imageModel: 'zhenzhen-image-g-v2-lowprice' },
        {},
        undefined,
        {
          request: async () => ({
            code: 'success',
            data: { status: 'SUCCESS', result_url: 'https://cdn.test/recovered.png' },
          }),
          download: async (url) => Buffer.from(String(url)),
        },
      ),
    );
    expect(result.status).toBe('success');
    expect(result.results).toHaveLength(1);
    expect(result.results[0].format).toBe('png');
    expect(result.results[0].buffer.toString()).toBe('https://cdn.test/recovered.png');
  });

  it('keeps waiting while the upstream task is still running', async () => {
    const result = await withRelay(() =>
      recoverTask('image', { remoteTasks: [reference], requestedCount: 1 }, {}, {}, undefined, {
        request: async () => ({ data: { status: 'IN_PROGRESS' } }),
        download: async () => Buffer.from(''),
      }),
    );
    expect(result.status).toBe('pending');
  });

  it('reports the upstream failure and refuses mismatched settings', async () => {
    const failed = await withRelay(() =>
      recoverTask('image', { remoteTasks: [reference], requestedCount: 1 }, {}, {}, undefined, {
        request: async () => ({ data: { status: 'FAILURE', fail_reason: '内容审核未通过' } }),
        download: async () => Buffer.from(''),
      }),
    );
    expect(failed.status).toBe('failed');
    expect(String(failed.error.message)).toContain('内容审核');

    const mismatched = await withRelay(() =>
      recoverTask(
        'image',
        { remoteTasks: [{ ...reference, endpointFingerprint: 'a'.repeat(64) }], requestedCount: 1 },
        {},
        {},
        undefined,
        { request: async () => ({}), download: async () => Buffer.from('') },
      ),
    );
    expect(mismatched).toEqual({ status: 'unknown', reason: 'settings_changed' });
  });
});

describe('dynamic model catalog', () => {
  const createStore = (model) => ({
    read: () => ({
      providers: [{ id: 'p1', name: 'Seedance 中转', baseUrl: 'https://api.seedance.nz' }],
      models: [{ ...model, providerId: 'p1' }],
      protocols: [],
    }),
  });

  it('exposes async task image models with reference-image mode', () => {
    const catalog = loadDynamicModelCatalog(
      createStore({
        id: 'm1',
        name: 'seedream-v5-pro-i2i',
        upstreamModelId: 'seedream-v5-pro-i2i',
        capability: 'image',
        protocolId: 'async-image-tasks',
      }),
    );
    expect(catalog['seedream-v5-pro-i2i'].resolutions).toEqual(['1K', '2K', '4K']);
    expect(catalog['seedream-v5-pro-i2i'].imageModes.map((mode) => mode.value)).toEqual([
      'text-to-image',
      'image-to-image',
    ]);
  });

  it('exposes the video enums the async protocols understand', () => {
    const catalog = loadDynamicModelCatalog(
      createStore({
        id: 'm2',
        name: 'seedance-2.0-mini-t2v',
        upstreamModelId: 'seedance-2.0-mini-t2v',
        capability: 'video',
        protocolId: 'openai-videos',
      }),
    );
    expect(catalog['seedance-2.0-mini-t2v'].resolutions).toEqual(['480p', '720p', '1080p']);
    expect(catalog['seedance-2.0-mini-t2v'].aspectRatios).toContain('21:9');
    expect(catalog['seedance-2.0-mini-t2v'].provider).toBe('DynamicProtocolProvider');
  });
});

describe('discovery presets', () => {
  it('recognises the relay host and model families', () => {
    expect(isTaskRelayBaseUrl('https://api.seedance.nz')).toBe(true);
    expect(isTaskRelayBaseUrl('https://api.seedance.nz/v1')).toBe(true);
    expect(isTaskRelayBaseUrl('https://example.com')).toBe(false);
    expect(isTaskRelayBaseUrl('not a url')).toBe(false);

    expect(suggestCapability('seedance-2.0-mini-i2v')).toBe('video');
    expect(suggestCapability('wan-2.7-global-i2i')).toBe('image');
    expect(suggestCapability('zhenzhen-image-nb-2')).toBe('image');
    expect(suggestCapability('midjourney-inpaint')).toBe('image');
    expect(suggestCapability('suno-generation')).toBe('audio');
    expect(suggestCapability('doubao-seed-audio-1.0')).toBe('audio');
    expect(suggestCapability('qwen/qwen3.8-max')).toBe('text');
  });

  it('picks the matching async protocol only on the relay host', () => {
    expect(suggestModelPreset('seedance-2.0-mini-i2v', 'https://api.seedance.nz')).toEqual({
      capability: 'video',
      protocolId: 'openai-videos',
    });
    expect(suggestModelPreset('wan-3.0-i2v', 'https://api.seedance.nz').protocolId).toBe('async-video-tasks');
    expect(suggestModelPreset('seedream-v5-pro-t2i', 'https://api.seedance.nz').protocolId).toBe('async-image-tasks');
    expect(suggestModelPreset('midjourney-imagine', 'https://api.seedance.nz').protocolId).toBe('midjourney-images');
    expect(suggestModelPreset('suno-generation', 'https://api.seedance.nz').protocolId).toBe('suno-music');
    expect(suggestModelPreset('qwen/qwen3.8-max', 'https://api.seedance.nz').protocolId).toBe('openai-chat-completions');
    expect(suggestProtocolId('video', 'seedance-2.0-mini-i2v', { relay: false })).toBe('');
  });
});
