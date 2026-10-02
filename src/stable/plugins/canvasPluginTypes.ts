import type * as React from 'react';

export type PluginNodeData = {
  id: string;
  type: string;
  title: string;
  position: { x: number; y: number };
  width: number;
  height: number;
  metadata?: Record<string, unknown>;
};

export type PluginConnection = {
  id: string;
  fromNodeId: string;
  toNodeId: string;
};

export type PluginStorage = {
  get<T = unknown>(key: string): Promise<T | null>;
  set(key: string, value: unknown): Promise<void>;
  remove(key: string): Promise<void>;
};

export type PluginAi = {
  generateImage(prompt: string, options?: Record<string, unknown>): Promise<{ images: string[] }>;
  generateVideo(prompt: string, options?: Record<string, unknown>): Promise<{ url: string; mimeType: string; width?: number; height?: number; durationMs?: number }>;
  generateText(prompt: string, options?: Record<string, unknown>): Promise<{ text: string }>;
  generateAudio?(prompt: string, options?: Record<string, unknown>): Promise<{ url: string; mimeType: string }>;
  listModels(capability?: 'image' | 'video' | 'text' | 'audio'): Array<{ value: string; label: string }>;
  defaultModel(capability: 'image' | 'video' | 'text' | 'audio'): string;
};

export type PluginResourceItem = {
  kind: 'text' | 'image' | 'video' | 'audio';
  text?: string;
  url?: string;
  assetId?: string;
  projectId?: string;
  sourceNodeId?: string;
  order?: number;
};
export type PluginNodeResource =
  | PluginResourceItem
  | { kind: 'bundle'; items: PluginResourceItem[] };

export type PluginNodeContext = {
  node: PluginNodeData;
  theme: Record<string, any>;
  scale: number;
  isSelected: boolean;
  updateMetadata(patch: Record<string, unknown>): void;
  updateNode(patch: Partial<Pick<PluginNodeData, 'title' | 'width' | 'height'>>): void;
  getNode(id: string): PluginNodeData | null;
  getNodes(): PluginNodeData[];
  getConnections(): PluginConnection[];
  getUpstream(): PluginNodeData[];
  getDownstream(): PluginNodeData[];
  applyOps(ops: Array<Record<string, any>>): void;
  emit(event: string, payload?: unknown): void;
  on(event: string, handler: (payload: unknown) => void): () => void;
  ai: PluginAi;
  openPanel(): void;
  closePanel(): void;
  storage: PluginStorage;
};

export type CanvasPluginNodeDefinition = {
  type: string;
  title: string;
  icon: React.ReactNode;
  description?: string;
  defaultSize: { width: number; height: number };
  defaultMetadata?: Record<string, unknown>;
  minimapColor?: string;
  showInCreateMenu?: boolean;
  hasSourceHandle?: boolean;
  hidePanel?: boolean;
  transparentBackground?: boolean;
  autoOpenPanel?: boolean;
  useBuiltinPanel?: {
    mode: 'image' | 'video' | 'text' | 'audio';
    promptPrefix?: string;
    writeBackToSelf?: boolean;
  };
  interactionToggle?: boolean;
  forceInteractive?: (node: PluginNodeData) => boolean;
  keepAspectRatio?: (node: PluginNodeData) => boolean;
  resource?: (node: PluginNodeData) => PluginNodeResource | null;
  Content?: React.ComponentType<{ ctx: PluginNodeContext }>;
  Panel?: React.ComponentType<{ ctx: PluginNodeContext; onClose: () => void }>;
  toolbar?: (ctx: PluginNodeContext) => Array<{
    id: string;
    title: string;
    label: string;
    icon: React.ReactNode;
    onClick(): void;
    active?: boolean;
    danger?: boolean;
  }>;
  onDoubleClick?: (ctx: PluginNodeContext) => boolean;
};

export type CanvasPlugin = {
  id: string;
  name: string;
  version: string;
  description?: string;
  updateUrl?: string;
  minAppVersion?: string;
  css?: string;
  nodes: CanvasPluginNodeDefinition[];
  setup?(app: CanvasPluginRuntime): void | (() => void);
};

export type CanvasPluginRuntime = {
  version: string;
  React: typeof React;
  jsx: typeof React.createElement;
  Fragment: typeof React.Fragment;
  emit(event: string, payload?: unknown): void;
  on(event: string, handler: (payload: unknown) => void): () => void;
  injectCSS(css: string, key?: string): () => void;
};

export type InstalledCanvasPlugin = {
  id: string;
  name: string;
  version: string;
  description?: string;
  /** 用户安装时填写的原始地址。GitHub 仓库链接更新时会从这里重新解析。 */
  url: string;
  /** 本次成功解析并下载插件源码的实际 JS 地址。 */
  resolvedUrl?: string;
  sourceKind?: 'url' | 'github';
  source: string;
  enabled: boolean;
  local?: boolean;
  official?: boolean;
  installedAt: string;
};
