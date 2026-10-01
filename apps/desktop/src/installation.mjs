import os from 'node:os';
import path from 'node:path';

// A packaged install keeps everything beside the executable. A development run executes the
// repository sources and may borrow packaged defaults from an install, but never its data or
// update bridge.
export function resolveInstallation({ packaged, executablePath, sourceRoot, resourcesPath, environment = process.env }) {
  const localAppData = environment.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
  const legacyTauri = path.join(localAppData, 'AIFISHER', 'TauriPrototype');
  if (packaged) {
    const root = path.dirname(executablePath);
    const app = path.join(resourcesPath || path.join(root, 'resources'), 'app');
    const localRoot = path.join(localAppData, 'AIFISHER');
    return describe({
      packaged: true,
      root,
      app,
      code: app,
      data: path.join(localRoot, 'Data'),
      server: path.join(app, 'server', 'index.js'),
      dist: path.join(app, 'dist'),
      tools: path.join(app, 'scripts', 'release'),
      envTemplate: path.join(app, 'defaults', '.env.example'),
      packageManifest: path.join(app, 'package.json'),
      icon: path.join(app, 'desktop', 'assets', 'aifisher.ico'),
      updateBridge: path.join(app, 'scripts', 'release', 'AIFISHER.UpdateBridge.exe'),
      state: path.join(localRoot, 'Desktop'),
      legacyState: legacyTauri,
      devUserId: null,
    });
  }
  const repository = path.resolve(sourceRoot);
  const configured = environment.AIFISHER_DESKTOP_INSTALL_ROOT
    ? path.resolve(environment.AIFISHER_DESKTOP_INSTALL_ROOT)
    : null;
  const app = configured ? path.join(configured, 'app') : repository;
  const scratch = path.join(repository, '.desktop-dev');
  return describe({
    packaged: false,
    root: configured ?? repository,
    app,
    code: repository,
    data: path.resolve(environment.AIFISHER_DESKTOP_DATA_ROOT || path.join(scratch, 'data')),
    server: path.join(repository, 'server', 'index.js'),
    dist: path.join(repository, 'dist'),
    tools: path.join(repository, 'scripts', 'release'),
    envTemplate: configured
      ? path.join(app, 'defaults', '.env.example')
      : path.join(repository, '.env.example'),
    packageManifest: path.join(repository, 'package.json'),
    icon: path.join(repository, 'public', 'aifisher-app.ico'),
    updateBridge: null,
    state: path.resolve(environment.AIFISHER_DESKTOP_STATE_ROOT || path.join(scratch, 'state')),
    legacyState: environment.AIFISHER_DESKTOP_MIGRATE_TAURI === '1' ? legacyTauri : null,
    devUserId: environment.AIFISHER_DESKTOP_DEV_USER_ID || null,
  });
}

function describe(base) {
  return Object.freeze({
    ...base,
    logs: path.join(base.data, 'logs'),
    config: path.join(base.data, 'config'),
    envFile: path.join(base.data, 'config', '.env'),
    providerCredentialHelper: path.join(base.tools, 'providerCredentialBridge.ps1'),
  });
}

// The subset of runtimeControl's portable paths that its exported loaders read.
export function releasePaths(installation) {
  return {
    app: installation.app,
    packageManifest: installation.packageManifest,
  };
}
