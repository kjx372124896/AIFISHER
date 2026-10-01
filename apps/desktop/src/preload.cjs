const { contextBridge, ipcRenderer, webUtils } = require('electron');

const invoke = (channel, ...args) => ipcRenderer.invoke(channel, ...args);
const subscribe = (channel) => (listener) => {
  const handler = (_event, payload) => listener(payload);
  ipcRenderer.on(channel, handler);
  return () => ipcRenderer.removeListener(channel, handler);
};

function subscribeBackendState(listener) {
  let live = false;
  let active = true;
  const unsubscribe = subscribe('backend:state')((state) => {
    live = true;
    listener(state);
  });
  invoke('backend:current-state').then(
    (state) => {
      if (active && !live) listener(state);
    },
    () => {},
  );
  return () => {
    active = false;
    unsubscribe();
  };
}

const update = Object.freeze({
  status: () => invoke('update:status'),
  prepare: () => invoke('update:prepare'),
  check: () => invoke('update:check'),
  source: () => invoke('update:source'),
  selectLocalSource: () => invoke('update:select-local-source'),
  resetSource: () => invoke('update:reset-source'),
  apply: () => invoke('update:apply'),
  onProgress: subscribe('update:progress'),
});

contextBridge.exposeInMainWorld('aifisherDesktop', {
  version: ipcRenderer.sendSync('desktop:version'),
  integratedTitleBar: true,
  update,
  setTheme: (theme) => {
    if (theme !== 'dark' && theme !== 'light') return Promise.reject(new Error('INVALID_THEME'));
    return invoke('desktop:set-theme', theme);
  },
  showItemInFolder: (target) => invoke('desktop:show-item-in-folder', String(target)),
  pathForFile: (file) => {
    try {
      return webUtils.getPathForFile(file) || '';
    } catch {
      return '';
    }
  },
  onBackendState: subscribeBackendState,
});

contextBridge.exposeInMainWorld('aifisherShell', {
  info: () => invoke('shell:info'),
  update,
  openExternal: (url) => invoke('shell:open-external', String(url)),
});
