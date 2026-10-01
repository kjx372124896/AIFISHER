import * as React from 'react';
import { IMAGE_MODELS, VIDEO_MODELS, TEXT_MODELS } from '../../config/modelConfig';
import {
  clearInvalidDefaultModel,
  getDefaultModelName,
  setDefaultModelName,
  type DefaultModelCapability,
} from './defaultModelPreferences';

type Model = { name: string; description?: string };

const groups: Array<{
  capability: DefaultModelCapability;
  label: string;
  description: string;
  models: Model[];
}> = [
  {
    capability: 'text',
    label: '默认文本模型',
    description: '新建文本节点时自动选择该模型。',
    models: TEXT_MODELS,
  },
  {
    capability: 'image',
    label: '默认图像模型',
    description: '新建图像节点时自动选择该模型。',
    models: IMAGE_MODELS,
  },
  {
    capability: 'video',
    label: '默认视频模型',
    description: '新建视频节点时自动选择该模型。',
    models: VIDEO_MODELS,
  },
];

export function CanvasDefaultModelSettings() {
  const [, refresh] = React.useState(0);

  React.useEffect(() => {
    const rerender = () => refresh((value) => value + 1);
    window.addEventListener('fisherai:model-catalog-changed', rerender);
    window.addEventListener('fisherai:default-models-changed', rerender);
    return () => {
      window.removeEventListener('fisherai:model-catalog-changed', rerender);
      window.removeEventListener('fisherai:default-models-changed', rerender);
    };
  }, []);

  React.useEffect(() => {
    for (const group of groups) clearInvalidDefaultModel(group.capability, group.models);
  });

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-xl font-bold text-[var(--af-text)]">默认模型</h2>
        <p className="mt-2 text-sm text-[var(--af-text-secondary)]">
          设置新建节点默认使用的文本、图像和视频模型。模型仍可在单个节点中随时切换。
        </p>
      </header>

      <div className="grid gap-4">
        {groups.map((group) => {
          const selected = getDefaultModelName(group.capability, group.models);
          const selectedModel = group.models.find((model) => model.name === selected);
          return (
            <div
              key={group.capability}
              className="rounded-xl border border-[var(--af-border)] bg-[var(--af-input)] p-5"
            >
              <div className="mb-3">
                <div className="text-sm font-semibold text-[var(--af-text)]">{group.label}</div>
                <div className="mt-1 text-xs text-[var(--af-text-muted)]">{group.description}</div>
              </div>
              <select
                aria-label={group.label}
                value={selected}
                onChange={(event) => setDefaultModelName(group.capability, event.target.value)}
                className="w-full rounded-lg border border-[var(--af-border)] bg-[var(--af-surface-raised)] px-3 py-2.5 text-sm text-[var(--af-text)] outline-none focus:border-[var(--af-info)]"
              >
                {group.models.map((model) => (
                  <option key={model.name} value={model.name}>
                    {model.name}
                  </option>
                ))}
              </select>
              {selectedModel?.description ? (
                <p className="mt-2 text-xs leading-5 text-[var(--af-text-muted)]">
                  {selectedModel.description}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
