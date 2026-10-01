import * as React from 'react';
import { version } from '../../../package.json';
import { emitCanvasPluginEvent, onCanvasPluginEvent } from './canvasPluginEvents';
import type { CanvasPluginRuntime } from './canvasPluginTypes';

const styleElements = new Map<string, HTMLStyleElement>();

function injectCSS(css: string, key = crypto.randomUUID()) {
  const id = `aifisher-plugin-style:${key}`;
  styleElements.get(id)?.remove();
  const element = document.createElement('style');
  element.dataset.fisheraiPluginStyle = id;
  element.textContent = css;
  document.head.append(element);
  styleElements.set(id, element);
  return () => {
    if (styleElements.get(id) === element) styleElements.delete(id);
    element.remove();
  };
}

export function getCanvasPluginRuntime(): CanvasPluginRuntime {
  const runtime: CanvasPluginRuntime = {
    version,
    React,
    jsx: React.createElement,
    Fragment: React.Fragment,
    emit: emitCanvasPluginEvent,
    on: onCanvasPluginEvent,
    injectCSS,
  };
  (globalThis as typeof globalThis & { InfiniteCanvasRuntime?: CanvasPluginRuntime }).InfiniteCanvasRuntime = runtime;
  return runtime;
}

export function installCanvasPluginRuntime() {
  return getCanvasPluginRuntime();
}
