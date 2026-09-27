import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const manifest = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const requiredNode = String(manifest.engines?.node || '');

function assertRuntime() {
  if (process.platform !== 'win32' || process.arch !== 'x64') {
    throw new Error('AIFISHER 源码运行需要 Windows x64');
  }
  if (requiredNode && process.versions.node !== requiredNode) {
    throw new Error(`需要 Node ${requiredNode}，当前为 ${process.versions.node}`);
  }
}

function cleanEnvironment() {
  const env = { ...process.env };
  for (const key of Object.keys(env)) {
    if (key === 'ELECTRON_RUN_AS_NODE' || key.startsWith('FISHERAI_')) delete env[key];
  }
  return env;
}

function run(file, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(file, args, {
      cwd: root,
      env: cleanEnvironment(),
      stdio: 'inherit',
      windowsHide: true,
    });
    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`命令失败：${code ?? signal ?? 'unknown'}`));
    });
  });
}

assertRuntime();

const [command, ...args] = process.argv.slice(2);

if (command === '--check') {
  await Promise.all([import('sharp'), import('sqlite3')]);
  console.log(`AIFISHER runtime ready: Node ${process.versions.node} / ${process.platform} ${process.arch}`);
} else if (command === '--npm') {
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  await run(npm, args);
} else if (command) {
  const target = path.isAbsolute(command) ? command : path.resolve(root, command);
  await run(process.execPath, [target, ...args]);
} else {
  console.log(process.execPath);
}
