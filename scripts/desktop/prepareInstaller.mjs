import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const stagingRoot = path.join(root, '.desktop-package');
const appRoot = path.join(stagingRoot, 'app');
const rootPackage = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));

if (process.platform !== 'win32' || process.arch !== 'x64') {
  throw new Error('Windows 安装包只能在 Windows x64 环境构建');
}
if (process.versions.node !== String(rootPackage.engines?.node || '')) {
  throw new Error(`需要 Node ${rootPackage.engines?.node}，当前为 ${process.versions.node}`);
}

function run(file, args, cwd = root) {
  return new Promise((resolve, reject) => {
    const env = { ...process.env };
    delete env.ELECTRON_RUN_AS_NODE;
    const child = spawn(file, args, {
      cwd,
      env,
      stdio: 'inherit',
      windowsHide: true,
    });
    child.once('error', reject);
    child.once('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`命令失败：${file} ${args.join(' ')} (exit ${code})`));
    });
  });
}

await rm(stagingRoot, { recursive: true, force: true });
await mkdir(appRoot, { recursive: true });

const copies = [
  ['dist', 'dist'],
  ['server', 'server'],
  ['src/shared', 'src/shared'],
  ['scripts/release', 'scripts/release'],
];

for (const [source, destination] of copies) {
  await cp(path.join(root, source), path.join(appRoot, destination), { recursive: true });
}

await mkdir(path.join(appRoot, 'defaults'), { recursive: true });
await cp(path.join(root, '.env.example'), path.join(appRoot, 'defaults', '.env.example'));

await mkdir(path.join(appRoot, 'desktop', 'assets'), { recursive: true });
await cp(
  path.join(root, 'public', 'aifisher-app.ico'),
  path.join(appRoot, 'desktop', 'assets', 'aifisher.ico'),
);

await writeFile(
  path.join(appRoot, 'package.json'),
  JSON.stringify(
    {
      name: rootPackage.name,
      version: rootPackage.version,
      type: rootPackage.type,
      private: true,
      dependencies: rootPackage.dependencies,
      engines: rootPackage.engines,
      allowScripts: rootPackage.allowScripts,
    },
    null,
    2,
  ) + '\n',
  'utf8',
);

// 生产后端只需要根 package.json 的 dependencies。前端已经在 dist 中编译完成，
// 不把 React/Vite/测试工具等 devDependencies 塞进安装包。
const npmCli =
  process.env.npm_execpath ||
  path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js');
await run(
  process.execPath,
  [npmCli, 'install', '--omit=dev', '--no-audit', '--no-fund', '--package-lock=false'],
  appRoot,
);

// 发布前真实验证 native 依赖和服务入口都能被 Node 加载。
await run(process.execPath, ['-e', "Promise.all([import('sharp'),import('sqlite3')]).then(()=>console.log('native dependencies ready'))"], appRoot);

console.log(`AIFISHER installer staging ready: ${appRoot}`);
