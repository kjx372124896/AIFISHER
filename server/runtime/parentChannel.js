export function createParentChannel({ port = process.parentPort } = {}) {
  const stopListeners = new Set();

  function onMessage(message) {
    if (message?.type !== 'stop') return;
    for (const listener of [...stopListeners]) {
      try {
        listener();
      } catch (error) {
        console.error('[ParentChannel] stop listener failed:', error);
      }
    }
  }

  port?.on?.('message', onMessage);

  function notifyReady() {
    port?.postMessage?.({ type: 'ready' });
  }

  function onStop(listener) {
    if (typeof listener !== 'function') throw new TypeError('listener must be a function');
    stopListeners.add(listener);
    return () => stopListeners.delete(listener);
  }

  function close() {
    port?.off?.('message', onMessage);
    stopListeners.clear();
  }

  return { notifyReady, onStop, close };
}
