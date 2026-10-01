import { IMAGE_MODELS, VIDEO_MODELS, TEXT_MODELS, AUDIO_MODELS } from '../../config/modelConfig';
import { generateImage, generateVideo, generateAudio, generateText } from '../generation/generationClient';
import { createCanvasPluginStorage, emitCanvasPluginEvent, onCanvasPluginEvent } from './canvasPluginEvents';
import { getDefaultModelName } from '../settings/defaultModelPreferences';
import { getCanvasPluginIdForNode, getCanvasPluginNodeDefinition } from './canvasPluginRegistry';
import type { PluginAi, PluginConnection, PluginNodeContext, PluginNodeData } from './canvasPluginTypes';

type RawNode = Record<string, any> & { id: string; type: string; x: number; y: number; parentIds?: string[] };
type Bridge = {
  getNodes(): RawNode[];
  setNodes(updater: (nodes: RawNode[]) => RawNode[]): void;
  setSelectedNodeIds(ids: string[]): void;
  getViewport(): { x: number; y: number; zoom: number };
  setViewport(viewport: { x: number; y: number; zoom: number }): void;
  createId(): string;
  projectId?: string;
  runGeneration?(nodeId: string): void | Promise<void>;
};

let bridge: Bridge | null = null;
let panelNodeId: string | null = null;
const panelListeners = new Set<() => void>();

export function bindCanvasPluginHost(next: Bridge | null) {
  bridge = next;
  window.dispatchEvent(new CustomEvent('fisherai:canvas-plugin-host-changed'));
}

export function currentPluginPanelNodeId() {
  return panelNodeId;
}
export function subscribePluginPanel(listener: () => void) {
  panelListeners.add(listener);
  return () => panelListeners.delete(listener);
}
function setPluginPanelNodeId(id: string | null) {
  panelNodeId = id;
  panelListeners.forEach((listener) => listener());
}

function pluginMetadata(node: RawNode): Record<string, unknown> {
  const value = node.pluginMetadata;
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

export function toPluginNode(node: RawNode): PluginNodeData {
  const definition = getCanvasPluginNodeDefinition(node.type);
  const mediaType = ['Image', 'Upload Image', 'Image Compare', 'Image Composite'].includes(node.type)
    ? 'image'
    : ['Video', 'Upload Video'].includes(node.type)
      ? 'video'
      : ['Audio', 'Upload Audio'].includes(node.type)
        ? 'audio'
        : node.type === 'Text'
          ? 'text'
          : node.type;
  const metadata = definition
    ? pluginMetadata(node)
    : {
        content:
          mediaType === 'text'
            ? String(node.textContent || '')
            : String(node.networkUrl || node.resultUrl || ''),
        status: node.status,
        model: node.model,
      };
  return {
    id: node.id,
    type: definition ? node.type : mediaType,
    title: String(node.title || definition?.title || node.type),
    position: { x: Number(node.x) || 0, y: Number(node.y) || 0 },
    width: Number(node.width) || getCanvasPluginNodeDefinition(node.type)?.defaultSize.width || 280,
    height: Number(node.height) || getCanvasPluginNodeDefinition(node.type)?.defaultSize.height || 200,
    metadata,
  };
}

function connections(nodes: RawNode[]): PluginConnection[] {
  const result: PluginConnection[] = [];
  for (const child of nodes) {
    for (const [index, parentId] of (child.parentIds || []).entries()) {
      if (!parentId) continue;
      result.push({ id: `${parentId}->${child.id}:${index}`, fromNodeId: parentId, toNodeId: child.id });
    }
  }
  return result;
}

function modelList(capability?: 'image'|'video'|'text'|'audio') {
  const groups = capability === 'image' ? [IMAGE_MODELS]
    : capability === 'video' ? [VIDEO_MODELS]
      : capability === 'audio' ? [AUDIO_MODELS]
        : capability === 'text' ? [TEXT_MODELS]
          : [TEXT_MODELS, IMAGE_MODELS, VIDEO_MODELS, AUDIO_MODELS];
  return groups.flat().map((model) => ({ value: model.name, label: model.name }));
}
function defaultModel(capability: 'image'|'video'|'text'|'audio') {
  return capability === 'image' ? getDefaultModelName('image', IMAGE_MODELS)
    : capability === 'video' ? getDefaultModelName('video', VIDEO_MODELS)
      : capability === 'audio' ? AUDIO_MODELS[0]?.name || ''
        : getDefaultModelName('text', TEXT_MODELS);
}

function pluginAi(): PluginAi {
  return {
    async generateImage(prompt, options = {}) {
      const references = Array.isArray(options.references) ? options.references.filter((v): v is string => typeof v === 'string') : [];
      const model = typeof options.model === 'string' && options.model ? options.model : defaultModel('image');
      const result = await generateImage({
        nodeId: `plugin-${crypto.randomUUID()}`,
        projectId: bridge?.projectId || 'plugin',
        prompt,
        imageModel: model,
        model,
        imageMode: references.length ? 'image-to-image' : 'text-to-image',
        imageBase64: references,
        images: references,
        generateCount: Math.max(1, Number(options.count) || 1),
        ...(typeof options.size === 'string' ? { size: options.size } : {}),
      });
      return { images: Array.isArray(result) ? result : [result] };
    },
    async generateVideo(prompt, options = {}) {
      const references = Array.isArray(options.references) ? options.references.filter((v): v is string => typeof v === 'string') : [];
      const model = typeof options.model === 'string' && options.model ? options.model : defaultModel('video');
      const result = await generateVideo({
        nodeId: `plugin-${crypto.randomUUID()}`,
        projectId: bridge?.projectId || 'plugin',
        prompt,
        videoModel: model,
        model,
        videoMode: references.length ? 'image-to-video' : 'text-to-video',
        imageBase64: references,
        images: references,
        ...(typeof options.seconds === 'string' ? { duration: Number(options.seconds) || options.seconds } : {}),
        ...(typeof options.size === 'string' ? { size: options.size } : {}),
      });
      const url = Array.isArray(result) ? result[0] : result;
      return { url, mimeType: 'video/mp4' };
    },
    async generateText(prompt, options = {}) {
      const model = typeof options.model === 'string' && options.model ? options.model : defaultModel('text');
      const references = Array.isArray(options.references)
        ? options.references.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
        : [];
      const images = references
        .filter((item) => item.kind === 'image' && typeof item.url === 'string')
        .map((item) => String(item.url));
      const videos = references
        .filter((item) => item.kind === 'video' && typeof item.url === 'string')
        .map((item) => String(item.url));
      const audios = references
        .filter((item) => item.kind === 'audio' && typeof item.url === 'string')
        .map((item) => String(item.url));
      const result = await generateText({
        nodeId: `plugin-${crypto.randomUUID()}`,
        projectId: bridge?.projectId || 'plugin',
        prompt: typeof options.system === 'string' && options.system ? `${options.system}\n\n${prompt}` : prompt,
        textModel: model,
        model,
        textMode: 'multimodal-chat',
        imageBase64: images.length ? images : undefined,
        images: images.length ? images : undefined,
        videoUrl: videos[0],
        videos: videos.length ? videos : undefined,
        audios: audios.length ? audios : undefined,
      });
      if (typeof options.onDelta === 'function') (options.onDelta as (text: string) => void)(result.text);
      return { text: result.text };
    },
    async generateAudio(prompt, options = {}) {
      const model = typeof options.model === 'string' && options.model ? options.model : defaultModel('audio');
      const result = await generateAudio({
        nodeId: `plugin-${crypto.randomUUID()}`,
        projectId: bridge?.projectId || 'plugin',
        prompt,
        audioModel: model,
        model,
        audioMode: 'text-to-audio',
      });
      const url = Array.isArray(result) ? result[0] : result;
      return { url, mimeType: 'audio/mpeg' };
    },
    listModels: modelList,
    defaultModel,
  };
}

function themeTokens() {
  const styles = getComputedStyle(document.documentElement);
  const value = (name: string, fallback: string) => styles.getPropertyValue(name).trim() || fallback;
  return {
    canvas: {
      background: value('--af-canvas', '#111'),
      dot: value('--af-border', '#333'),
      line: value('--af-border', '#444'),
      selectionStroke: value('--af-info', '#3b82f6'),
      selectionFill: 'rgba(59,130,246,.12)',
    },
    node: {
      label: value('--af-text-secondary', '#ccc'),
      fill: value('--af-surface', '#181818'),
      panel: value('--af-surface-raised', '#222'),
      stroke: value('--af-border', '#333'),
      activeStroke: value('--af-info', '#3b82f6'),
      placeholder: value('--af-text-muted', '#777'),
      text: value('--af-text', '#eee'),
      muted: value('--af-text-muted', '#999'),
      faint: value('--af-text-muted', '#777'),
    },
    toolbar: {
      panel: value('--af-surface-raised', '#222'),
      border: value('--af-border', '#333'),
      item: value('--af-text-secondary', '#ccc'),
      itemHover: value('--af-hover', '#333'),
      activeBg: value('--af-hover', '#333'),
      activeText: value('--af-text', '#fff'),
    },
  };
}

function addRawNode(operation: Record<string, any>) {
  if (!bridge) return;
  const requestedType = String(operation.nodeType || operation.typeId || 'Text');
  const builtinType = ({
    text: 'Text',
    image: 'Upload Image',
    video: 'Upload Video',
    audio: 'Upload Audio',
  } as Record<string, string>)[requestedType.toLowerCase()];
  const type = builtinType || requestedType;
  const definition = getCanvasPluginNodeDefinition(type);
  const id = String(operation.id || bridge.createId());
  const metadata = operation.metadata && typeof operation.metadata === 'object' ? operation.metadata : {};
  const node: RawNode = definition ? {
    id,
    type,
    x: Number(operation.x ?? operation.position?.x) || 0,
    y: Number(operation.y ?? operation.position?.y) || 0,
    width: Number(operation.width) || definition.defaultSize.width,
    height: Number(operation.height) || definition.defaultSize.height,
    title: operation.title || definition.title,
    status: 'idle',
    parentIds: [],
    pluginMetadata: { ...(definition.defaultMetadata || {}), ...metadata },
  } : {
    id,
    type,
    x: Number(operation.x ?? operation.position?.x) || 0,
    y: Number(operation.y ?? operation.position?.y) || 0,
    title: operation.title,
    prompt: '',
    status: 'idle',
    parentIds: [],
    ...(type === 'Text'
      ? { textContent: typeof metadata.content === 'string' ? metadata.content : '' }
      : { resultUrl: typeof metadata.content === 'string' ? metadata.content : undefined }),
  };
  bridge.setNodes((nodes) => [...nodes, node]);
}

function applyOps(ops: Array<Record<string, any>>) {
  if (!bridge) return;
  for (const op of ops) {
    const type = String(op.type || '');
    if (type === 'add_node') {
      addRawNode(op);
      continue;
    }
    if (type === 'select_nodes') {
      bridge.setSelectedNodeIds(Array.isArray(op.ids) ? op.ids.map(String) : []);
      continue;
    }
    if (type === 'set_viewport' && op.viewport) {
      bridge.setViewport({
        x: Number(op.viewport.x) || 0,
        y: Number(op.viewport.y) || 0,
        zoom: Number(op.viewport.zoom ?? op.viewport.k) || 1,
      });
      continue;
    }
    if (type === 'run_generation' && op.nodeId) {
      void bridge.runGeneration?.(String(op.nodeId));
      continue;
    }
    bridge.setNodes((nodes) => {
      if (type === 'update_node') {
        return nodes.map((node) => node.id === op.id ? {
          ...node,
          ...(op.patch || {}),
          ...(op.metadata ? { pluginMetadata: { ...pluginMetadata(node), ...op.metadata } } : {}),
        } : node);
      }
      if (type === 'delete_node') {
        const ids = new Set<string>(Array.isArray(op.ids) ? op.ids.map(String) : op.id ? [String(op.id)] : []);
        return nodes.filter((node) => !ids.has(node.id)).map((node) => ({ ...node, parentIds: (node.parentIds || []).filter((id) => !ids.has(id)) }));
      }
      if (type === 'connect_nodes' && op.fromNodeId && op.toNodeId) {
        return nodes.map((node) => node.id === op.toNodeId && !(node.parentIds || []).includes(op.fromNodeId)
          ? { ...node, parentIds: [...(node.parentIds || []), String(op.fromNodeId)] } : node);
      }
      if (type === 'delete_connections') {
        if (op.all) return nodes.map((node) => ({ ...node, parentIds: [] }));
        const ids = new Set<string>(Array.isArray(op.ids) ? op.ids.map(String) : op.id ? [String(op.id)] : []);
        return nodes.map((node) => ({
          ...node,
          parentIds: (node.parentIds || []).filter((parentId, index) => !ids.has(`${parentId}->${node.id}:${index}`)),
        }));
      }
      return nodes;
    });
  }
}

export function buildCanvasPluginContext(rawNode: RawNode, selected: boolean, scale: number): PluginNodeContext {
  const node = toPluginNode(rawNode);
  const getRawNodes = () => bridge?.getNodes() || [];
  const getConnections = () => connections(getRawNodes());
  const pluginId = getCanvasPluginIdForNode(node.type);
  return {
    node,
    theme: themeTokens(),
    scale,
    isSelected: selected,
    updateMetadata(patch) {
      bridge?.setNodes((nodes) => nodes.map((item) => item.id === node.id
        ? { ...item, pluginMetadata: { ...pluginMetadata(item), ...patch } }
        : item));
    },
    updateNode(patch) {
      bridge?.setNodes((nodes) => nodes.map((item) => item.id === node.id ? {
        ...item,
        ...(patch.title !== undefined ? { title: patch.title } : {}),
        ...(patch.width !== undefined ? { width: patch.width } : {}),
        ...(patch.height !== undefined ? { height: patch.height } : {}),
      } : item));
    },
    getNode(id) {
      const found = getRawNodes().find((item) => item.id === id);
      return found ? toPluginNode(found) : null;
    },
    getNodes: () => getRawNodes().map(toPluginNode),
    getConnections,
    getUpstream: () => getConnections()
      .filter((connection) => connection.toNodeId === node.id)
      .map((connection) => getRawNodes().find((item) => item.id === connection.fromNodeId))
      .filter((item): item is RawNode => Boolean(item))
      .map(toPluginNode),
    getDownstream: () => getConnections()
      .filter((connection) => connection.fromNodeId === node.id)
      .map((connection) => getRawNodes().find((item) => item.id === connection.toNodeId))
      .filter((item): item is RawNode => Boolean(item))
      .map(toPluginNode),
    applyOps,
    emit: emitCanvasPluginEvent,
    on: onCanvasPluginEvent,
    ai: pluginAi(),
    openPanel: () => setPluginPanelNodeId(node.id),
    closePanel: () => setPluginPanelNodeId(null),
    storage: createCanvasPluginStorage(pluginId),
  };
}
