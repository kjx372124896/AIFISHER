import fs from 'node:fs';
import path from 'node:path';

export function installBackendLifecycleDiagnostics({ logsDirectory } = {}) {
  const file = logsDirectory ? path.join(logsDirectory, 'backend.lifecycle.log') : null;

  function write(event, details = {}) {
    if (!file) return;
    try {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.appendFileSync(
        file,
        `${JSON.stringify({ at: new Date().toISOString(), event, pid: process.pid, ...details })}\n`,
        'utf8',
      );
    } catch {
      // Diagnostics must never prevent backend startup or shutdown.
    }
  }

  write('process-started');

  const onExit = (code) => write('process-exit', { code });
  process.once('exit', onExit);

  return {
    shutdownRequested(reason) {
      write('shutdown-requested', { reason: String(reason || '') });
    },
  };
}
