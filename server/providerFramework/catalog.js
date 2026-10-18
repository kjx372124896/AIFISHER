import { providerFrameworkStore } from './store.js';
import { protocolById } from './protocols.js';

const DEFAULT_DYNAMIC_IMAGE_ASPECT_RATIOS = Object.freeze([
  '1:1', '2:3', '3:2', '9:16', '16:9', '3:4', '4:3', '5:4', '4:5', '21:9',
  '1:4', '1:8', '4:1', '8:1', '2:1',
]);

const DEFAULT_DYNAMIC_IMAGE_RESOLUTIONS = Object.freeze(['512', '1K', '2K', '4K']);

/** 异步任务图片接口的枚举是 1k / 1.5k / 2k / 4k，没有 512。 */
const TASK_IMAGE_RESOLUTIONS = Object.freeze(['1K', '2K', '4K']);

const TASK_VIDEO_RESOLUTIONS = Object.freeze(['480p', '720p', '1080p']);

const TASK_VIDEO_RATIOS = Object.freeze(['16:9', '9:16', '1:1', '4:3', '3:4']);

const OPENAI_VIDEO_RATIOS = Object.freeze([...TASK_VIDEO_RATIOS, '21:9']);

/** 这些协议支持参考图输入（/v1/image/generations 与 Midjourney 的 image_urls）。 */
const IMAGE_REFERENCE_ADAPTERS = new Set(['openai-images', 'async-image-tasks', 'midjourney-images']);

const TASK_VIDEO_ADAPTERS = new Set(['openai-videos', 'async-video-tasks']);

function modesFor(model, protocol) {
  const supplied = Array.isArray(model.modes) && model.modes.length ? model.modes : null;
  if (supplied) return supplied;
  if (model.capability === 'text') return ['multimodal-chat'];
  if (model.capability === 'image') {
    return IMAGE_REFERENCE_ADAPTERS.has(protocol?.adapter)
      ? ['text-to-image', 'image-to-image']
      : ['text-to-image'];
  }
  if (model.capability === 'video') return ['text-to-video', 'image-to-video'];
  if (model.capability === 'audio') return ['text-to-audio'];
  return [];
}

function allowedInputs(mode, capability) {
  const base = { text: 10 };
  if (/image-to-|reference|edit/i.test(mode)) base.image = 10;
  if (/video-to-|reference|edit/i.test(mode)) base.video = 4;
  if (capability === 'text') base.image = 10;
  return base;
}

function modeKey(capability) {
  return capability === 'text'
    ? 'languageModes'
    : capability === 'image'
      ? 'imageModes'
      : capability === 'video'
        ? 'videoModes'
        : 'audioModes';
}

export function loadDynamicModelCatalog(store = providerFrameworkStore) {
  const state = store.read();
  const providers = new Map(state.providers.map((item) => [item.id, item]));
  const result = {};

  for (const model of state.models) {
    const provider = providers.get(model.providerId);
    const protocol = protocolById(state, model.protocolId);
    if (!provider || !protocol || protocol.capability !== model.capability) continue;
    const modes = modesFor(model, protocol);
    const endpoints = Object.fromEntries(
      modes.map((mode) => [mode, {
        url: provider.baseUrl,
        model: model.upstreamModelId,
      }]),
    );
    result[model.name] = {
      name: model.name,
      displayName: model.name,
      timeEstimate: model.capability === 'video' ? '10min' : '2min',
      provider: 'DynamicProtocolProvider',
      source: `custom:${provider.id}`,
      sourceLabel: provider.name,
      canonicalModel: model.name,
      tier: 'standard',
      variantLabel: null,
      brand: provider.name,
      cost: null,
      useProxy: model.useProxy === true,
      maxConcurrent: model.maxConcurrent || 1,
      supportedReferenceTypes: model.capability === 'text' ? ['text', 'image'] : ['text', 'image'],
      ...(model.capability === 'image'
        ? {
            aspectRatios: [...DEFAULT_DYNAMIC_IMAGE_ASPECT_RATIOS],
            resolutions: [
              ...(protocol.adapter === 'async-image-tasks' || protocol.adapter === 'midjourney-images'
                ? TASK_IMAGE_RESOLUTIONS
                : DEFAULT_DYNAMIC_IMAGE_RESOLUTIONS),
            ],
          }
        : {}),
      ...(model.capability === 'video' && TASK_VIDEO_ADAPTERS.has(protocol.adapter)
        ? {
            aspectRatios: [
              ...(protocol.adapter === 'openai-videos' ? OPENAI_VIDEO_RATIOS : TASK_VIDEO_RATIOS),
            ],
            resolutions: [...TASK_VIDEO_RESOLUTIONS],
          }
        : {}),
      [modeKey(model.capability)]: modes.map((mode) => ({
        label: mode,
        value: mode,
        allowedInputs: allowedInputs(mode, model.capability),
      })),
      advancedParams: Array.isArray(model.advancedParams) ? model.advancedParams : [],
      endpoint: endpoints,
      dynamic: {
        providerId: provider.id,
        protocolId: protocol.id,
        capability: model.capability,
        modelId: model.id,
      },
    };
  }
  return result;
}

export function dynamicProviderConfiguration(store = providerFrameworkStore) {
  const state = store.read();
  return Object.fromEntries(state.providers.map((provider) => [
    `dynamic:${provider.id}`,
    Boolean(provider.baseUrl),
  ]));
}
