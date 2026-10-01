import { IMAGE_MODELS, VIDEO_MODELS, TEXT_MODELS, AUDIO_MODELS } from '../../config/modelConfig';

type Capability = 'text' | 'image' | 'video' | 'audio';
type Protocol = { id: string; capability: Capability; adapter?: string };
type DynamicModel = {
  id: string;
  providerId: string;
  name: string;
  upstreamModelId: string;
  capability: Capability;
  protocolId: string;
  maxConcurrent?: number;
  useProxy?: boolean;
  modes?: string[];
  advancedParams?: unknown[];
};
type Provider = { id: string; name: string; baseUrl: string };
type State = { providers?: Provider[]; models?: DynamicModel[]; protocols?: Protocol[]; builtinProtocols?: Protocol[] };

const MARK = '__fisheraiDynamicProviderModel';

function defaultModes(model: DynamicModel, protocol?: Protocol) {
  if (model.modes?.length) return model.modes;
  if (model.capability === 'text') return ['multimodal-chat'];
  if (model.capability === 'image')
    return protocol?.adapter === 'openai-images' ? ['text-to-image', 'image-to-image'] : ['text-to-image'];
  if (model.capability === 'video') return ['text-to-video', 'image-to-video'];
  return ['text-to-audio'];
}

function replaceDynamic(list: any[], next: any[]) {
  for (let index = list.length - 1; index >= 0; index--) {
    if (list[index]?.[MARK]) list.splice(index, 1);
  }
  list.push(...next);
}

export async function refreshDynamicProviderModels(fetcher: typeof fetch = window.fetch.bind(window)) {
  const response = await fetcher('/api/provider-framework', { cache: 'no-store' });
  if (!response.ok) throw new Error('读取自定义模型供应商失败');
  const state = await response.json() as State;
  const providers = new Map((state.providers || []).map((item) => [item.id, item]));
  const protocols = new Map([...(state.builtinProtocols || []), ...(state.protocols || [])].map((item) => [item.id, item]));
  const grouped: Record<Capability, any[]> = { text: [], image: [], video: [], audio: [] };

  for (const model of state.models || []) {
    const provider = providers.get(model.providerId);
    const protocol = protocols.get(model.protocolId);
    if (!provider || !protocol || protocol.capability !== model.capability) continue;
    const modes = defaultModes(model, protocol);
    const modeConfig = modes.map((mode) => ({
      label: mode,
      value: mode,
      allowedInputs: {
        text: 10,
        ...(/image-to-|reference|edit/i.test(mode) || model.capability === 'text' ? { image: 10 } : {}),
        ...(/video-to-|reference|edit/i.test(mode) ? { video: 4 } : {}),
      },
    }));
    grouped[model.capability].push({
      [MARK]: true,
      name: model.name,
      description: `${provider.name} · ${model.upstreamModelId}`,
      timeEstimate: model.capability === 'video' ? '10min' : '2min',
      provider: 'DynamicProtocolProvider',
      source: `custom:${provider.id}`,
      maxConcurrent: model.maxConcurrent || 1,
      useProxy: model.useProxy === true,
      maxInputs: 10,
      supportedReferenceTypes: model.capability === 'text' ? ['text', 'image'] : ['text', 'image'],
      resolutions: model.capability === 'video' ? ['480p', '720p', '1080p'] : model.capability === 'image' ? ['512', '1K', '2K', '4K'] : [],
      aspectRatios: model.capability === 'text' || model.capability === 'audio' ? [] : ['1:1', '2:3', '3:2', '9:16', '16:9', '3:4', '4:3'],
      cost: 0,
      ...(model.capability === 'text' ? { languageModes: modeConfig } : {}),
      ...(model.capability === 'image' ? { imageModes: modeConfig } : {}),
      ...(model.capability === 'video' ? { videoModes: modeConfig } : {}),
      ...(model.capability === 'audio' ? { audioModes: modeConfig } : {}),
      endpoint: Object.fromEntries(modes.map((mode) => [mode, { url: provider.baseUrl, model: model.upstreamModelId }])),
      advancedParams: Array.isArray(model.advancedParams) ? model.advancedParams : [],
    });
  }

  replaceDynamic(TEXT_MODELS as any[], grouped.text);
  replaceDynamic(IMAGE_MODELS as any[], grouped.image);
  replaceDynamic(VIDEO_MODELS as any[], grouped.video);
  replaceDynamic(AUDIO_MODELS as any[], grouped.audio);
  window.dispatchEvent(new CustomEvent('fisherai:model-catalog-changed'));
}

export function installDynamicProviderModelRefresh() {
  const reload = () => void refreshDynamicProviderModels().catch((error) => console.warn('[ProviderFramework]', error));
  window.addEventListener('fisherai:model-sources-changed', reload);
  return () => window.removeEventListener('fisherai:model-sources-changed', reload);
}
