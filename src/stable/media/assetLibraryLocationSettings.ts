import { createStableTextElement as element } from '../design/dom';
import { desktopBridge } from '../desktop/desktopBridge';

function action(label: string) {
  const button = element(
    'button',
    label,
    'px-3 py-2 rounded-lg border border-[var(--af-border-control)] text-sm text-[var(--af-text)] hover:bg-[var(--af-surface-raised)] disabled:opacity-50',
  ) as HTMLButtonElement;
  button.type = 'button';
  return button;
}

export function mountAssetLibraryLocationSettings(host: HTMLElement) {
  const bridge = desktopBridge();
  const library = bridge?.library;
  if (!library) return () => {};

  const card = element(
    'section',
    '',
    'p-8 bg-[var(--af-surface-raised)] border border-[var(--af-border)] rounded-lg space-y-6 mb-6',
  );
  const heading = element('div');
  heading.append(
    element('h3', '资产库目录', 'text-xl font-bold text-[var(--af-text)] mb-2'),
    element(
      'p',
      '设置画布资产库的实际落盘位置。切换目录后，本地服务会自动重启以使用新位置。',
      'text-sm text-[var(--af-text-secondary)]',
    ),
  );

  const pathBlock = element(
    'div',
    '',
    'rounded-lg border border-[var(--af-border)] bg-[var(--af-surface)] p-4',
  );
  pathBlock.append(element('p', '当前资产库目录', 'text-xs font-medium text-[var(--af-text-secondary)]'));
  const pathValue = element('p', '正在读取…', 'mt-2 break-all font-mono text-sm text-[var(--af-text)]');
  pathBlock.append(pathValue);

  const defaultValue = element('p', '', 'mt-2 break-all text-xs text-[var(--af-text-muted)]');
  pathBlock.append(defaultValue);

  const actions = element('div', '', 'flex flex-wrap gap-2');
  const choose = action('选择资产库目录');
  const open = action('打开目录');
  const reset = action('恢复默认目录');
  actions.append(choose, open, reset);

  const note = element(
    'p',
    '切换时可选择“迁移并切换”自动复制现有资产，也可以只切换到一个已经准备好的资产库目录。',
    'text-xs leading-5 text-[var(--af-text-muted)]',
  );
  const message = element('p', '', 'min-h-5 text-xs text-[var(--af-text-secondary)]');
  message.setAttribute('aria-live', 'polite');

  card.append(heading, pathBlock, actions, note, message);
  host.append(card);

  let disposed = false;
  let busy = false;
  let current: { directory: string; defaultDirectory: string; custom: boolean; changed?: boolean } | null = null;

  const setBusy = (value: boolean) => {
    busy = value;
    choose.disabled = value;
    open.disabled = value;
    reset.disabled = value || !current?.custom;
  };

  const render = (value: typeof current) => {
    if (!value || disposed) return;
    current = value;
    pathValue.textContent = value.directory;
    defaultValue.textContent = value.custom
      ? `默认目录：${value.defaultDirectory}`
      : '当前正在使用默认目录。';
    reset.disabled = !value.custom;
    message.style.color = 'var(--af-text-secondary)';
    message.textContent = value.changed
      ? '资产库目录已切换，本地服务已重新连接。'
      : value.custom
        ? '当前使用自定义资产库目录。'
        : '当前使用默认资产库目录。';
  };

  const run = async (work: () => Promise<NonNullable<typeof current>>, pending: string) => {
    if (busy || disposed) return;
    setBusy(true);
    message.style.color = 'var(--af-text-secondary)';
    message.textContent = pending;
    try {
      render(await work());
    } catch (error) {
      if (disposed) return;
      message.style.color = 'var(--af-danger)';
      message.textContent = error instanceof Error ? error.message : '资产库目录操作失败。';
    } finally {
      if (!disposed) setBusy(false);
    }
  };

  choose.addEventListener('click', () => {
    void run(() => library.select(), '正在选择并切换资产库目录…');
  });
  reset.addEventListener('click', () => {
    void run(() => library.reset(), '正在恢复默认资产库目录…');
  });
  open.addEventListener('click', () => {
    void run(() => library.open(), '正在打开资产库目录…');
  });

  void run(() => library.status(), '正在读取资产库目录…');

  return () => {
    disposed = true;
    card.remove();
  };
}
