/**
 * nativePayloadCheck.mjs
 *
 * Windows 上第三方安全软件（腾讯电脑管家、360、火绒等）会在安装完成后静默隔离
 * 未签名的 DLL。缺的往往不是主程序 `AIFISHER.exe`，而是：
 *   - Electron 运行时 DLL（ffmpeg / vk_swiftshader / vulkan / dxcompiler / dxil）
 *     → 主进程还能起来，但渲染进程直接崩溃，用户看到的就是「双击没反应」；
 *   - sharp 的 libvips DLL（图片处理、缩略图、媒体后处理都依赖它）
 *     → 本机服务启动即退出。
 *
 * 这里在启动最前面做一次显式检查，把「打不开」变成一条能看懂、能照做的提示。
 */

import { access, readdir } from 'node:fs/promises';
import path from 'node:path';

/** 渲染进程强依赖的 Electron 运行时 DLL。 */
export const ELECTRON_RUNTIME_DLLS = Object.freeze([
  'ffmpeg.dll',
  'vk_swiftshader.dll',
  'vulkan-1.dll',
  'dxcompiler.dll',
  'dxil.dll',
]);

const SHARP_PACKAGE_DIR = path.join('node_modules', '@img', 'sharp-win32-x64');

async function canAccess(file, accessImpl) {
  try {
    await accessImpl(file);
    return true;
  } catch {
    return false;
  }
}

function sharpNativeState(entries) {
  const hasBinary = entries.some((name) => /^sharp-win32-x64-.*\.node$/i.test(name));
  const hasVips = entries.some((name) => /^libvips.*\.dll$/i.test(name));
  return { hasBinary, hasVips };
}

/**
 * 返回缺失的关键文件标签；空数组表示运行所需文件齐全。
 * `executablePath` / `resourcesPath` 由 Electron 注入，测试里可直接传临时目录。
 */
export async function findMissingNativePayload({
  executablePath,
  resourcesPath,
  accessImpl = access,
  readdirImpl = readdir,
  platform = process.platform,
}) {
  if (platform !== 'win32') return [];
  const missing = [];
  const executableDir = path.dirname(executablePath);
  for (const name of ELECTRON_RUNTIME_DLLS) {
    if (!(await canAccess(path.join(executableDir, name), accessImpl))) missing.push(name);
  }
  const sharpLibDir = path.join(resourcesPath, 'app', SHARP_PACKAGE_DIR, 'lib');
  let entries;
  try {
    entries = await readdirImpl(sharpLibDir);
  } catch {
    entries = [];
  }
  const sharp = sharpNativeState(entries);
  if (!sharp.hasBinary) missing.push('sharp-win32-x64-*.node');
  if (!sharp.hasVips) missing.push('libvips-*.dll');
  return missing;
}

/** 缺失文件的用户提示：说明原因、给出可执行的处理步骤。 */
export function missingNativePayloadMessage(missing, { installRoot } = {}) {
  const lines = [
    'AIFISHER 缺少运行所需的系统文件，无法启动。',
    '',
    '缺失文件：',
    ...missing.map((name) => `· ${name}`),
    '',
    '常见原因：安全软件（腾讯电脑管家、360、火绒等）在安装或更新时隔离了这些 DLL。',
    '处理办法：',
    `1. 把安装目录加入安全软件的信任区/白名单${installRoot ? `：${installRoot}` : ''}；`,
    '2. 重新运行安装包完成修复（或在安全软件的隔离区恢复上述文件）；',
    '3. 重新打开 AIFISHER。',
  ];
  return lines.join('\n');
}
