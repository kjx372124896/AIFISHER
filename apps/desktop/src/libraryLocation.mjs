import fs from 'node:fs/promises';
import path from 'node:path';

const FILE_NAME = 'library-location.json';

export function libraryLocationSettingsPath(installation) {
  return path.join(installation.config, FILE_NAME);
}

export function defaultLibraryDirectory(installation, userId) {
  return path.join(installation.data, 'users', userId, 'library');
}

export async function readLibraryLocation(installation, userId) {
  const fallback = defaultLibraryDirectory(installation, userId);
  try {
    const raw = JSON.parse(await fs.readFile(libraryLocationSettingsPath(installation), 'utf8'));
    const candidate = typeof raw?.directory === 'string' ? raw.directory.trim() : '';
    if (!candidate || !path.isAbsolute(candidate)) return { directory: fallback, custom: false, defaultDirectory: fallback };
    return { directory: path.resolve(candidate), custom: true, defaultDirectory: fallback };
  } catch (error) {
    if (error?.code !== 'ENOENT') console.warn('[LibraryLocation] 配置读取失败：', error?.message || error);
    return { directory: fallback, custom: false, defaultDirectory: fallback };
  }
}

export async function writeLibraryLocation(installation, directory) {
  await fs.mkdir(installation.config, { recursive: true });
  const file = libraryLocationSettingsPath(installation);
  if (directory === null) {
    await fs.rm(file, { force: true });
    return;
  }
  const resolved = path.resolve(directory);
  const stat = await fs.stat(resolved).catch(() => null);
  if (stat && !stat.isDirectory()) throw new Error('选择的位置不是文件夹。');
  if (!stat) await fs.mkdir(resolved, { recursive: true });
  const temp = `${file}.${process.pid}.tmp`;
  await fs.writeFile(temp, JSON.stringify({ schemaVersion: 1, directory: resolved }, null, 2), 'utf8');
  await fs.rename(temp, file);
}

export async function migrateLibrary(source, target) {
  const from = path.resolve(source);
  const to = path.resolve(target);
  if (from === to) return;
  const relativeTarget = path.relative(from, to);
  if (relativeTarget && !relativeTarget.startsWith('..') && !path.isAbsolute(relativeTarget)) {
    throw new Error('新资产库目录不能位于当前资产库目录内部。');
  }
  const sourceStat = await fs.stat(from).catch(() => null);
  if (!sourceStat?.isDirectory()) {
    await fs.mkdir(to, { recursive: true });
    return;
  }
  await fs.mkdir(to, { recursive: true });
  await fs.cp(from, to, { recursive: true, force: false, errorOnExist: false });
}
