import http from 'node:http';

function normalizePort(value, fallback = 8317) {
  const port = Number.parseInt(String(value ?? ''), 10);
  return Number.isInteger(port) && port > 0 && port <= 65535 ? port : fallback;
}

export function resolveListenTarget(environment = process.env) {
  const pipe = String(environment.AIFISHER_BACKEND_PIPE || '').trim();
  if (pipe) return { path: pipe };
  return {
    host: '127.0.0.1',
    port: normalizePort(environment.SERVER_PORT || environment.PORT),
  };
}

export function describeListenTarget(target) {
  if (target?.path) return target.path;
  return `${target?.host || '127.0.0.1'}:${target?.port || 8317}`;
}

function closeServer(server) {
  if (!server) return Promise.resolve();
  try {
    server.closeAllConnections?.();
  } catch {
    // Best-effort cleanup before close().
  }
  return new Promise((resolve) => {
    try {
      server.close(() => resolve());
    } catch {
      resolve();
    }
  });
}

async function settle(work) {
  try {
    await work?.();
  } catch (error) {
    console.error('[Runtime] shutdown cleanup failed:', error);
  }
}

export function createLocalRuntimeLifecycle({
  app,
  listen,
  workflowStore,
  codexService,
  canvasExternalService,
  stopOwnedComfy,
} = {}) {
  if (!app) throw new TypeError('app is required');

  const target = listen || resolveListenTarget();
  let server = null;
  let starting = null;
  let stopping = null;
  let ready = false;

  async function start() {
    if (ready && server?.listening) return true;
    if (starting) return starting;

    starting = (async () => {
      await workflowStore?.init?.();

      const created = http.createServer(app);
      server = created;
      await new Promise((resolve, reject) => {
        const onError = (error) => {
          created.off('listening', onListening);
          reject(error);
        };
        const onListening = () => {
          created.off('error', onError);
          resolve();
        };
        created.once('error', onError);
        created.once('listening', onListening);
        if (target.path) {
          created.listen(target.path);
        } else {
          created.listen({
            host: target.host || '127.0.0.1',
            port: target.port,
            exclusive: true,
          });
        }
      });
      ready = true;
      return true;
    })();

    try {
      return await starting;
    } catch (error) {
      ready = false;
      server = null;
      throw error;
    } finally {
      starting = null;
    }
  }

  async function stop() {
    if (stopping) return stopping;
    stopping = (async () => {
      ready = false;
      const current = server;
      server = null;
      await closeServer(current);
      await settle(() => canvasExternalService?.close?.());
      await settle(() => codexService?.close?.());
      await settle(() => stopOwnedComfy?.());
      await settle(() => workflowStore?.close?.());
    })();
    try {
      await stopping;
    } finally {
      stopping = null;
    }
  }

  return {
    start,
    stop,
    get ready() {
      return ready;
    },
    get server() {
      return server;
    },
    listen: target,
  };
}
