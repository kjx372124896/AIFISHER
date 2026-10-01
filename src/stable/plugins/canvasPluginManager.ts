import { canvasPluginStore } from './canvasPluginStore';
import {
  installCanvasPluginFromUrl,
  setCanvasPluginEnabled,
  uninstallCanvasPlugin,
  updateCanvasPlugin,
} from './canvasPluginLoader';

function button(label: string, primary = false) {
  const el = document.createElement('button');
  el.type = 'button';
  el.textContent = label;
  el.className = primary ? 'fisherai-button is-primary' : 'fisherai-button';
  return el;
}
function text(tag: string, value: string, className = '') {
  const el = document.createElement(tag);
  el.textContent = value;
  el.className = className;
  return el;
}
function input(placeholder: string) {
  const el = document.createElement('input');
  el.placeholder = placeholder;
  el.className =
    'w-full rounded-md border border-[var(--af-border)] bg-[var(--af-input)] px-3 py-2 text-sm text-[var(--af-text)]';
  return el;
}

export function mountCanvasPluginManager(host: HTMLElement) {
  const root = document.createElement('section');
  root.className =
    'space-y-5 rounded-lg border border-[var(--af-border)] bg-[var(--af-surface)] p-6';
  const title = text('h3', '画布插件', 'text-xl font-bold text-[var(--af-text)]');
  const intro = text(
    'p',
    '兼容 Infinite Canvas 画布插件格式。插件代码会直接运行在画布页面中，请只安装可信来源。',
    'text-sm text-[var(--af-text-muted)]',
  );
  const installRow = document.createElement('div');
  installRow.className = 'flex gap-2';
  const url = input('粘贴插件 JS URL，例如 https://.../plugin.js');
  const install = button('安装插件', true);
  const status = text('div', '', 'text-xs text-[var(--af-text-muted)]');
  installRow.append(url, install);
  const list = document.createElement('div');
  list.className = 'space-y-3';
  root.append(title, intro, installRow, status, list);
  host.prepend(root);

  let disposed = false;
  const render = () => {
    if (disposed) return;
    list.replaceChildren();
    const records = canvasPluginStore.list();
    if (!records.length) {
      list.append(
        text(
          'div',
          '还没有安装插件。Infinite Canvas 本地插件如果存在于 /plugins/index.json，也会自动出现在这里。',
          'rounded-md border border-dashed border-[var(--af-border)] p-6 text-center text-sm text-[var(--af-text-muted)]',
        ),
      );
      return;
    }
    for (const record of records) {
      const card = document.createElement('div');
      card.className =
        'flex items-center gap-3 rounded-lg border border-[var(--af-border)] bg-[var(--af-surface-raised)] p-4';
      const info = document.createElement('div');
      info.className = 'min-w-0 flex-1';
      info.append(
        text('div', `${record.name} · v${record.version}`, 'font-medium text-[var(--af-text)]'),
        text(
          'div',
          record.description || record.url,
          'mt-1 truncate text-xs text-[var(--af-text-muted)]',
        ),
      );
      const toggle = button(record.enabled ? '停用' : '启用');
      const update = button('更新');
      const remove = button('卸载');
      toggle.addEventListener('click', async () => {
        toggle.disabled = true;
        try {
          await setCanvasPluginEnabled(record, !record.enabled);
          status.textContent = !record.enabled ? '插件已启用' : '插件已停用';
          render();
        } catch (error) {
          status.textContent = error instanceof Error ? error.message : '操作失败';
          toggle.disabled = false;
        }
      });
      update.addEventListener('click', async () => {
        update.disabled = true;
        try {
          await updateCanvasPlugin(record);
          status.textContent = '插件已更新';
          render();
        } catch (error) {
          status.textContent = error instanceof Error ? error.message : '更新失败';
          update.disabled = false;
        }
      });
      remove.addEventListener('click', () => {
        if (!confirm(`卸载插件“${record.name}”？插件私有存储会保留。`)) return;
        uninstallCanvasPlugin(record.id);
        status.textContent = '插件已卸载';
        render();
      });
      card.append(info, toggle, update, remove);
      list.append(card);
    }
  };

  install.addEventListener('click', async () => {
    const value = url.value.trim();
    if (!value) {
      status.textContent = '请输入插件 JS URL';
      return;
    }
    install.disabled = true;
    status.textContent = '正在安装…';
    try {
      const { plugin } = await installCanvasPluginFromUrl(value, { bustCache: true });
      status.textContent = `已安装：${plugin.name || plugin.id}`;
      url.value = '';
      render();
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : '安装失败';
    } finally {
      install.disabled = false;
    }
  });

  const refresh = () => render();
  window.addEventListener('fisherai:canvas-plugin-store-changed', refresh);
  render();
  return () => {
    disposed = true;
    window.removeEventListener('fisherai:canvas-plugin-store-changed', refresh);
    root.remove();
  };
}
