import { describe, expect, it } from 'vitest';
import {
  ELECTRON_RUNTIME_DLLS,
  findMissingNativePayload,
  missingNativePayloadMessage,
} from '../apps/desktop/src/nativePayloadCheck.mjs';

const executablePath = 'C:\\AIFISHER\\AIFISHER.exe';
const resourcesPath = 'C:\\AIFISHER\\resources';
const sharpLibDir = 'C:\\AIFISHER\\resources\\app\\node_modules\\@img\\sharp-win32-x64\\lib';

function fakeFs({ present = [], sharpEntries = [] } = {}) {
  const normalized = new Set(present.map((item) => item.toLowerCase()));
  return {
    accessImpl: async (file) => {
      if (!normalized.has(String(file).toLowerCase())) throw new Error(`ENOENT ${file}`);
    },
    readdirImpl: async (dir) => {
      if (String(dir) !== sharpLibDir) throw new Error(`ENOENT ${dir}`);
      return sharpEntries;
    },
  };
}

const sharpEntries = [
  'sharp-win32-x64-0.35.5.node',
  'libvips-42.dll',
  'libvips-cpp-8.18.7.dll',
];

describe('native payload preflight', () => {
  it('passes when the Electron runtime and sharp binaries are present', async () => {
    const fs = fakeFs({
      present: ELECTRON_RUNTIME_DLLS.map((name) => `C:\\AIFISHER\\${name}`),
      sharpEntries,
    });
    await expect(
      findMissingNativePayload({ executablePath, resourcesPath, platform: 'win32', ...fs }),
    ).resolves.toEqual([]);
  });

  it('reports every quarantined Electron runtime dll', async () => {
    const fs = fakeFs({
      present: ['C:\\AIFISHER\\ffmpeg.dll', 'C:\\AIFISHER\\dxil.dll'],
      sharpEntries,
    });
    const missing = await findMissingNativePayload({
      executablePath,
      resourcesPath,
      platform: 'win32',
      ...fs,
    });
    expect(missing).toEqual(['vk_swiftshader.dll', 'vulkan-1.dll', 'dxcompiler.dll']);
  });

  it('requires both the sharp binary and a libvips dll', async () => {
    const onlyBinary = await findMissingNativePayload({
      executablePath,
      resourcesPath,
      platform: 'win32',
      ...fakeFs({
        present: ELECTRON_RUNTIME_DLLS.map((name) => `C:\\AIFISHER\\${name}`),
        sharpEntries: ['sharp-win32-x64-0.35.5.node'],
      }),
    });
    expect(onlyBinary).toEqual(['libvips-*.dll']);

    const onlyVips = await findMissingNativePayload({
      executablePath,
      resourcesPath,
      platform: 'win32',
      ...fakeFs({
        present: ELECTRON_RUNTIME_DLLS.map((name) => `C:\\AIFISHER\\${name}`),
        sharpEntries: ['libvips-42.dll'],
      }),
    });
    expect(onlyVips).toEqual(['sharp-win32-x64-*.node']);

    const noSharpDir = await findMissingNativePayload({
      executablePath,
      resourcesPath,
      platform: 'win32',
      accessImpl: async () => {},
      readdirImpl: async () => {
        throw new Error('ENOENT');
      },
    });
    expect(noSharpDir).toEqual(['sharp-win32-x64-*.node', 'libvips-*.dll']);
  });

  it('stays out of the way on other platforms', async () => {
    await expect(
      findMissingNativePayload({
        executablePath: '/opt/aifisher/aifisher',
        resourcesPath: '/opt/aifisher/resources',
        platform: 'linux',
        accessImpl: async () => {
          throw new Error('ENOENT');
        },
        readdirImpl: async () => [],
      }),
    ).resolves.toEqual([]);
  });
});

describe('native payload message', () => {
  it('names the missing files and explains the security-software cause', () => {
    const message = missingNativePayloadMessage(['ffmpeg.dll', 'libvips-*.dll'], {
      installRoot: 'D:\\AIFISHER',
    });
    expect(message).toContain('ffmpeg.dll');
    expect(message).toContain('libvips-*.dll');
    expect(message).toContain('信任区');
    expect(message).toContain('D:\\AIFISHER');
    expect(message).toContain('重新运行安装包');
  });
});
