import crypto from 'node:crypto';

export function createParentChannel({ port = process.parentPort, timeoutMs = 15_000 } = {}) {
  const stopListeners = new Set();
  const tokenRequests = new Map();

  function onMessage(message) {
    if (message?.type === 'stop') {
      for (const listener of [...stopListeners]) {
        try {
          listener();
        } catch (error) {
          console.error('[ParentChannel] stop listener failed:', error);
        }
      }
      return;
    }

    if (message?.type === 'access-token') {
      const pending = tokenRequests.get(message.id);
      if (!pending) return;
      tokenRequests.delete(message.id);
      clearTimeout(pending.timer);
      pending.resolve(message.token ?? null);
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

  function requestAccessToken() {
    if (!port?.postMessage) return Promise.resolve(null);
    const id = crypto.randomUUID();
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        tokenRequests.delete(id);
        resolve(null);
      }, timeoutMs);
      timer.unref?.();
      tokenRequests.set(id, { resolve, timer });
      try {
        port.postMessage({ type: 'access-token-request', id });
      } catch {
        clearTimeout(timer);
        tokenRequests.delete(id);
        resolve(null);
      }
    });
  }

  function close() {
    port?.off?.('message', onMessage);
    stopListeners.clear();
    for (const pending of tokenRequests.values()) {
      clearTimeout(pending.timer);
      pending.resolve(null);
    }
    tokenRequests.clear();
  }

  return { notifyReady, onStop, requestAccessToken, close };
}
