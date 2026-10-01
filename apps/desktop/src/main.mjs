// ADR-0035: one Electron main process owns the window, the tray, identity, the backend and updates.
import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  Menu,
  nativeTheme,
  protocol,
  shell,
  Tray,
  utilityProcess,
  WebContentsView,
} from 'electron';
import { spawn } from 'node:child_process';
import { access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { APP_SCHEME, APP_SCHEME_PRIVILEGES, createAppProtocolHandler } from './appProtocol.mjs';
import { createBackendEnvironment, loadReleaseHelpers } from './backendEnvironment.mjs';
import { createBackendSupervisor } from './backendSupervisor.mjs';
import { releasePaths, resolveInstallation } from './installation.mjs';
import { createTray } from './tray.mjs';
import {
  CANVAS_URL,
  createMainWindow,
  isAppUrl,
  isExternalUrl,
} from './windowManager.mjs';
import { resolveLocalWorkspaceId } from './localWorkspace.mjs';
import { confirmUpdateStartup } from './updates/startupConfirmation.mjs';
import { createUpdateCoordinator } from './updates/updateCoordinator.mjs';
import { activateUpdateWindow, shouldDeferLaunch } from './updates/updateLaunchGuard.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const installation = resolveInstallation({
  packaged: app.isPackaged,
  executablePath: process.execPath,
  resourcesPath: process.resourcesPath,
  sourceRoot: path.resolve(here, '..', '..', '..'),
});
const BACKEND_RETRY_DELAY_MS = 30_000;
const OPEN_FAILED = '本机服务未能启动，请重试。你的项目仍保存在本机。';

// Chromium's cache and storage stay with the rest of AIFISHER's local state instead of Roaming.
// The single-instance lock below is keyed on this folder, so it must be set first.
app.setPath('userData', path.join(installation.state, 'chromium'));
protocol.registerSchemesAsPrivileged([{ scheme: APP_SCHEME, privileges: APP_SCHEME_PRIVILEGES }]);
// A manual launch while an update swaps files only brings the update window forward. The check runs
// before the single-instance lock so that the new version started by the update helper keeps it.
const deferredForUpdate = installation.packaged && shouldDeferLaunch({ environment: process.env });
const primaryInstance = !deferredForUpdate && app.requestSingleInstanceLock();
// Stop, upgrade and uninstall scripts start a second copy with --quit to close the running one
// gracefully; closing the window only hides it to the tray.
const quitRequested = process.argv.includes('--quit');

let helpers = null;
let mainWindow = null;
let tray = null;
let appContents = null;
let localWorkspaceId = null;
let backend = null;
let updates = null;
let productVersion = app.getVersion();
let quitting = false;
let canvasOpen = false;
let backendRetryTimer = null;
let updateHandoff = null;

function broadcast(channel, payload) {
  if (appContents && !appContents.isDestroyed()) appContents.send(channel, payload);
}

function showWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
  appContents?.focus();
}

function senderPath(event) {
  const url = event.senderFrame?.url ?? '';
  if (!isAppUrl(url)) throw new Error('UNTRUSTED_SENDER');
  return new URL(url).pathname;
}

function handle(channel, work) {
  ipcMain.handle(channel, (event, ...args) => {
    senderPath(event);
    return work(...args);
  });
}

function backendView() {
  return backend?.state() === 'ready' ? 'ready' : 'reconnecting';
}

function keepCanvasAlive(active) {
  clearTimeout(backendRetryTimer);
  backendRetryTimer = null;
}

function onBackendState(state) {
  broadcast('backend:state', backendView());
  if (state !== 'failed' || !canvasOpen) return;
  // The supervisor gave up after repeated crashes. The page and its unsaved edits stay put behind
  // the reconnect notice while the backend is retried slowly.
  clearTimeout(backendRetryTimer);
  backendRetryTimer = setTimeout(() => {
    const userId = backend.userId();
    if (canvasOpen && userId) void backend.start(userId).catch(() => {});
  }, BACKEND_RETRY_DELAY_MS);
}

async function openCanvas() {
  const userId = localWorkspaceId;
  if (!userId) return { opened: false, message: '本机工作区尚未就绪，请重试。' };
  try {
    await backend.start(userId);
  } catch {
    return { opened: false, message: OPEN_FAILED };
  }
  canvasOpen = true;  keepCanvasAlive(true);
  // The canvas loads after the backend is ready, so its preferences hydrate on first paint.
  await appContents.loadURL(CANVAS_URL);
  mainWindow.setTitle('AIFISHER 画布');
  return { opened: true, message: '画布已打开。' };
}

// The page saves its edits before asking. The helper waits only about 2 s for this process, so the
// backend stops before the handoff and the app quits the moment the bridge reports "applying".
function applyUpdate() {
  updateHandoff ??= updates
    .apply({
      beforeHandoff: async () => {
        keepCanvasAlive(false);
        await backend.stop();
        return true;
      },
      afterFailedHandoff: async () => {
        const userId = backend.userId();
        if (!canvasOpen || !userId) return;
        await backend.start(userId);
        keepCanvasAlive(true);
      },
    })
    .then(
      (event) => {
        quitting = true;
        app.exit(0);
        return event;
      },
      (error) => {
        updateHandoff = null;
        throw error;
      },
    );
  return updateHandoff;
}

function registerIpc() {
  ipcMain.on('desktop:version', (event) => {
    event.returnValue = productVersion;
  });
  handle('shell:info', () => ({
    version: app.getVersion(),
    productVersion,
    platform: 'windows',
    architecture: process.arch,
  }));
  handle('shell:open-external', (url) =>
    isExternalUrl(url) ? shell.openExternal(url) : undefined,
  );
  handle('update:status', () => updates.status());
  handle('update:prepare', () => updates.prepare());
  handle('update:check', () => updates.prepare({ force: true }));
  handle('update:source', () => updates.source());
  handle('update:select-local-source', async () => {
    const selected = await dialog.showOpenDialog(mainWindow, {
      title: '选择本机更新测试目录', properties: ['openDirectory'],
    });
    if (selected.canceled) return updates.source();
    return updates.setSource(selected.filePaths[0]);
  });
  handle('update:reset-source', () => updates.setSource(null));
  handle('update:apply', () => applyUpdate());
  handle('backend:current-state', () => backendView());
  handle('desktop:show-item-in-folder', (target) => shell.showItemInFolder(target));
}

async function start() {
  helpers = await loadReleaseHelpers(installation.tools);
  productVersion = await Promise.resolve()
    .then(() => helpers.loadProductVersion(releasePaths(installation)))
    .catch(() => app.getVersion());
  if (installation.packaged && !process.env.AIFISHER_UPDATE_STARTUP_TRANSACTION) {
    const manualStartup = path.join(installation.tools, 'manualStartup.mjs');
    try {
      await access(manualStartup);
      const { resumeManualStartup } = await import(pathToFileURL(manualStartup).href);
      await resumeManualStartup({ targetRoot: installation.root, productVersion });
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
  }
  localWorkspaceId = await resolveLocalWorkspaceId({ dataDirectory: installation.data, preferredId: installation.devUserId });
  backend = createBackendSupervisor({
    fork: (...args) => utilityProcess.fork(...args),
    entry: installation.server,
    cwd: installation.code,
    logsDirectory: installation.logs,
    createEnvironment: ({ userId, pipe }) =>
      createBackendEnvironment({ installation, userId, pipe, helpers }),
  });
  backend.onState(onBackendState);
  updates = createUpdateCoordinator({
    bridgePath: installation.updateBridge,
    installRoot: installation.packaged ? installation.root : null,
    ownerPid: process.pid,
    spawnImpl: spawn,
    sourceSettingsPath: path.join(installation.config, 'local-update-source.json'),
  });
  updates.onProgress((event) => broadcast('update:progress', event));
  protocol.handle(
    APP_SCHEME,
    createAppProtocolHandler({
      backend,
      distDirectory: installation.dist,
      devServerUrl: process.env.AIFISHER_DEV_SERVER_URL || null,
    }),
  );
  registerIpc();

  // Start dark; the canvas applies its locally stored theme after hydration.
  nativeTheme.themeSource = 'dark';
  ({ window: mainWindow, contents: appContents } = createMainWindow({
    BrowserWindow,
    WebContentsView,
    shell,
    ipcMain,
    nativeTheme,
    preload: path.join(here, 'preload.cjs'),
    icon: installation.icon,
  }));
  mainWindow.on('close', (event) => {
    if (quitting) return;
    // Closing hides to the tray; the canvas, its unsaved edits and the backend stay alive.
    event.preventDefault();
    mainWindow.hide();
  });
  tray = createTray({
    Tray,
    Menu,
    icon: installation.icon,
    onShow: showWindow,
    onQuit: () => app.quit(),
  });
  appContents.once('did-finish-load', () => {
    // The update helper rolls back unless the new version confirms within 15 s of launch.
    void confirmUpdateStartup({
      environment: process.env,
      productVersion,
      processId: process.pid,
      installRoot: installation.root,
    });
  });
  const opened = await openCanvas();
  if (!opened.opened) throw new Error(opened.message || OPEN_FAILED);
}

if (deferredForUpdate) {
  void activateUpdateWindow({ spawnImpl: spawn }).finally(() => app.exit(0));
} else if (!primaryInstance || quitRequested) {
  app.exit(0);
} else {
  app.on('second-instance', (_event, argv) => {
    if (argv.includes('--quit')) app.quit();
    else showWindow();
  });
  app.on('will-quit', () => {
    tray?.destroy();
    tray = null;
  });
  app.on('before-quit', (event) => {
    quitting = true;
    if (!backend || backend.state() === 'stopped') return;
    event.preventDefault();
    keepCanvasAlive(false);
    void backend.stop().finally(() => app.quit());
  });
  app
    .whenReady()
    .then(start)
    .catch((error) => {
      console.error('AIFISHER 启动失败', error);
      app.exit(1);
    });
}
