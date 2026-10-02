import { providerFrameworkStore } from './store.js';
import { protocolById } from './protocols.js';

const DEFAULT_DYNAMIC_IMAGE_ASPECT_RATIOS = Object.freeze([
  '1:1', '2:3', '3:2', '9:16', '16:9', '3:4', '4:3', '5:4', '4:5', '21:9',
  '1:4', '1:8', '4:1', '8:1', '2:1',
]);

const DEFAULT_DYNAMIC_IMAGE_RESOLUTIONS = Object.freeze(['512', '1K', '2K', '4K']);

function modesFor(model, protocol) {
  const supplied = Array.isArray(model.modes) && model.modes.length ? model.modes : null;
  if (supplied) return supplied;
  if (model.capability === 'text') return ['multimodal-chat'];
  if (model.capability === 'image') {
    return protocol?.adapter === 'openai-images'
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
            resolutions: [...DEFAULT_DYNAMIC_IMAGE_RESOLUTIONS],
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
