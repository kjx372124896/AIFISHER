import type * as ReactTypes from 'react';
import { createPortal } from 'react-dom';

export interface VideoScriptShot {
  id: string;
  shotNumber: number;
  durationSeconds: number;
  plotDescription: string;
  dialogue: string;
  shotSize: string;
  camera: string;
  motion: string;
  audioEffects: string;
  continuityOut: string;
}

interface NodeData {
  id: string;
  type: string;
  title?: string;
  textModel?: string;
  textContent?: string;
  status?: string;
  errorMessage?: string;
  videoScriptMinShot?: number;
  videoScriptMaxShot?: number;
  videoScriptTotalDuration?: number;
  videoScriptSegmentCount?: number;
  videoScriptPresetPrompt?: string;
  videoScriptRows?: VideoScriptShot[];
  videoScriptParsedSource?: string;
  [key: string]: unknown;
}

interface Props extends Record<string, unknown> {
  data: NodeData;
  selected?: boolean;
  isDragging?: boolean;
  isResizing?: boolean;
  showControls?: boolean;
  onUpdate(id: string, patch: Record<string, unknown>): void;
  onGenerate?(id: string): void | Promise<void>;
  onCreateVideoScriptSegments?(id: string, segments: Array<{ title: string; text: string; duration: number }>): void;
}

interface Components {
  Frame: ReactTypes.ComponentType<Record<string, unknown>>;
  PromptEditor: ReactTypes.ComponentType<{
    value: string;
    onChange(value: string): void;
    placeholder?: string;
    isDark?: boolean;
    type?: 'text' | 'image' | 'video' | 'audio';
    disableMentions?: boolean;
  }>;
  models: Array<{ name: string }>;
  FilmIcon: ReactTypes.ComponentType<{ size?: number; className?: string }>;
  TableIcon: ReactTypes.ComponentType<{ size?: number; className?: string }>;
  SplitIcon: ReactTypes.ComponentType<{ size?: number; className?: string }>;
  PlayIcon: ReactTypes.ComponentType<{ size?: number; className?: string }>;
  CloseIcon: ReactTypes.ComponentType<{ size?: number; className?: string }>;
}

const DEFAULT_PRESET = '前三秒建立明确钩子；节奏紧凑；镜头语言高级；优先展示产品价值与真实使用场景；旁白简洁有力；避免廉价广告感。';

function number(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeShot(raw: Record<string, unknown>, index: number): VideoScriptShot {
  const text = (value: unknown) => typeof value === 'string' ? value.trim() : value == null ? '' : String(value);
  return {
    id: text(raw.id) || `shot-${index + 1}`,
    shotNumber: Math.max(1, Math.round(number(raw.shotNumber, index + 1))),
    durationSeconds: Math.max(0.1, number(raw.durationSeconds, 2)),
    plotDescription: text(raw.plotDescription),
    dialogue: text(raw.dialogue),
    shotSize: text(raw.shotSize),
    camera: text(raw.camera),
    motion: text(raw.motion),
    audioEffects: text(raw.audioEffects),
    continuityOut: text(raw.continuityOut),
  };
}

function jsonCandidates(value: string) {
  const result = [value.trim()];
  for (const match of value.matchAll(/```(?:json)?\s*([\s\S]*?)\s*```/gi)) result.push(match[1].trim());
  const first = value.indexOf('{'), last = value.lastIndexOf('}');
  if (first >= 0 && last > first) result.push(value.slice(first, last + 1));
  return [...new Set(result.filter(Boolean))];
}

export function parseVideoScript(value: string): VideoScriptShot[] | null {
  for (const candidate of jsonCandidates(value)) {
    try {
      const parsed = JSON.parse(candidate) as { rows?: unknown };
      if (!Array.isArray(parsed.rows) || !parsed.rows.length) continue;
      const rows = parsed.rows
        .filter((row): row is Record<string, unknown> => !!row && typeof row === 'object' && !Array.isArray(row))
        .map(normalizeShot);
      if (rows.length) return rows;
    } catch {
      // Try the next candidate because providers sometimes wrap JSON in prose/code fences.
    }
  }
  return null;
}

export function segmentVideoScriptRows(rows: readonly VideoScriptShot[], segmentCount: number, targetSeconds: number) {
  const count = Math.max(1, Math.round(segmentCount));
  const target = Math.max(0.1, targetSeconds);
  if (!rows.length) return Array.from({ length: count }, () => [] as VideoScriptShot[]);

  const nonEmptyGroups = Math.min(count, rows.length);
  const prefix = [0];
  rows.forEach((row) => prefix.push(prefix[prefix.length - 1] + row.durationSeconds));
  const rangeSum = (start: number, end: number) => prefix[end] - prefix[start];
  const memo = new Map<string, number[] | null>();

  const solve = (start: number, groupsLeft: number): number[] | null => {
    const key = `${start}:${groupsLeft}`;
    if (memo.has(key)) return memo.get(key)!;
    if (groupsLeft === 1) {
      const result = rangeSum(start, rows.length) <= target + 0.0001 ? [rows.length] : null;
      memo.set(key, result);
      return result;
    }
    const latestEnd = rows.length - (groupsLeft - 1);
    for (let end = start + 1; end <= latestEnd; end += 1) {
      if (rangeSum(start, end) > target + 0.0001) break;
      const rest = solve(end, groupsLeft - 1);
      if (rest) {
        const result = [end, ...rest];
        memo.set(key, result);
        return result;
      }
    }
    memo.set(key, null);
    return null;
  };

  const cuts = solve(0, nonEmptyGroups);
  const groups: VideoScriptShot[][] = [];
  if (cuts) {
    let start = 0;
    for (const end of cuts) {
      groups.push(rows.slice(start, end));
      start = end;
    }
  } else {
    // If the configured duration is mathematically impossible, keep order and
    // produce the requested node count instead of silently dropping shots.
    const perGroup = Math.ceil(rows.length / nonEmptyGroups);
    for (let start = 0; start < rows.length; start += perGroup) {
      groups.push(rows.slice(start, Math.min(rows.length, start + perGroup)));
    }
  }
  while (groups.length < count) groups.push([]);
  return groups.slice(0, count);
}

export function videoScriptSystemPrompt(node: NodeData) {
  const minShot = Math.max(0.1, number(node.videoScriptMinShot, 1));
  const maxShot = Math.max(minShot, number(node.videoScriptMaxShot, 3));
  const total = Math.max(1, number(node.videoScriptTotalDuration, 60));
  const segments = Math.max(1, Math.round(number(node.videoScriptSegmentCount, 4)));
  const perSegment = total / segments;
  const preset = String(node.videoScriptPresetPrompt || DEFAULT_PRESET).trim();
  return `请结合上游全部文本与图片素材生成结构化视频分镜脚本。下面的节点内置规则只用于约束数据结构和时长，创作风格以用户预设和上游素材为准。

创作要求（用户预设）：
${preset || '无额外创作要求'}

硬性时长约束：
- 单镜头时长必须在 ${minShot}-${maxShot} 秒之间。
- 全片目标总时长约 ${total} 秒。
- 后续会拆成 ${segments} 段，每段目标不超过 ${perSegment.toFixed(2)} 秒。
- 镜头要按叙事顺序生成，不要为了凑时长写空镜头。
- durationSeconds 必须是数字。

只输出 JSON，不要 Markdown、解释、前后缀。严格使用：
{
  "title": "视频脚本",
  "rows": [
    {
      "shotNumber": 1,
      "durationSeconds": 2,
      "plotDescription": "画面与动作",
      "dialogue": "台词/旁白，没有则空字符串",
      "shotSize": "景别",
      "camera": "机位/镜头设计",
      "motion": "运镜",
      "audioEffects": "音乐/环境声/音效",
      "continuityOut": "镜头结束状态/与下一镜衔接"
    }
  ]
}

必须保证 rows 是完整镜头数组；shotNumber 从1连续递增；不要返回额外字段。`;
}

function shotText(row: VideoScriptShot) {
  return [
    `镜头${String(row.shotNumber).padStart(2, '0')}｜${row.durationSeconds}s`,
    `画面：${row.plotDescription}`,
    row.dialogue ? `台词/旁白：${row.dialogue}` : '',
    row.shotSize ? `景别：${row.shotSize}` : '',
    row.camera ? `机位：${row.camera}` : '',
    row.motion ? `运镜：${row.motion}` : '',
    row.audioEffects ? `声音：${row.audioEffects}` : '',
    row.continuityOut ? `衔接：${row.continuityOut}` : '',
  ].filter(Boolean).join('\n');
}

export function buildVideoScriptSegments(node: NodeData, rows: readonly VideoScriptShot[]) {
  const total = Math.max(1, number(node.videoScriptTotalDuration, 60));
  const segmentCount = Math.max(1, Math.round(number(node.videoScriptSegmentCount, 4)));
  const target = total / segmentCount;
  return segmentVideoScriptRows(rows, segmentCount, target).map((group, index) => ({
    title: `视频脚本 · 第${index + 1}段`,
    duration: group.reduce((sum, row) => sum + row.durationSeconds, 0),
    text: [
      `【第${index + 1}段】`,
      `目标时长：≤ ${target.toFixed(2)}秒`,
      `实际镜头时长：${group.reduce((sum, row) => sum + row.durationSeconds, 0).toFixed(2)}秒`,
      '',
      ...group.map(shotText),
    ].join('\n\n'),
  }));
}

export function CanvasVideoScriptNode(
  React: Pick<typeof ReactTypes, 'createElement' | 'useEffect' | 'useMemo' | 'useState'>,
  props: Props,
  { Frame, PromptEditor, models, FilmIcon, TableIcon, SplitIcon, PlayIcon, CloseIcon }: Components,
) {
  const node = props.data;
  const minShot = number(node.videoScriptMinShot, 1);
  const maxShot = number(node.videoScriptMaxShot, 3);
  const total = number(node.videoScriptTotalDuration, 60);
  const segmentCount = Math.max(1, Math.round(number(node.videoScriptSegmentCount, 4)));
  const preset = String(node.videoScriptPresetPrompt || DEFAULT_PRESET);
  const rows = Array.isArray(node.videoScriptRows) ? node.videoScriptRows : [];
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const nextPrompt = videoScriptSystemPrompt(node);
    if (node.prompt !== nextPrompt) props.onUpdate(node.id, { prompt: nextPrompt });
  }, [node.id, minShot, maxShot, total, segmentCount, preset]);

  React.useEffect(() => {
    const raw = String(node.textContent || '');
    if (!raw || raw === node.videoScriptParsedSource) return;
    const parsed = parseVideoScript(raw);
    if (parsed) props.onUpdate(node.id, { videoScriptRows: parsed, videoScriptParsedSource: raw });
  }, [node.id, node.textContent, node.videoScriptParsedSource]);

  const duration = rows.reduce((sum, row) => sum + number(row.durationSeconds, 0), 0);
  const target = total / segmentCount;
  const segments = React.useMemo(
    () => buildVideoScriptSegments(node, rows),
    [rows, total, segmentCount],
  );
  const invalidShots = rows.filter((row) => row.durationSeconds < minShot || row.durationSeconds > maxShot).length;
  const statusText = node.status === 'loading' ? '生成中…' : node.status === 'error' ? String(node.errorMessage || '生成失败') : rows.length ? `${rows.length}镜 · ${duration.toFixed(1)}s` : '等待生成';

  const patchConfig = (patch: Record<string, unknown>) => props.onUpdate(node.id, patch);
  const patchRow = (index: number, patch: Partial<VideoScriptShot>) => {
    const next = rows.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row)
      .map((row, rowIndex) => ({ ...row, shotNumber: rowIndex + 1 }));
    props.onUpdate(node.id, { videoScriptRows: next });
  };
  const removeRow = (index: number) => {
    const next = rows.filter((_, rowIndex) => rowIndex !== index)
      .map((row, rowIndex) => ({ ...row, shotNumber: rowIndex + 1 }));
    props.onUpdate(node.id, { videoScriptRows: next });
  };

  const input = (label: string, value: number, patchKey: string, step = 1) => (
    <label className="flex min-w-0 flex-col gap-1 text-[10px] text-[var(--af-text-muted)]">
      {label}
      <input
        className="h-8 rounded-lg border border-[var(--af-border)] bg-[var(--af-bg)] px-2 text-xs text-[var(--af-text)] outline-none"
        type="number"
        step={step}
        value={value}
        onPointerDown={(event) => event.stopPropagation()}
        onChange={(event) => patchConfig({ [patchKey]: Number(event.target.value) })}
      />
    </label>
  );

  return (
    <Frame
      {...props}
      data={node}
      selected={props.selected}
      isDragging={props.isDragging}
      isResizing={props.isResizing}
      width="620px"
      controlsScaleWithCanvas={true}
    >
      <div className="flex h-full min-h-[330px] flex-col overflow-hidden rounded-[inherit] bg-[var(--af-node-bg)]">
        <div className="flex h-11 items-center gap-2 border-b border-[var(--af-border)] px-3">
          <FilmIcon size={16} />
          <strong className="text-xs">视频脚本</strong>
          <span className="text-[10px] text-[var(--af-text-muted)]">{statusText}</span>
          <div className="flex-1" />
          <select
            className="h-7 max-w-[180px] rounded-md border border-[var(--af-border)] bg-[var(--af-bg)] px-2 text-[10px]"
            value={String(node.textModel || models[0]?.name || '')}
            onPointerDown={(event) => event.stopPropagation()}
            onChange={(event) => patchConfig({ textModel: event.target.value })}
          >
            {models.map((model) => <option key={model.name} value={model.name}>{model.name}</option>)}
          </select>
          <button className="flex h-7 items-center gap-1 rounded-md bg-[var(--af-info)] px-2.5 text-[10px] text-white disabled:opacity-50" onPointerDown={(event) => event.stopPropagation()} disabled={node.status === 'loading'} onClick={() => props.onGenerate?.(node.id)}>
            <PlayIcon size={12} />生成
          </button>
        </div>

        <div className="grid grid-cols-5 gap-2 border-b border-[var(--af-border)] p-3">
          {input('单镜头最短(s)', minShot, 'videoScriptMinShot', 0.5)}
          {input('单镜头最长(s)', maxShot, 'videoScriptMaxShot', 0.5)}
          {input('总时长(s)', total, 'videoScriptTotalDuration')}
          {input('分段数', segmentCount, 'videoScriptSegmentCount')}
          <label className="flex min-w-0 flex-col gap-1 text-[10px] text-[var(--af-text-muted)]">单段目标
            <div className="flex h-8 items-center rounded-lg border border-[var(--af-border)] bg-[var(--af-bg)] px-2 text-xs text-[var(--af-text)]">{target.toFixed(2)}s</div>
          </label>
        </div>

        <div className="border-b border-[var(--af-border)] px-3 py-2">
          <div className="mb-1 text-[10px] text-[var(--af-text-muted)]">创作提示词 · 输入 \ 调用文本提示词预设</div>
          <div className="min-h-16 rounded-lg border border-[var(--af-border)] bg-[var(--af-bg)] px-2 py-1.5 text-[11px] leading-4">
            <PromptEditor
              type="text"
              value={preset}
              onChange={(value) => patchConfig({ videoScriptPresetPrompt: value })}
              placeholder="输入创作要求，按 \\ 调用提示词预设"
              isDark={true}
              disableMentions={true}
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 p-3">
          <div className="rounded-lg border border-[var(--af-border)] p-2"><b className="block text-sm">{rows.length}</b><span className="text-[9px] text-[var(--af-text-muted)]">镜头数</span></div>
          <div className="rounded-lg border border-[var(--af-border)] p-2"><b className="block text-sm">{duration.toFixed(1)}s</b><span className="text-[9px] text-[var(--af-text-muted)]">脚本总时长</span></div>
          <div className="rounded-lg border border-[var(--af-border)] p-2"><b className="block text-sm">{segmentCount} × {target.toFixed(1)}s</b><span className="text-[9px] text-[var(--af-text-muted)]">输出分段</span></div>
          <div className="rounded-lg border border-[var(--af-border)] p-2"><b className={`block text-sm ${invalidShots ? 'text-red-400' : 'text-emerald-400'}`}>{invalidShots ? `${invalidShots}镜异常` : rows.length ? '通过' : '-'}</b><span className="text-[9px] text-[var(--af-text-muted)]">时长校验</span></div>
        </div>

        <div className="flex flex-1 items-end gap-2 p-3">
          <button className="flex h-8 items-center gap-1 rounded-lg border border-[var(--af-border)] px-2.5 text-[10px]" onPointerDown={(event) => event.stopPropagation()} onClick={() => setOpen(true)} disabled={!rows.length}><TableIcon size={12}/>完整视频脚本</button>
          <button className="flex h-8 items-center gap-1 rounded-lg border border-[var(--af-border)] px-2.5 text-[10px]" onPointerDown={(event) => event.stopPropagation()} onClick={() => props.onCreateVideoScriptSegments?.(node.id, segments)} disabled={!rows.length}><SplitIcon size={12}/>生成 {segmentCount} 个文本节点</button>
          <div className="flex-1" />
          <span className="text-[9px] text-[var(--af-text-muted)]">按累计时长切分 · 保持镜头顺序</span>
        </div>
      </div>

      {open && createPortal(
        <div
          className="fixed inset-0 z-[5000] flex bg-[#0b0b0d]"
          onPointerDown={(event) => event.stopPropagation()}
          onWheel={(event) => event.stopPropagation()}
          onWheelCapture={(event) => event.stopPropagation()}
        >
          <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#0b0b0d]">
            <div className="flex h-12 shrink-0 items-center gap-2 border-b border-[var(--af-border)] px-4">
              <TableIcon size={16}/><strong className="text-sm">完整视频脚本</strong>
              <span className="text-[10px] text-[var(--af-text-muted)]">{rows.length} 镜 · {duration.toFixed(2)} 秒</span>
              <div className="flex-1" />
              <button className="grid h-8 w-8 place-items-center rounded-lg hover:bg-white/5" onClick={() => setOpen(false)}><CloseIcon size={16}/></button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto">
              <table className="w-full min-w-[1180px] border-collapse text-[10px]">
                <thead className="sticky top-0 z-10 bg-[#0b0b0d] text-[var(--af-text-muted)]"><tr>
                  {['#','时长','画面描述','台词/旁白','景别','机位','运镜','声音','衔接',''].map((label) => <th key={label} className="border-b border-[var(--af-border)] p-2 text-left">{label}</th>)}
                </tr></thead>
                <tbody>{rows.map((row, index) => {
                  const field = (key: keyof VideoScriptShot, value: string, wide = false) => <textarea className={`${wide ? 'w-64' : 'w-36'} min-h-14 resize-y rounded-md border border-transparent bg-transparent p-1 outline-none focus:border-[var(--af-border)]`} value={value} onChange={(event) => patchRow(index, { [key]: event.target.value })}/>;
                  const invalid = row.durationSeconds < minShot || row.durationSeconds > maxShot;
                  return <tr key={row.id || index} className="border-b border-[var(--af-border)] align-top">
                    <td className="p-2">{index + 1}</td>
                    <td className="p-2"><input className={`w-16 rounded-md border bg-transparent p-1 outline-none ${invalid ? 'border-red-500 text-red-400' : 'border-transparent'}`} type="number" step="0.5" value={row.durationSeconds} onChange={(event) => patchRow(index, { durationSeconds: Number(event.target.value) })}/></td>
                    <td className="p-2">{field('plotDescription', row.plotDescription, true)}</td>
                    <td className="p-2">{field('dialogue', row.dialogue, true)}</td>
                    <td className="p-2">{field('shotSize', row.shotSize)}</td>
                    <td className="p-2">{field('camera', row.camera)}</td>
                    <td className="p-2">{field('motion', row.motion)}</td>
                    <td className="p-2">{field('audioEffects', row.audioEffects)}</td>
                    <td className="p-2">{field('continuityOut', row.continuityOut)}</td>
                    <td className="p-2"><button className="rounded px-2 py-1 text-red-400 hover:bg-red-500/10" onClick={() => removeRow(index)}>删除</button></td>
                  </tr>;
                })}</tbody>
              </table>
            </div>
            <div className="flex shrink-0 items-center gap-2 border-t border-[var(--af-border)] p-3">
              <button className="rounded-lg border border-[var(--af-border)] px-3 py-2 text-[10px]" onClick={() => props.onUpdate(node.id, { videoScriptRows: [...rows, normalizeShot({}, rows.length)] })}>+ 添加镜头</button>
              <span className="text-[10px] text-[var(--af-text-muted)]">红色时长表示超出 {minShot}–{maxShot}s 约束</span>
              <div className="flex-1" />
              <button className="rounded-lg bg-[var(--af-info)] px-4 py-2 text-[10px] text-white" onClick={() => setOpen(false)}>完成</button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </Frame>
  );
}
