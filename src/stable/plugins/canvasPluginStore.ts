import type { InstalledCanvasPlugin } from './canvasPluginTypes';

const STORE_KEY = 'aifisher:canvas-plugin-store:v1';

function read(): InstalledCanvasPlugin[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter((item) => item?.id && item?.url) : [];
  } catch {
    return [];
  }
}

function write(records: InstalledCanvasPlugin[]) {
  localStorage.setItem(STORE_KEY, JSON.stringify(records));
  window.dispatchEvent(new CustomEvent('fisherai:canvas-plugin-store-changed'));
}

export const canvasPluginStore = {
  list: read,
  upsert(plugin: Omit<InstalledCanvasPlugin, 'installedAt'> & { installedAt?: string }) {
    const records = read();
    const next: InstalledCanvasPlugin = {
      ...plugin,
      installedAt: plugin.installedAt || new Date().toISOString(),
    };
    const index = records.findIndex((item) => item.id === next.id);
    if (index >= 0) records[index] = next;
    else records.unshift(next);
    write(records);
    return next;
  },
  setEnabled(id: string, enabled: boolean) {
    const records = read().map((item) => item.id === id ? { ...item, enabled } : item);
    write(records);
  },
  remove(id: string) {
    write(read().filter((item) => item.id !== id));
  },
};
