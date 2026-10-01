import { spawn } from 'node:child_process';
import { watch } from 'node:fs';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const meta = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
if (process.platform !== 'win32' || process.versions.node !== meta.engines.node) {
  throw Error(`需要 Windows x64 和 Node ${meta.engines.node}`);
}

const baseEnv = { ...process.env };
for (const key of Object.keys(baseEnv)) {
  if (key.startsWith('AIFISHER_') || key === 'ELECTRON_RUN_AS_NODE' || key.startsWith('FISHERAI_')) delete baseEnv[key];
}
baseEnv.AIFISHER_DEV_SERVER_URL = 'http://127.0.0.1:5173';

const electronExe = path.join(root, 'apps/desktop/node_modules/electron/dist/electron.exe');
let electron = null;
let stopping = false;
let restartTimer = null;

function spawnProcess(file, args, extraEnv = {}) {
  return spawn(file, args, {
    cwd: root,
    env: { ...baseEnv, ...extraEnv },
    stdio: 'inherit',
    windowsHide: true,
  });
}

function run(file, args) {
  return new Promise((resolve, reject) => {
    const child = spawnProcess(file, args);
    child.once('error', reject);
    child.once('exit', (code) => (code === 0 ? resolve() : reject(Error(`命令失败：${code}`))));
  });
}

async function waitForVite() {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseEnv.AIFISHER_DEV_SERVER_URL);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw Error('Vite 开发服务器启动超时');
}

function startElectron() {
  if (stopping) return;
  electron = spawnProcess(electronExe, [path.join(root, 'apps/desktop')]);
  electron.once('exit', () => {
    electron = null;
    if (!stopping) console.log('[desktop:dev] Electron 已退出；等待文件变更后自动重启。');
  });
}

function restartElectron(reason) {
  clearTimeout(restartTimer);
  restartTimer = setTimeout(() => {
    if (stopping) return;
    console.log(`[desktop:dev] ${reason}，重启 Electron...`);
    const current = electron;
    if (!current) return startElectron();
    current.once('exit', startElectron);
    current.kill();
  }, 180);
}

await run(process.execPath, ['apps/desktop/node_modules/electron/install.js']);
for (const args of [['scripts/generate-app-icon.mjs'], ['scripts/build-model-catalog.mjs']]) {
  await run(process.execPath, args);
}
await mkdir(path.join(root, '.desktop-dev'), { recursive: true });

const vite = spawnProcess(process.execPath, [
  'node_modules/vite/bin/vite.js',
  '--config',
  'vite.stable.config.ts',
]);
await waitForVite();
startElectron();

const restartRoots = [path.join(root, 'apps', 'desktop', 'src'), path.join(root, 'server')];
const watchers = restartRoots.map((directory) =>
  watch(directory, { recursive: true }, (_event, filename) => {
    if (!filename || /(?:^|[\\/])(?:logs?|data|node_modules)(?:[\\/]|$)/i.test(filename)) return;
    restartElectron(`${path.relative(root, directory)}\\${filename}`);
  }),
);

const shutdown = () => {
  if (stopping) return;
  stopping = true;
  clearTimeout(restartTimer);
  for (const watcher of watchers) watcher.close();
  electron?.kill();
  vite.kill();
};
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
process.once('exit', shutdown);

await new Promise((resolve, reject) => {
  vite.once('error', reject);
  vite.once('exit', (code) => {
    if (!stopping && code !== 0) reject(Error(`Vite 已退出：${code}`));
    else resolve();
  });
});
