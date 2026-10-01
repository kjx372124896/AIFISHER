import { installNodeFramework } from '../nodes/nodeFramework';
import type { CanvasPluginNodeDefinition } from './canvasPluginTypes';

type RecordEntry = { pluginId: string; definition: CanvasPluginNodeDefinition };
const nodes = new Map<string, RecordEntry>();

export function registerCanvasPluginNodes(pluginId: string, definitions: CanvasPluginNodeDefinition[]) {
  const framework = installNodeFramework();
  for (const definition of definitions) {
    if (!definition?.type || !definition?.defaultSize) continue;
    nodes.set(definition.type, { pluginId, definition });
    framework.register({
      type: definition.type,
      category: 'tool',
      inputs: [{ id: 'inputs', media: ['any'], multiple: true }],
      outputs: [{ id: 'output', media: ['any'], multiple: true }],
      initialStatus: 'idle',
    });
  }
  window.dispatchEvent(new CustomEvent('fisherai:canvas-plugins-changed'));
}

export function unregisterCanvasPluginNodes(pluginId: string) {
  for (const [type, record] of nodes) {
    if (record.pluginId === pluginId) nodes.delete(type);
  }
  window.dispatchEvent(new CustomEvent('fisherai:canvas-plugins-changed'));
}

export function getCanvasPluginNodeDefinition(type: string) {
  return nodes.get(type)?.definition;
}

export function getCanvasPluginIdForNode(type: string) {
  return nodes.get(type)?.pluginId || type.split(':')[0] || 'plugin';
}

export function listCanvasPluginNodeDefinitions() {
  return [...nodes.values()].map(({ pluginId, definition }) => ({ pluginId, definition }));
}

export function isCanvasPluginNodeType(type: string) {
  return nodes.has(type);
}
