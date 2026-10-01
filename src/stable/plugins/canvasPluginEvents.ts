import type { PluginStorage } from './canvasPluginTypes';

const bus = new EventTarget();

export function emitCanvasPluginEvent(event: string, payload?: unknown) {
  bus.dispatchEvent(new CustomEvent(event, { detail: payload }));
}

export function onCanvasPluginEvent(event: string, handler: (payload: unknown) => void) {
  const listener = (value: Event) => handler((value as CustomEvent).detail);
  bus.addEventListener(event, listener);
  return () => bus.removeEventListener(event, listener);
}

function storageKey(pluginId: string, key: string) {
  return `aifisher:canvas-plugin-storage:${pluginId}:${key}`;
}

export function createCanvasPluginStorage(pluginId: string): PluginStorage {
  return {
    async get<T = unknown>(key: string) {
      const raw = localStorage.getItem(storageKey(pluginId, key));
      if (raw == null) return null;
      try { return JSON.parse(raw) as T; } catch { return raw as T; }
    },
    async set(key: string, value: unknown) {
      localStorage.setItem(storageKey(pluginId, key), JSON.stringify(value));
    },
    async remove(key: string) {
      localStorage.removeItem(storageKey(pluginId, key));
    },
  };
}
