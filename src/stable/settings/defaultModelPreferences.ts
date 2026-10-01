import { preferenceStorage } from '../persistence/preferenceStore';

export type DefaultModelCapability = 'text' | 'image' | 'video';

const KEYS: Record<DefaultModelCapability, string> = {
  text: 'fisherai.default-model.text',
  image: 'fisherai.default-model.image',
  video: 'fisherai.default-model.video',
};

export function getDefaultModelName<T extends { name: string }>(
  capability: DefaultModelCapability,
  models: readonly T[],
): string {
  const stored = preferenceStorage().getItem(KEYS[capability]) || '';
  return models.some((model) => model.name === stored) ? stored : (models[0]?.name || '');
}

export function getDefaultModel<T extends { name: string }>(
  capability: DefaultModelCapability,
  models: readonly T[],
): T | undefined {
  const name = getDefaultModelName(capability, models);
  return models.find((model) => model.name === name) || models[0];
}

export function setDefaultModelName(
  capability: DefaultModelCapability,
  modelName: string,
): void {
  const storage = preferenceStorage();
  if (modelName) storage.setItem(KEYS[capability], modelName);
  else storage.removeItem(KEYS[capability]);
  window.dispatchEvent(
    new CustomEvent('fisherai:default-models-changed', {
      detail: { capability, modelName },
    }),
  );
}

export function clearInvalidDefaultModel<T extends { name: string }>(
  capability: DefaultModelCapability,
  models: readonly T[],
): void {
  const storage = preferenceStorage();
  const current = storage.getItem(KEYS[capability]);
  if (current && !models.some((model) => model.name === current)) storage.removeItem(KEYS[capability]);
}
