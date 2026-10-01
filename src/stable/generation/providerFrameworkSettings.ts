import { createStableTextElement as textElement } from '../design/dom';

type Capability = 'text' | 'image' | 'video' | 'audio';
type Provider = {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  modelsPath: string;
  headers: Record<string, string>;
  configured?: boolean;
};
type Model = {
  id: string;
  providerId: string;
  name: string;
  upstreamModelId: string;
  capability: Capability;
  protocolId: string;
  maxConcurrent?: number;
  useProxy?: boolean;
  modes?: string[];
  advancedParams?: unknown[];
};
type Protocol = {
  id: string;
  label: string;
  capability: Capability;
  adapter?: string;
  createPath?: string;
  pollPath?: string;
  method?: string;
  contentType?: string;
  requestTemplate?: unknown;
  response?: unknown;
};
type FrameworkState = {
  providers: Provider[];
  models: Model[];
  protocols: Protocol[];
  builtinProtocols: Protocol[];
};
type PageTab = 'connection' | 'models' | 'protocols';

const CAPABILITY_LABEL: Record<Capability, string> = {
  text: '文本',
  image: '图片',
  video: '视频',
  audio: '音频',
};

async function request<T>(url: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init.headers || {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof body?.error === 'string' ? body.error : `请求失败 (${response.status})`);
  }
  return body as T;
}

function input(value = '', placeholder = '') {
  const field = document.createElement('input');
  field.className =
    'w-full rounded-lg border border-[var(--af-border)] bg-[var(--af-input)] px-3.5 py-2.5 text-sm text-[var(--af-text)] outline-none transition focus:border-[var(--af-info)]';
  field.value = value;
  field.placeholder = placeholder;
  return field;
}

function textarea(value = '', placeholder = '', rows = 5) {
  const field = document.createElement('textarea');
  field.className =
    'w-full resize-y rounded-lg border border-[var(--af-border)] bg-[var(--af-input)] px-3.5 py-2.5 font-mono text-xs leading-6 text-[var(--af-text)] outline-none transition focus:border-[var(--af-info)]';
  field.value = value;
  field.placeholder = placeholder;
  field.rows = rows;
  return field;
}

function selectField(options: Array<{ label: string; value: string }>, value: string) {
  const select = document.createElement('select');
  select.className =
    'w-full rounded-lg border border-[var(--af-border)] bg-[var(--af-input)] px-3.5 py-2.5 text-sm text-[var(--af-text)] outline-none';
  for (const option of options) {
    select.add(new Option(option.label, option.value, false, option.value === value));
  }
  return select;
}

function button(label: string, variant: 'primary' | 'secondary' | 'danger' | 'ghost' = 'secondary') {
  const element = document.createElement('button');
  element.type = 'button';
  element.textContent = label;
  const common =
    'inline-flex items-center justify-center rounded-lg px-3.5 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50';
  element.className =
    variant === 'primary'
      ? `${common} bg-[var(--af-selected)] text-[var(--af-on-selected)] hover:opacity-90`
      : variant === 'danger'
        ? `${common} border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/15`
        : variant === 'ghost'
          ? `${common} text-[var(--af-text-secondary)] hover:bg-[var(--af-hover)] hover:text-[var(--af-text)]`
          : `${common} border border-[var(--af-border)] bg-[var(--af-surface)] text-[var(--af-text)] hover:bg-[var(--af-hover)]`;
  return element;
}

function field(label: string, control: HTMLElement, hint?: string) {
  const wrap = document.createElement('label');
  wrap.className = 'block space-y-1.5';
  wrap.append(textElement('span', label, 'text-xs font-medium text-[var(--af-text-secondary)]'));
  wrap.append(control);
  if (hint) wrap.append(textElement('span', hint, 'block text-[11px] leading-5 text-[var(--af-text-muted)]'));
  return wrap;
}

function panel() {
  const element = document.createElement('section');
  element.className =
    'rounded-xl border border-[var(--af-border)] bg-[var(--af-surface)] shadow-sm';
  return element;
}

function badge(label: string, tone: 'neutral' | 'success' | 'accent' = 'neutral') {
  const element = textElement('span', label, 'inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium');
  element.className +=
    tone === 'success'
      ? ' bg-emerald-500/10 text-emerald-400'
      : tone === 'accent'
        ? ' bg-blue-500/10 text-blue-400'
        : ' bg-[var(--af-input)] text-[var(--af-text-muted)]';
  return element;
}

function jsonObject(value: string, label: string) {
  if (!value.trim()) return {};
  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error();
    return parsed;
  } catch {
    throw new Error(`${label} 必须是 JSON 对象`);
  }
}

function jsonArray(value: string, label: string) {
  if (!value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) throw new Error();
    return parsed;
  } catch {
    throw new Error(`${label} 必须是 JSON 数组`);
  }
}

function notifyChanged() {
  window.dispatchEvent(new CustomEvent('fisherai:model-sources-changed'));
}

function protocolOptions(state: FrameworkState, capability: Capability) {
  return [...state.builtinProtocols, ...state.protocols]
    .filter((item) => item.capability === capability)
    .map((item) => ({ label: item.label, value: item.id }));
}

function providerListItem(
  provider: Provider,
  selected: boolean,
  count: number,
  onSelect: () => void,
) {
  const item = document.createElement('button');
  item.type = 'button';
  item.className = `w-full rounded-xl border p-3 text-left transition ${
    selected
      ? 'border-[var(--af-info)] bg-[var(--af-selected)]/10'
      : 'border-transparent hover:border-[var(--af-border)] hover:bg-[var(--af-hover)]'
  }`;
  item.addEventListener('click', onSelect);

  const first = document.createElement('div');
  first.className = 'flex items-center gap-2';
  first.append(
    textElement('strong', provider.name || '未命名供应商', 'min-w-0 flex-1 truncate text-sm text-[var(--af-text)]'),
    badge(provider.configured ? '已配置' : '未配置', provider.configured ? 'success' : 'neutral'),
  );
  const second = document.createElement('div');
  second.className = 'mt-1.5 flex items-center gap-2 text-[11px] text-[var(--af-text-muted)]';
  second.append(
    textElement('span', `${count} 个模型`),
    textElement('span', '·'),
    textElement('span', provider.baseUrl || '未设置 Base URL', 'min-w-0 flex-1 truncate'),
  );
  item.append(first, second);
  return item;
}

function renderConnection(
  provider: Provider,
  reload: () => Promise<void>,
  setStatus: (message: string, tone?: 'normal' | 'success' | 'error') => void,
) {
  const card = panel();
  card.className += ' p-5';

  const header = document.createElement('div');
  header.className = 'mb-5';
  header.append(
    textElement('h3', '连接配置', 'text-lg font-semibold text-[var(--af-text)]'),
    textElement(
      'p',
      '配置供应商的访问地址和认证信息。测试连接会自动保存当前表单。',
      'mt-1 text-sm text-[var(--af-text-muted)]',
    ),
  );

  const name = input(provider.name, '例如：CPA、OpenAI Proxy');
  const baseUrl = input(provider.baseUrl, 'https://api.example.com');
  const apiKey = input(provider.apiKey, 'API Key（可留空）');
  apiKey.type = 'password';
  const modelsPath = input(provider.modelsPath || '/v1/models', '/v1/models');
  const headers = textarea(JSON.stringify(provider.headers || {}, null, 2), '{\n  "X-Custom-Header": "value"\n}', 6);

  const grid = document.createElement('div');
  grid.className = 'grid gap-4 lg:grid-cols-2';
  grid.append(
    field('供应商名称', name),
    field('Base URL', baseUrl, '只填写服务根地址，不需要带具体生成路径。'),
    field('API Key', apiKey, '本地服务或无需认证的接口可以留空。'),
    field('模型列表路径', modelsPath, '用于测试连接和拉取模型，常见为 /v1/models。'),
  );

  const persist = async () =>
    request<Provider>('/api/provider-framework/providers', {
      method: 'POST',
      body: JSON.stringify({
        id: provider.id,
        name: name.value.trim(),
        baseUrl: baseUrl.value.trim(),
        apiKey: apiKey.value,
        modelsPath: modelsPath.value.trim(),
        headers: jsonObject(headers.value, '自定义 Headers'),
      }),
    });

  const actions = document.createElement('div');
  actions.className = 'mt-5 flex flex-wrap gap-2';
  const save = button('保存配置', 'primary');
  const test = button('测试连接');
  const remove = button('删除供应商', 'danger');

  save.addEventListener('click', async () => {
    save.disabled = true;
    setStatus('正在保存…');
    try {
      await persist();
      notifyChanged();
      setStatus('配置已保存', 'success');
      await reload();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '保存失败', 'error');
    } finally {
      save.disabled = false;
    }
  });

  test.addEventListener('click', async () => {
    test.disabled = true;
    setStatus('正在测试连接…');
    try {
      await persist();
      await request(`/api/provider-framework/providers/${encodeURIComponent(provider.id)}/test`, {
        method: 'POST',
      });
      notifyChanged();
      setStatus('连接成功', 'success');
      await reload();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '连接失败', 'error');
    } finally {
      test.disabled = false;
    }
  });

  remove.addEventListener('click', async () => {
    if (!confirm(`删除供应商“${provider.name}”及其全部自定义模型？`)) return;
    remove.disabled = true;
    try {
      await request(`/api/provider-framework/providers/${encodeURIComponent(provider.id)}`, {
        method: 'DELETE',
      });
      notifyChanged();
      await reload();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '删除失败', 'error');
      remove.disabled = false;
    }
  });

  actions.append(save, test, remove);
  card.append(header, grid, field('自定义 Headers', headers, '填写 JSON 对象，可覆盖或增加请求 Header。'), actions);
  return card;
}

function renderModelEditor(
  state: FrameworkState,
  provider: Provider,
  model: Model | null,
  onDone: () => Promise<void>,
  onCancel: () => void,
  setStatus: (message: string, tone?: 'normal' | 'success' | 'error') => void,
) {
  const box = panel();
  box.className += ' p-5';

  const capability = selectField(
    (Object.keys(CAPABILITY_LABEL) as Capability[]).map((value) => ({
      label: CAPABILITY_LABEL[value],
      value,
    })),
    model?.capability || 'text',
  );
  const protocol = selectField(protocolOptions(state, capability.value as Capability), model?.protocolId || '');
  const syncProtocols = () => {
    const current = protocol.value;
    protocol.replaceChildren();
    const options = protocolOptions(state, capability.value as Capability);
    for (const item of options) protocol.add(new Option(item.label, item.value, false, item.value === current));
    if (!protocol.value && options[0]) protocol.value = options[0].value;
  };
  capability.addEventListener('change', syncProtocols);
  syncProtocols();

  const name = input(model?.name || '', '画布中显示的名称');
  const upstream = input(model?.upstreamModelId || '', '上游 Model ID');
  const modes = input((model?.modes || []).join(', '), '例如：text-to-image, image-to-image');
  const maxConcurrent = input(String(model?.maxConcurrent || 1), '1');
  maxConcurrent.type = 'number';
  maxConcurrent.min = '1';
  maxConcurrent.max = '100';
  const advanced = textarea(
    JSON.stringify(model?.advancedParams || [], null, 2),
    '[{"key":"quality","label":"质量","type":"select"}]',
    6,
  );

  const title = document.createElement('div');
  title.className = 'mb-4 flex items-center justify-between';
  title.append(
    textElement('h3', model ? '编辑模型' : '添加模型', 'text-base font-semibold text-[var(--af-text)]'),
  );

  const grid = document.createElement('div');
  grid.className = 'grid gap-4 lg:grid-cols-2';
  grid.append(
    field('显示名称', name),
    field('上游 Model ID', upstream),
    field('模型类型', capability),
    field('请求协议', protocol),
    field('模式', modes, '可留空，框架会按模型类型使用默认模式。'),
    field('最大并发', maxConcurrent),
  );

  const actions = document.createElement('div');
  actions.className = 'mt-4 flex gap-2';
  const save = button(model ? '保存模型' : '添加模型', 'primary');
  const cancel = button('取消', 'ghost');
  cancel.addEventListener('click', onCancel);

  save.addEventListener('click', async () => {
    save.disabled = true;
    try {
      await request('/api/provider-framework/models', {
        method: 'POST',
        body: JSON.stringify({
          ...(model?.id ? { id: model.id } : {}),
          providerId: provider.id,
          name: name.value.trim(),
          upstreamModelId: upstream.value.trim(),
          capability: capability.value,
          protocolId: protocol.value,
          maxConcurrent: Number(maxConcurrent.value) || 1,
          modes: modes.value.split(',').map((value) => value.trim()).filter(Boolean),
          advancedParams: jsonArray(advanced.value, '节点高级参数'),
        }),
      });
      notifyChanged();
      setStatus(model ? '模型已保存' : '模型已添加', 'success');
      await onDone();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '保存模型失败', 'error');
      save.disabled = false;
    }
  });

  actions.append(save, cancel);
  box.append(title, grid, field('节点高级参数（JSON）', advanced), actions);
  return box;
}

function renderModels(
  state: FrameworkState,
  provider: Provider,
  rerender: () => Promise<void>,
  ui: { editingModelId: string | null; discoveredModels: string[] },
  setStatus: (message: string, tone?: 'normal' | 'success' | 'error') => void,
) {
  const root = document.createElement('div');
  root.className = 'space-y-4';

  const top = panel();
  top.className += ' p-5';
  const heading = document.createElement('div');
  heading.className = 'flex flex-wrap items-start justify-between gap-3';
  const title = document.createElement('div');
  title.append(
    textElement('h3', '模型管理', 'text-lg font-semibold text-[var(--af-text)]'),
    textElement('p', '为当前供应商添加模型，并指定模型类型与请求协议。', 'mt-1 text-sm text-[var(--af-text-muted)]'),
  );
  const actions = document.createElement('div');
  actions.className = 'flex gap-2';
  const pull = button('拉取模型');
  const add = button('手动添加', 'primary');
  actions.append(pull, add);
  heading.append(title, actions);
  top.append(heading);
  root.append(top);

  const currentModels = state.models.filter((item) => item.providerId === provider.id);

  add.addEventListener('click', () => {
    ui.editingModelId = '__new__';
    void rerender();
  });

  pull.addEventListener('click', async () => {
    pull.disabled = true;
    setStatus('正在拉取模型列表…');
    try {
      const result = await request<{ models: string[] }>(
        `/api/provider-framework/providers/${encodeURIComponent(provider.id)}/discover`,
        { method: 'POST' },
      );
      ui.discoveredModels = result.models.filter(
        (name) => !currentModels.some((item) => item.upstreamModelId === name),
      );
      setStatus(`已拉取 ${result.models.length} 个模型`, 'success');
      await rerender();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '拉取模型失败', 'error');
    } finally {
      pull.disabled = false;
    }
  });

  if (ui.editingModelId) {
    const model =
      ui.editingModelId === '__new__'
        ? null
        : currentModels.find((item) => item.id === ui.editingModelId) || null;
    root.append(
      renderModelEditor(
        state,
        provider,
        model,
        async () => {
          ui.editingModelId = null;
          await rerender();
        },
        () => {
          ui.editingModelId = null;
          void rerender();
        },
        setStatus,
      ),
    );
  }

  if (ui.discoveredModels.length) {
    const discovered = panel();
    discovered.className += ' overflow-hidden';
    const head = document.createElement('div');
    head.className = 'flex items-center justify-between border-b border-[var(--af-border)] px-5 py-4';
    head.append(
      textElement('strong', `发现的新模型（${ui.discoveredModels.length}）`, 'text-sm text-[var(--af-text)]'),
    );
    const clear = button('收起', 'ghost');
    clear.addEventListener('click', () => {
      ui.discoveredModels = [];
      void rerender();
    });
    head.append(clear);
    discovered.append(head);

    for (const upstreamModelId of ui.discoveredModels) {
      const row = document.createElement('div');
      row.className =
        'grid items-center gap-3 border-b border-[var(--af-border)] px-5 py-3 last:border-b-0 lg:grid-cols-[minmax(0,1fr)_120px_220px_auto]';
      const modelName = textElement('code', upstreamModelId, 'truncate text-xs text-[var(--af-text)]');
      const capability = selectField(
        (Object.keys(CAPABILITY_LABEL) as Capability[]).map((value) => ({
          label: CAPABILITY_LABEL[value],
          value,
        })),
        upstreamModelId.toLowerCase().includes('image') ? 'image' : 'text',
      );
      const protocol = selectField(
        protocolOptions(state, capability.value as Capability),
        '',
      );
      const sync = () => {
        protocol.replaceChildren();
        const options = protocolOptions(state, capability.value as Capability);
        for (const option of options) protocol.add(new Option(option.label, option.value));
      };
      capability.addEventListener('change', sync);
      sync();
      const addOne = button('添加');
      addOne.addEventListener('click', async () => {
        addOne.disabled = true;
        try {
          await request('/api/provider-framework/models', {
            method: 'POST',
            body: JSON.stringify({
              providerId: provider.id,
              name: upstreamModelId,
              upstreamModelId,
              capability: capability.value,
              protocolId: protocol.value,
            }),
          });
          notifyChanged();
          ui.discoveredModels = ui.discoveredModels.filter((value) => value !== upstreamModelId);
          setStatus(`已添加 ${upstreamModelId}`, 'success');
          await rerender();
        } catch (error) {
          setStatus(error instanceof Error ? error.message : '添加失败', 'error');
          addOne.disabled = false;
        }
      });
      row.append(modelName, capability, protocol, addOne);
      discovered.append(row);
    }
    root.append(discovered);
  }

  const list = panel();
  list.className += ' overflow-hidden';
  const listHead = document.createElement('div');
  listHead.className = 'grid grid-cols-[minmax(0,1.2fr)_110px_minmax(0,1fr)_auto] gap-3 border-b border-[var(--af-border)] px-5 py-3 text-xs font-medium text-[var(--af-text-muted)]';
  listHead.append(
    textElement('span', '模型'),
    textElement('span', '类型'),
    textElement('span', '协议'),
    textElement('span', '操作'),
  );
  list.append(listHead);

  if (!currentModels.length) {
    list.append(
      textElement(
        'div',
        '这个供应商还没有模型。可以从上游拉取，也可以手动添加。',
        'px-5 py-10 text-center text-sm text-[var(--af-text-muted)]',
      ),
    );
  } else {
    const protocols = new Map(
      [...state.builtinProtocols, ...state.protocols].map((item) => [item.id, item]),
    );
    for (const model of currentModels) {
      const row = document.createElement('div');
      row.className =
        'grid grid-cols-[minmax(0,1.2fr)_110px_minmax(0,1fr)_auto] items-center gap-3 border-b border-[var(--af-border)] px-5 py-3 last:border-b-0';
      const identity = document.createElement('div');
      identity.className = 'min-w-0';
      identity.append(
        textElement('div', model.name, 'truncate text-sm font-medium text-[var(--af-text)]'),
        textElement('code', model.upstreamModelId, 'mt-1 block truncate text-[11px] text-[var(--af-text-muted)]'),
      );
      const modelActions = document.createElement('div');
      modelActions.className = 'flex gap-1';
      const edit = button('编辑', 'ghost');
      const remove = button('删除', 'ghost');
      edit.addEventListener('click', () => {
        ui.editingModelId = model.id;
        void rerender();
      });
      remove.addEventListener('click', async () => {
        if (!confirm(`删除模型“${model.name}”？`)) return;
        await request(`/api/provider-framework/models/${encodeURIComponent(model.id)}`, {
          method: 'DELETE',
        });
        notifyChanged();
        setStatus('模型已删除', 'success');
        await rerender();
      });
      modelActions.append(edit, remove);
      row.append(
        identity,
        badge(CAPABILITY_LABEL[model.capability]),
        textElement('span', protocols.get(model.protocolId)?.label || model.protocolId, 'truncate text-xs text-[var(--af-text-secondary)]'),
        modelActions,
      );
      list.append(row);
    }
  }
  root.append(list);
  return root;
}

function renderProtocolEditor(
  protocol: Protocol | null,
  onDone: () => Promise<void>,
  onCancel: () => void,
  setStatus: (message: string, tone?: 'normal' | 'success' | 'error') => void,
) {
  const box = panel();
  box.className += ' p-5';
  const label = input(protocol?.label || '', '协议名称');
  const capability = selectField(
    (Object.keys(CAPABILITY_LABEL) as Capability[]).map((value) => ({
      label: CAPABILITY_LABEL[value],
      value,
    })),
    protocol?.capability || 'image',
  );
  const method = selectField(
    ['POST', 'GET', 'PUT', 'PATCH'].map((value) => ({ label: value, value })),
    protocol?.method || 'POST',
  );
  const contentType = input(protocol?.contentType || 'application/json', 'application/json');
  const createPath = input(protocol?.createPath || '/v1/generate', '/v1/generate');
  const pollPath = input(protocol?.pollPath || '', '/v1/tasks/{taskId}');
  const template = textarea(
    JSON.stringify(protocol?.requestTemplate || { model: '$model', prompt: '$prompt' }, null, 2),
    '{"model":"$model","prompt":"$prompt"}',
    8,
  );
  const response = textarea(
    JSON.stringify(protocol?.response || { resultPath: 'data.0.url' }, null, 2),
    '{"resultPath":"data.0.url"}',
    8,
  );

  const grid = document.createElement('div');
  grid.className = 'grid gap-4 lg:grid-cols-2';
  grid.append(
    field('协议名称', label),
    field('能力类型', capability),
    field('HTTP 方法', method),
    field('Content-Type', contentType),
    field('创建路径', createPath),
    field('轮询路径', pollPath, '同步接口可以留空。异步任务支持 {taskId} 占位。'),
    field('请求模板', template),
    field('响应映射', response),
  );

  const actions = document.createElement('div');
  actions.className = 'mt-4 flex gap-2';
  const save = button(protocol ? '保存协议' : '创建协议', 'primary');
  const cancel = button('取消', 'ghost');
  cancel.addEventListener('click', onCancel);
  save.addEventListener('click', async () => {
    save.disabled = true;
    try {
      await request('/api/provider-framework/protocols', {
        method: 'POST',
        body: JSON.stringify({
          ...(protocol?.id ? { id: protocol.id } : {}),
          label: label.value.trim(),
          capability: capability.value,
          method: method.value,
          contentType: contentType.value.trim(),
          createPath: createPath.value.trim(),
          pollPath: pollPath.value.trim(),
          requestTemplate: jsonObject(template.value, '请求模板'),
          response: jsonObject(response.value, '响应映射'),
        }),
      });
      notifyChanged();
      setStatus(protocol ? '协议已保存' : '协议已创建', 'success');
      await onDone();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '保存协议失败', 'error');
      save.disabled = false;
    }
  });
  actions.append(save, cancel);

  box.append(
    textElement('h3', protocol ? '编辑声明式协议' : '新建声明式协议', 'mb-4 text-base font-semibold text-[var(--af-text)]'),
    grid,
    actions,
  );
  return box;
}

function renderProtocols(
  state: FrameworkState,
  rerender: () => Promise<void>,
  ui: { editingProtocolId: string | null },
  setStatus: (message: string, tone?: 'normal' | 'success' | 'error') => void,
) {
  const root = document.createElement('div');
  root.className = 'space-y-4';

  const intro = panel();
  intro.className += ' p-5';
  const introTop = document.createElement('div');
  introTop.className = 'flex flex-wrap items-start justify-between gap-3';
  const copy = document.createElement('div');
  copy.append(
    textElement('h3', '协议适配', 'text-lg font-semibold text-[var(--af-text)]'),
    textElement(
      'p',
      '常用协议使用内置适配器；非标准接口可以通过声明式请求模板和响应映射扩展。',
      'mt-1 text-sm text-[var(--af-text-muted)]',
    ),
  );
  const add = button('新增声明式协议', 'primary');
  add.addEventListener('click', () => {
    ui.editingProtocolId = '__new__';
    void rerender();
  });
  introTop.append(copy, add);
  intro.append(introTop);
  root.append(intro);

  if (ui.editingProtocolId) {
    const protocol =
      ui.editingProtocolId === '__new__'
        ? null
        : state.protocols.find((item) => item.id === ui.editingProtocolId) || null;
    root.append(
      renderProtocolEditor(
        protocol,
        async () => {
          ui.editingProtocolId = null;
          await rerender();
        },
        () => {
          ui.editingProtocolId = null;
          void rerender();
        },
        setStatus,
      ),
    );
  }

  const builtin = panel();
  builtin.className += ' overflow-hidden';
  builtin.append(
    textElement('div', '内置协议', 'border-b border-[var(--af-border)] px-5 py-3 text-sm font-semibold text-[var(--af-text)]'),
  );
  for (const protocol of state.builtinProtocols) {
    const row = document.createElement('div');
    row.className = 'flex items-center gap-3 border-b border-[var(--af-border)] px-5 py-3 last:border-b-0';
    row.append(
      textElement('span', protocol.label, 'min-w-0 flex-1 text-sm text-[var(--af-text)]'),
      badge(CAPABILITY_LABEL[protocol.capability]),
      badge('代码适配器', 'accent'),
    );
    builtin.append(row);
  }
  root.append(builtin);

  const custom = panel();
  custom.className += ' overflow-hidden';
  custom.append(
    textElement(
      'div',
      `自定义协议（${state.protocols.length}）`,
      'border-b border-[var(--af-border)] px-5 py-3 text-sm font-semibold text-[var(--af-text)]',
    ),
  );
  if (!state.protocols.length) {
    custom.append(
      textElement(
        'div',
        '暂无声明式协议。需要接入非标准接口时再新增即可。',
        'px-5 py-8 text-center text-sm text-[var(--af-text-muted)]',
      ),
    );
  } else {
    for (const protocol of state.protocols) {
      const row = document.createElement('div');
      row.className = 'flex items-center gap-3 border-b border-[var(--af-border)] px-5 py-3 last:border-b-0';
      const info = document.createElement('div');
      info.className = 'min-w-0 flex-1';
      info.append(
        textElement('div', protocol.label, 'text-sm font-medium text-[var(--af-text)]'),
        textElement(
          'code',
          `${protocol.method || 'POST'} ${protocol.createPath || ''}`,
          'mt-1 block truncate text-[11px] text-[var(--af-text-muted)]',
        ),
      );
      const edit = button('编辑', 'ghost');
      const remove = button('删除', 'ghost');
      edit.addEventListener('click', () => {
        ui.editingProtocolId = protocol.id;
        void rerender();
      });
      remove.addEventListener('click', async () => {
        if (!confirm(`删除协议“${protocol.label}”？使用该协议的自定义模型也会被移除。`)) return;
        await request(`/api/provider-framework/protocols/${encodeURIComponent(protocol.id)}`, {
          method: 'DELETE',
        });
        notifyChanged();
        setStatus('协议已删除', 'success');
        await rerender();
      });
      row.append(info, badge(CAPABILITY_LABEL[protocol.capability]), edit, remove);
      custom.append(row);
    }
  }
  root.append(custom);
  return root;
}

export function mountProviderFrameworkSettings(host: HTMLElement): () => void {
  let disposed = false;
  let selectedProviderId: string | null = null;
  let activeTab: PageTab = 'connection';
  const ui = {
    editingModelId: null as string | null,
    editingProtocolId: null as string | null,
    discoveredModels: [] as string[],
  };

  const root = document.createElement('section');
  root.setAttribute('data-fisherai-provider-framework', 'true');
  root.className = 'pb-10';
  host.append(root);

  const render = async () => {
    if (disposed) return;
    root.replaceChildren();

    const state = await request<FrameworkState>('/api/provider-framework');
    if (!selectedProviderId || !state.providers.some((item) => item.id === selectedProviderId)) {
      selectedProviderId = state.providers[0]?.id || null;
    }
    const selectedProvider = state.providers.find((item) => item.id === selectedProviderId) || null;

    const pageHeader = document.createElement('div');
    pageHeader.className = 'mb-5 flex flex-wrap items-start justify-between gap-4';
    const title = document.createElement('div');
    title.append(
      textElement('h2', '自定义供应商', 'text-2xl font-bold tracking-tight text-[var(--af-text)]'),
      textElement(
        'p',
        '管理自定义模型服务、模型目录和协议适配。这里的配置独立于内置闭源供应商。',
        'mt-1.5 text-sm leading-6 text-[var(--af-text-secondary)]',
      ),
    );
    const addProvider = button('新增供应商', 'primary');
    addProvider.addEventListener('click', async () => {
      try {
        const created = await request<Provider>('/api/provider-framework/providers', {
          method: 'POST',
          body: JSON.stringify({
            name: '新供应商',
            baseUrl: 'http://127.0.0.1:3000',
            apiKey: '',
            modelsPath: '/v1/models',
            headers: {},
          }),
        });
        selectedProviderId = created.id;
        activeTab = 'connection';
        await render();
      } catch (error) {
        alert(error instanceof Error ? error.message : '新增供应商失败');
      }
    });
    pageHeader.append(title, addProvider);
    root.append(pageHeader);

    const workspace = document.createElement('div');
    workspace.className =
      'grid min-h-[620px] overflow-hidden rounded-2xl border border-[var(--af-border)] bg-[var(--af-surface)] lg:grid-cols-[260px_minmax(0,1fr)]';

    const sidebar = document.createElement('aside');
    sidebar.className = 'border-b border-[var(--af-border)] bg-[var(--af-input)]/40 p-3 lg:border-b-0 lg:border-r';
    sidebar.append(
      textElement('div', `供应商（${state.providers.length}）`, 'px-2 pb-2 pt-1 text-xs font-semibold uppercase tracking-wide text-[var(--af-text-muted)]'),
    );
    const providerList = document.createElement('div');
    providerList.className = 'space-y-1';
    for (const provider of state.providers) {
      providerList.append(
        providerListItem(
          provider,
          provider.id === selectedProviderId,
          state.models.filter((item) => item.providerId === provider.id).length,
          () => {
            selectedProviderId = provider.id;
            activeTab = 'connection';
            ui.editingModelId = null;
            ui.discoveredModels = [];
            void render();
          },
        ),
      );
    }
    if (!state.providers.length) {
      providerList.append(
        textElement(
          'div',
          '还没有供应商。点击右上角“新增供应商”开始配置。',
          'rounded-xl border border-dashed border-[var(--af-border)] px-3 py-8 text-center text-xs leading-5 text-[var(--af-text-muted)]',
        ),
      );
    }
    sidebar.append(providerList);

    const main = document.createElement('main');
    main.className = 'min-w-0 bg-[var(--af-surface-raised)]';

    if (!selectedProvider) {
      const empty = document.createElement('div');
      empty.className = 'flex h-full min-h-[620px] items-center justify-center p-8';
      const emptyInner = document.createElement('div');
      emptyInner.className = 'max-w-sm text-center';
      emptyInner.append(
        textElement('div', '还没有自定义供应商', 'text-lg font-semibold text-[var(--af-text)]'),
        textElement(
          'p',
          '新增一个供应商后，可以配置连接、拉取模型并选择对应协议。',
          'mt-2 text-sm leading-6 text-[var(--af-text-muted)]',
        ),
      );
      empty.append(emptyInner);
      main.append(empty);
    } else {
      const providerHeader = document.createElement('div');
      providerHeader.className = 'border-b border-[var(--af-border)] px-6 pt-5';
      const identity = document.createElement('div');
      identity.className = 'mb-4 flex items-center gap-3';
      const providerName = document.createElement('div');
      providerName.className = 'min-w-0 flex-1';
      providerName.append(
        textElement('h3', selectedProvider.name, 'truncate text-lg font-semibold text-[var(--af-text)]'),
        textElement('div', selectedProvider.baseUrl, 'mt-1 truncate text-xs text-[var(--af-text-muted)]'),
      );
      identity.append(providerName, badge(selectedProvider.configured ? '连接已配置' : '待配置', selectedProvider.configured ? 'success' : 'neutral'));
      providerHeader.append(identity);

      const tabs = document.createElement('div');
      tabs.className = 'flex gap-1';
      const tabItems: Array<[PageTab, string]> = [
        ['connection', '连接配置'],
        ['models', `模型管理 · ${state.models.filter((item) => item.providerId === selectedProvider.id).length}`],
        ['protocols', '协议适配'],
      ];
      for (const [id, label] of tabItems) {
        const tab = document.createElement('button');
        tab.type = 'button';
        tab.textContent = label;
        tab.className = `border-b-2 px-3 py-2.5 text-sm font-medium transition ${
          activeTab === id
            ? 'border-[var(--af-info)] text-[var(--af-text)]'
            : 'border-transparent text-[var(--af-text-muted)] hover:text-[var(--af-text)]'
        }`;
        tab.addEventListener('click', () => {
          activeTab = id;
          ui.editingModelId = null;
          ui.editingProtocolId = null;
          void render();
        });
        tabs.append(tab);
      }
      providerHeader.append(tabs);
      main.append(providerHeader);

      const content = document.createElement('div');
      content.className = 'p-5 lg:p-6';

      const status = document.createElement('div');
      status.className = 'mb-4 hidden rounded-lg border px-3 py-2 text-xs';
      const setStatus = (message: string, tone: 'normal' | 'success' | 'error' = 'normal') => {
        status.textContent = message;
        status.className =
          'mb-4 rounded-lg border px-3 py-2 text-xs ' +
          (tone === 'success'
            ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
            : tone === 'error'
              ? 'border-red-500/20 bg-red-500/10 text-red-400'
              : 'border-[var(--af-border)] bg-[var(--af-input)] text-[var(--af-text-secondary)]');
      };
      content.append(status);

      if (activeTab === 'connection') {
        content.append(renderConnection(selectedProvider, render, setStatus));
      } else if (activeTab === 'models') {
        content.append(renderModels(state, selectedProvider, render, ui, setStatus));
      } else {
        content.append(renderProtocols(state, render, ui, setStatus));
      }
      main.append(content);
    }

    workspace.append(sidebar, main);
    root.append(workspace);
  };

  void render().catch((error) => {
    root.replaceChildren(
      textElement(
        'div',
        error instanceof Error ? error.message : '读取自定义供应商配置失败',
        'rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400',
      ),
    );
  });

  return () => {
    disposed = true;
    root.remove();
  };
}
