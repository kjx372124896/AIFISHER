import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const manifest = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const requiredNode = String(manifest.engines?.node || '');

if (process.platform !== 'win32' || process.arch !== 'x64') {
  throw new Error('AIFISHER 源码运行需要 Windows x64');
}
if (requiredNode && process.versions.node !== requiredNode) {
  throw new Error(`需要 Node ${requiredNode}，当前为 ${process.versions.node}`);
}

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
await new Promise((resolve, reject) => {
  const child = spawn(npm, ['ci'], { cwd: root, stdio: 'inherit', windowsHide: true });
  child.once('error', reject);
  child.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`npm ci 失败：${code}`)));
});
console.log('AIFISHER runtime setup complete.');
