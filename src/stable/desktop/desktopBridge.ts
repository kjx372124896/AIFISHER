import type { DesktopUpdateEvent } from '../../update/desktopUpdateModel';

/** Exposed by the Electron preload; absent when the canvas runs in a plain browser. */
export interface AifisherDesktopBridge {
  readonly version: string;
  readonly integratedTitleBar?: boolean;
  /** Optional for older desktop shells; only affects native chrome, not stored preferences. */
  setTheme?(theme: 'dark' | 'light'): Promise<void>;
  update: {
    status(): Promise<DesktopUpdateEvent>;
    prepare(): Promise<DesktopUpdateEvent>;
    check?(): Promise<DesktopUpdateEvent>;
    source?(): Promise<{ directory: string | null; enabled: boolean; provider?: 'github' | 'local' }>;
    selectLocalSource?(): Promise<{ directory: string | null; enabled: boolean; provider?: 'github' | 'local' }>;
    resetSource?(): Promise<{ directory: string | null; enabled: boolean; provider?: 'github' | 'local' }>;
    apply(): Promise<DesktopUpdateEvent>;
    onProgress(listener: (event: DesktopUpdateEvent) => void): () => void;
  };
  showItemInFolder(path: string): Promise<void>;
  pathForFile(file: File): string;
  onBackendState(listener: (state: 'ready' | 'reconnecting') => void): () => void;
}

declare global {
  interface Window {
    aifisherDesktop?: AifisherDesktopBridge;
  }
}

export function desktopBridge(windowObject: Window | null = window): AifisherDesktopBridge | null {
  return windowObject?.aifisherDesktop ?? null;
}
