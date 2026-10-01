import type * as ReactTypes from 'react';
import type { CanvasComponent } from '../app/canvasComponentType';
import { buildCanvasPluginContext, currentPluginPanelNodeId, subscribePluginPanel } from './canvasPluginHost';
import { getCanvasPluginNodeDefinition } from './canvasPluginRegistry';

type Runtime = Pick<typeof ReactTypes, 'createElement'|'useState'|'useEffect'|'useSyncExternalStore'>;
type Props = Record<string, any> & { data: Record<string, any>; selected?: boolean; zoom?: number; showControls?: boolean };
type Components = { Frame: CanvasComponent };

export function CanvasPluginNode(React: Runtime, props: Props, { Frame }: Components) {
  const definition = getCanvasPluginNodeDefinition(String(props.data.type || ''));
  if (!definition) {
    return (
      <Frame {...props}>
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-5 text-center">
          <div className="text-sm font-semibold text-[var(--af-text)]">缺少画布插件</div>
          <div className="max-w-[260px] break-all text-xs text-[var(--af-text-muted)]">
            节点类型：{String(props.data.type || '')}
          </div>
          <div className="text-xs text-[var(--af-text-muted)]">请在“设置 → 画布插件”中重新安装或启用对应插件。</div>
        </div>
      </Frame>
    );
  }
  const ctx = buildCanvasPluginContext(props.data as any, Boolean(props.selected), Number(props.zoom) || 1);
  const Content = definition.Content;
  const Panel = definition.Panel;
  const panelNodeId = React.useSyncExternalStore(subscribePluginPanel, currentPluginPanelNodeId, currentPluginPanelNodeId);
  const storedContent = typeof ctx.node.metadata?.content === 'string' ? ctx.node.metadata.content : '';
  const forcedInteractive = Boolean(definition.forceInteractive?.(ctx.node));
  const interactive = !definition.interactionToggle || forcedInteractive || !storedContent
    ? true
    : Boolean(ctx.node.metadata?.interactive);
  const toolbar = definition.toolbar?.(ctx) || [];
  if (definition.interactionToggle && storedContent && !forcedInteractive) {
    toolbar.unshift({
      id: 'host-interaction-toggle',
      title: interactive ? '切换为移动模式' : '切换为交互模式',
      label: interactive ? '移动' : '交互',
      icon: interactive ? '✋' : '🖐',
      active: interactive,
      onClick: () => ctx.updateMetadata({ interactive: !interactive }),
    });
  }
  const panelOpen = panelNodeId === props.data.id;
  const builtin = definition.useBuiltinPanel;
  const [builtinPrompt, setBuiltinPrompt] = React.useState('');
  const [builtinBusy, setBuiltinBusy] = React.useState(false);
  const [builtinError, setBuiltinError] = React.useState('');
  React.useEffect(() => {
    if (props.selected && definition.autoOpenPanel && Panel) ctx.openPanel();
  }, [props.selected, definition.autoOpenPanel, Panel]);
  const runBuiltin = async () => {
    if (!builtin || !builtinPrompt.trim() || builtinBusy) return;
    setBuiltinBusy(true);
    setBuiltinError('');
    try {
      const prompt = `${builtin.promptPrefix || ''}${builtinPrompt}`;
      if (builtin.mode === 'text') {
        const result = await ctx.ai.generateText(prompt);
        if (builtin.writeBackToSelf !== false) ctx.updateMetadata({ content: result.text, status: 'success' });
      } else if (builtin.mode === 'image') {
        const result = await ctx.ai.generateImage(prompt);
        if (builtin.writeBackToSelf !== false) ctx.updateMetadata({ content: result.images[0] || '', status: 'success' });
      } else if (builtin.mode === 'video') {
        const result = await ctx.ai.generateVideo(prompt);
        if (builtin.writeBackToSelf !== false) ctx.updateMetadata({ content: result.url, status: 'success' });
      } else if (builtin.mode === 'audio' && ctx.ai.generateAudio) {
        const result = await ctx.ai.generateAudio(prompt);
        if (builtin.writeBackToSelf !== false) ctx.updateMetadata({ content: result.url, status: 'success' });
      }
    } catch (error) {
      setBuiltinError(error instanceof Error ? error.message : '生成失败');
    } finally {
      setBuiltinBusy(false);
    }
  };
  const resizeStart = (
    event: ReactTypes.PointerEvent,
    id: string,
    width: number,
    height: number,
  ) => {
    if (!definition.keepAspectRatio?.(ctx.node)) {
      props.onResizeStart?.(event, id, width, height);
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startY = event.clientY;
    const ratio = width / Math.max(1, height);
    const zoom = Math.max(0.05, Number(props.zoom) || 1);
    const move = (next: PointerEvent) => {
      const dx = (next.clientX - startX) / zoom;
      const dy = (next.clientY - startY) / zoom;
      const candidateWidth = Math.max(112, width + (Math.abs(dx) >= Math.abs(dy) ? dx : dy * ratio));
      ctx.updateNode({ width: candidateWidth, height: candidateWidth / ratio });
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up, { once: true });
  };
  const controls = props.selected && !props.isDragging && props.showControls !== false ? (
    <div
      data-canvas-no-zoom
      onPointerDown={(event) => event.stopPropagation()}
      className="flex flex-col gap-2 rounded-xl border border-[var(--af-border)] bg-[var(--af-surface-raised)] p-2 shadow-2xl"
      style={{ minWidth: 260, maxWidth: 680 }}
    >
      {toolbar.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {toolbar.map((item) => (
            <button
              key={item.id}
              type="button"
              title={item.title}
              onClick={item.onClick}
              className={`rounded-md border px-2 py-1 text-xs ${item.danger ? 'border-red-500/40 text-red-400' : item.active ? 'border-blue-500 bg-blue-500/10 text-blue-300' : 'border-[var(--af-border)] text-[var(--af-text)]'}`}
            >
              <span className="mr-1">{item.icon}</span>{item.label}
            </button>
          ))}
        </div>
      )}
      {Panel && panelOpen && <Panel ctx={ctx} onClose={ctx.closePanel} />}
      {builtin && !definition.hidePanel && (
        <div className="flex min-w-[360px] flex-col gap-2">
          <textarea
            value={builtinPrompt}
            onChange={(event) => setBuiltinPrompt(event.target.value)}
            placeholder="输入生成提示词…"
            className="min-h-20 rounded-md border border-[var(--af-border)] bg-[var(--af-input)] p-2 text-sm text-[var(--af-text)]"
          />
          <div className="flex items-center gap-2">
            <button type="button" disabled={builtinBusy || !builtinPrompt.trim()} onClick={() => void runBuiltin()} className="fisherai-button is-primary">
              {builtinBusy ? '生成中…' : `生成${builtin.mode === 'image' ? '图片' : builtin.mode === 'video' ? '视频' : builtin.mode === 'audio' ? '音频' : '文本'}`}
            </button>
            {builtinError && <span className="text-xs text-red-400">{builtinError}</span>}
          </div>
        </div>
      )}
    </div>
  ) : null;

  return (
    <Frame
      {...props}
      isBareCard={definition.transparentBackground}
      onResizeStart={resizeStart}
      controls={controls}
    >
      <div
        data-fisherai-plugin-node={definition.type}
        onDoubleClick={(event) => {
          if (definition.onDoubleClick?.(ctx)) event.stopPropagation();
        }}
        style={{ width: '100%', height: '100%', overflow: 'visible' }}
      >
        <div style={{ width: '100%', height: '100%', pointerEvents: interactive ? 'auto' : 'none' }}>
          {Content
            ? <Content ctx={ctx} />
            : <div className="flex h-full items-center justify-center p-4 text-sm text-[var(--af-text-muted)]">插件节点没有 Content 渲染器</div>}
        </div>
      </div>
    </Frame>
  );
}
