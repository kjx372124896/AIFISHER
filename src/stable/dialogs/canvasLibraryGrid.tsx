import type { Runtime, GridProps, Icons, LibraryItem, AssetFields } from './canvasLibrary';
import { ASSET_CATEGORIES, assetCategory } from '../media/assetOrganization';

const ASSET_FOLDER_STORAGE_KEY = 'aifisher.asset-library.folders.v1';
const normalizeFolderPath = (value: string) => value.split('/').map((part) => part.trim()).filter(Boolean).join('/');
const parentFolderPath = (value: string) => value.split('/').slice(0, -1).join('/');
const folderName = (value: string) => value.split('/').filter(Boolean).at(-1) || value;

export function CanvasLibraryGrid(React: Runtime, props: GridProps, icons: Icons) {
  const {
    selectedCategory,
    setSelectedCategory,
    assets,
    loading,
    deleting,
    saving,
    workflow,
    onSelectAsset,
    onDeleteAsset,
    onEditAsset,
  } = props;
  const [confirmation, setConfirmation] = React.useState<string | null>(null);
  const [failedImages, setFailedImages] = React.useState<Record<string, string>>({});
  const [query, setQuery] = React.useState('');
  const [ownershipFilter, setOwnershipFilter] = React.useState('');
  const [layout, setLayout] = React.useState<'grid' | 'list'>('grid');
  const [editing, setEditing] = React.useState<(AssetFields & { id: string }) | null>(null);
  const [currentFolder, setCurrentFolder] = React.useState('');
  const [newFolderName, setNewFolderName] = React.useState('');
  const [creatingFolder, setCreatingFolder] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [folders, setFolders] = React.useState<string[]>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(ASSET_FOLDER_STORAGE_KEY) || '[]');
      return Array.isArray(stored) ? stored.filter((value): value is string => typeof value === 'string') : [];
    } catch {
      return [];
    }
  });
  const editInput = React.useRef<HTMLInputElement>(null);
  const owner = React.useRef(true);
  React.useEffect(() => {
    owner.current = true;
    return () => {
      owner.current = false;
    };
  }, []);
  React.useEffect(() => {
    if (editing?.id) editInput.current?.focus();
  }, [editing?.id]);
  const categoryOf = (item: LibraryItem) =>
    workflow ? item.category || '其他' : normalizeFolderPath(assetCategory(item.category));
  const rootCategoryOf = (item: LibraryItem) => categoryOf(item).split('/')[0] || '其他';
  const categories = [
    'All',
    ...new Set([
      ...(workflow ? [] : ASSET_CATEGORIES),
      ...assets.map(rootCategoryOf).filter((category) => category !== 'All'),
    ]),
  ];
  const selected = categories.includes(selectedCategory) ? selectedCategory : 'All';
  const inferredFolders = assets
    .map(categoryOf)
    .filter((value) => value.includes('/'))
    .flatMap((value) => {
      const parts = value.split('/');
      return parts.slice(1).map((_, index) => parts.slice(0, index + 2).join('/'));
    });
  const allFolders = [...new Set([...folders, ...inferredFolders])].sort((a, b) => a.localeCompare(b, 'zh-CN'));
  const activePath = workflow || selected === 'All' ? '' : currentFolder || selected;
  const childFolders = workflow || !activePath
    ? []
    : allFolders.filter((value) => parentFolderPath(value) === activePath);
  const ownerships = [
    ...new Set(
      assets.map((item) => item.ownership?.trim()).filter((value): value is string => !!value),
    ),
  ];
  const effectiveOwnership =
    ownershipFilter === '__unassigned' || ownerships.includes(ownershipFilter)
      ? ownershipFilter
      : '';
  const filtered = assets.filter(
    (item) =>
      (workflow
        ? selected === 'All' || categoryOf(item) === selected
        : selected === 'All'
          ? true
          : categoryOf(item) === activePath) &&
      (!effectiveOwnership ||
        (effectiveOwnership === '__unassigned'
          ? !item.ownership?.trim()
          : item.ownership?.trim() === effectiveOwnership)) &&
      (!query.trim() ||
        [item.name, categoryOf(item), item.ownership]
          .join(' ')
          .toLocaleLowerCase()
          .includes(query.trim().toLocaleLowerCase())),
  );
  const selectedAssets = assets.filter((item) => selectedIds.includes(item.id));
  const persistFolders = (next: string[]) => {
    const normalized = [...new Set(next.map(normalizeFolderPath).filter((value) => value.includes('/')))];
    setFolders(normalized);
    localStorage.setItem(ASSET_FOLDER_STORAGE_KEY, JSON.stringify(normalized));
  };
  const { DeleteIcon, ImageIcon, VideoIcon, AudioIcon, WorkflowIcon } = icons;
  const busy = !!deleting || !!saving;
  const preview = (item: LibraryItem) => {
    const source = workflow ? item.coverUrl : item.url;
    const Placeholder = workflow ? WorkflowIcon : item.type === 'audio' ? AudioIcon : ImageIcon;
    if (!workflow && item.type === 'video')
      return (
        <div className="fisher-library-preview">
          <video
            src={source}
            preload="metadata"
            muted
            playsInline
            onMouseEnter={(event) => {
              const video = event.currentTarget;
              video.dataset.hovered = 'true';
              void video
                .play()
                .then(() => {
                  if (!video.isConnected || video.dataset.hovered !== 'true') video.pause();
                })
                .catch(() => {});
            }}
            onMouseLeave={(event) => {
              const video = event.currentTarget;
              video.dataset.hovered = '';
              video.pause();
              video.currentTime = 0;
            }}
          />
          <span className="fisher-library-media-type">
            <VideoIcon size={12} />
          </span>
        </div>
      );
    return (
      <div className="fisher-library-preview">
        {source && item.type !== 'audio' && failedImages[item.id] !== source ? (
          <img
            src={source}
            alt={item.name}
            loading="lazy"
            onError={() => setFailedImages((old) => ({ ...old, [item.id]: source }))}
          />
        ) : (
          <Placeholder size={32} strokeWidth={1.5} />
        )}
      </div>
    );
  };
  const actions = (item: LibraryItem) => (
    <div className="fisher-library-item-actions">
      {!workflow && onEditAsset && (
        <button
          type="button"
          disabled={busy}
          aria-label={`编辑 ${item.name}`}
          onClick={() => {
            setConfirmation(null);
            setEditing({
              id: item.id,
              name: item.name,
              category: categoryOf(item),
              ownership: item.ownership || '',
            });
          }}
        >
          编辑
        </button>
      )}
      <button
        type="button"
        disabled={busy}
        title={workflow ? '删除本地 SKILL' : '删除资产'}
        aria-label={`删除${item.name}`}
        onClick={() => {
          setEditing(null);
          setConfirmation(item.id);
        }}
      >
        <DeleteIcon size={14} />
      </button>
    </div>
  );
  const confirmDelete = (item: LibraryItem) =>
    confirmation === item.id && (
      <div className="fisher-library-confirm" role="group" aria-label={`确认删除 ${item.name}`}>
        <span>确认删除？</span>
        <button
          type="button"
          disabled={busy}
          className="is-danger"
          onClick={() => {
            void onDeleteAsset(item.id).then((success) => {
              if (success && owner.current)
                setConfirmation((current) => (current === item.id ? null : current));
            });
          }}
        >
          {deleting === item.id ? '删除中' : '删除'}
        </button>
        <button type="button" disabled={busy} onClick={() => setConfirmation(null)}>
          取消
        </button>
      </div>
    );
  return (
    <div className="fisher-library-content">
      <div
        className="fisher-library-categories"
        role="tablist"
        aria-label={workflow ? 'SKILL 分类' : '资产分类'}
      >
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            role="tab"
            aria-selected={selected === category}
            tabIndex={selected === category ? 0 : -1}
            onKeyDown={(event) => {
              if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
              event.preventDefault();
              const index = categories.indexOf(category);
              const next =
                event.key === 'Home'
                  ? 0
                  : event.key === 'End'
                    ? categories.length - 1
                    : (index + (event.key === 'ArrowRight' ? 1 : categories.length - 1)) %
                      categories.length;
              setSelectedCategory(categories[next]);
              setCurrentFolder('');
              setSelectedIds([]);
              setConfirmation(null);
              event.currentTarget.parentElement
                ?.querySelectorAll<HTMLButtonElement>('button')
                .item(next)?.focus();
            }}
            onClick={() => {
              setSelectedCategory(category);
              setCurrentFolder('');
              setSelectedIds([]);
              setConfirmation(null);
            }}
          >
            {category === 'All' ? '全部' : category}
          </button>
        ))}
      </div>
      {!workflow && selected !== 'All' && (
        <div className="fisher-library-folderbar">
          <div className="fisher-library-breadcrumbs">
            {activePath.split('/').map((part, index, parts) => {
              const path = parts.slice(0, index + 1).join('/');
              return (
                <button key={path} type="button" onClick={() => { setCurrentFolder(index === 0 ? '' : path); setSelectedIds([]); }}>
                  {part}
                </button>
              );
            })}
          </div>
          {creatingFolder ? (
            <form
              className="fisher-library-folder-create"
              onSubmit={(event) => {
                event.preventDefault();
                const name = newFolderName.trim();
                if (!name) return;
                const next = normalizeFolderPath(`${activePath}/${name}`);
                if (allFolders.includes(next)) {
                  window.alert('当前目录下已存在同名文件夹。');
                  return;
                }
                persistFolders([...folders, next]);
                setNewFolderName('');
                setCreatingFolder(false);
              }}
            >
              <input
                autoFocus
                maxLength={80}
                placeholder="文件夹名称"
                value={newFolderName}
                onChange={(event) => setNewFolderName(event.target.value)}
              />
              <button type="submit" className="is-primary" disabled={!newFolderName.trim()}>创建</button>
              <button type="button" onClick={() => { setNewFolderName(''); setCreatingFolder(false); }}>取消</button>
            </form>
          ) : (
            <button
              type="button"
              className="is-primary"
              onClick={() => setCreatingFolder(true)}
            >
              + 新建文件夹
            </button>
          )}
        </div>
      )}
      {!workflow && selectedIds.length > 0 && (
        <div className="fisher-library-batchbar">
          <strong>已选 {selectedIds.length} 项</strong>
          <button type="button" className="is-primary" disabled={busy} onClick={() => {
            selectedAssets.forEach((item) => onSelectAsset(item));
            setSelectedIds([]);
          }}>加入画布</button>
          {activePath && (
            <button type="button" disabled={busy} onClick={() => {
              const items = [...selectedAssets];
              void (async () => {
                for (const item of items) {
                  await onEditAsset?.(item.id, { name: item.name, category: activePath, ownership: item.ownership || '' });
                }
                if (owner.current) setSelectedIds([]);
              })();
            }}>移到当前文件夹</button>
          )}
          <button type="button" className="is-danger" disabled={busy} onClick={() => {
            if (!window.confirm(`确认删除选中的 ${selectedIds.length} 个资产？`)) return;
            const ids = [...selectedIds];
            void (async () => {
              for (const id of ids) await onDeleteAsset(id);
              if (owner.current) setSelectedIds([]);
            })();
          }}>删除所选</button>
          <button type="button" disabled={busy} onClick={() => setSelectedIds([])}>取消选择</button>
        </div>
      )}
      {!workflow && (
        <div className="fisher-library-tools">
          <input
            type="search"
            aria-label="搜索资产"
            placeholder="搜索名称、分类或归属"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select
            aria-label="筛选归属"
            value={effectiveOwnership}
            onChange={(event) => setOwnershipFilter(event.target.value)}
          >
            <option value="">全部归属</option>
            <option value="__unassigned">通用资产</option>
            {ownerships.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <div className="fisher-library-view" role="group" aria-label="资产视图">
            <button
              type="button"
              aria-pressed={layout === 'grid'}
              onClick={() => setLayout('grid')}
            >
              卡片
            </button>
            <button
              type="button"
              aria-pressed={layout === 'list'}
              onClick={() => setLayout('list')}
            >
              列表
            </button>
          </div>
        </div>
      )}
      <div className="fisher-library-scroll">
        {!workflow && childFolders.length > 0 && (
          <div className="fisher-library-folders">
            {childFolders.map((folder) => (
              <div key={folder} className="fisher-library-folder-card">
                <button type="button" onClick={() => { setCurrentFolder(folder); setSelectedIds([]); }}>
                  <span className="fisher-library-folder-icon">📁</span>
                  <span>{folderName(folder)}</span>
                </button>
                <button
                  type="button"
                  className="fisher-library-folder-delete"
                  aria-label={`删除文件夹 ${folderName(folder)}`}
                  onClick={() => {
                    const hasAssets = assets.some((item) => categoryOf(item) === folder || categoryOf(item).startsWith(`${folder}/`));
                    const hasChildren = allFolders.some((value) => value !== folder && value.startsWith(`${folder}/`));
                    if (hasAssets || hasChildren) return window.alert('文件夹内还有资产或子文件夹，不能删除。');
                    persistFolders(folders.filter((value) => value !== folder));
                  }}
                >×</button>
              </div>
            ))}
          </div>
        )}
        {editing && (
          <form
            className="fisher-library-editor"
            aria-label="编辑资产信息"
            onSubmit={(event) => {
              event.preventDefault();
              if (busy || !editing.name.trim() || !editing.category.trim()) return;
              const current = editing;
              void onEditAsset?.(current.id, {
                name: current.name.trim(),
                category: current.category.trim(),
                ownership: current.ownership.trim(),
              }).then((success) => {
                if (success && owner.current)
                  setEditing((value) => (value?.id === current.id ? null : value));
              });
            }}
          >
            <strong>编辑资产信息</strong>
            <div className="fisher-library-fields">
              <label>
                名称
                <input
                  ref={editInput}
                  required
                  maxLength={200}
                  value={editing.name}
                  disabled={busy}
                  onChange={(event) => setEditing({ ...editing, name: event.target.value })}
                />
              </label>
              <label>
                分类
                <input
                  required
                  maxLength={80}
                  value={editing.category}
                  disabled={busy}
                  onChange={(event) => setEditing({ ...editing, category: event.target.value })}
                />
              </label>
              <label>
                归属
                <input
                  maxLength={120}
                  value={editing.ownership}
                  disabled={busy}
                  placeholder="项目／短剧名，留空为通用"
                  onChange={(event) => setEditing({ ...editing, ownership: event.target.value })}
                />
              </label>
            </div>
            <select aria-label="选择已有分类" disabled={busy} className="w-full rounded-lg border border-neutral-700 bg-[#1a1a1a] px-3 py-2 text-white"
              value={[...categories, ...allFolders].includes(editing.category) ? editing.category : ''}
              onChange={(event) => { if (event.target.value) setEditing({ ...editing, category: event.target.value }); }}>
              <option value="" disabled>选择已有分类</option>
              {[...new Set([...categories.filter((value) => value !== 'All'), ...allFolders])]
                .map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
            </select>
            <div className="fisher-library-editor-actions">
              <button type="button" disabled={busy} onClick={() => setEditing(null)}>
                取消
              </button>
              <button
                type="submit"
                className="is-primary"
                disabled={busy || !editing.name.trim() || !editing.category.trim()}
              >
                {saving ? '保存中…' : '保存修改'}
              </button>
            </div>
          </form>
        )}
        {loading ? (
          <div className="fisher-library-empty" role="status">
            加载中...
          </div>
        ) : !filtered.length && !childFolders.length ? (
          <div className="fisher-library-empty">
            {workflow
              ? '当前分类还没有 SKILL。选中画布节点后，可将组合保存为本地 SKILL。'
              : '当前分类下没有资产。'}
            {!workflow && <p>选中画布中的图片、视频或音频，点击「保存到资产」。</p>}
            {(query || effectiveOwnership) && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setOwnershipFilter('');
                  setSelectedCategory('All');
                }}
              >
                清除筛选
              </button>
            )}
          </div>
        ) : layout === 'list' && !workflow ? (
          <div className="fisher-library-table-wrap">
            <table className="fisher-library-table">
              <thead>
                <tr>
                  <th scope="col" className="fisher-library-select-col">选择</th>
                  <th scope="col">名称</th>
                  <th scope="col">分类</th>
                  <th scope="col">归属</th>
                  <th scope="col">
                    <span className="sr-only">操作</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} data-library-id={item.id} data-selected={selectedIds.includes(item.id) ? 'true' : undefined}>
                    <td className="fisher-library-select-col">
                      <input type="checkbox" aria-label={`选择 ${item.name}`} checked={selectedIds.includes(item.id)} onChange={() => setSelectedIds((old) => old.includes(item.id) ? old.filter((id) => id !== item.id) : [...old, item.id])} />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="fisher-library-list-name"
                        aria-label={`插入资产 ${item.name}`}
                        onClick={() => onSelectAsset(item)}
                      >
                        {preview(item)}
                        <span title={item.name}>{item.name}</span>
                      </button>
                    </td>
                    <td>{categoryOf(item)}</td>
                    <td title={item.ownership || '通用资产'}>{item.ownership || '通用资产'}</td>
                    <td>{confirmation === item.id ? confirmDelete(item) : actions(item)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="fisher-library-grid">
            {filtered.map((item) => (
              <article key={item.id} data-library-id={item.id} data-selected={selectedIds.includes(item.id) ? 'true' : undefined} className="fisher-library-card">
                {!workflow && (
                  <label className="fisher-library-card-select" title={`选择 ${item.name}`}>
                    <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => setSelectedIds((old) => old.includes(item.id) ? old.filter((id) => id !== item.id) : [...old, item.id])} />
                  </label>
                )}
                <button
                  type="button"
                  className="fisher-library-insert"
                  aria-label={`${workflow ? '插入 SKILL' : '插入资产'} ${item.name}`}
                  onClick={() => onSelectAsset(item)}
                >
                  {preview(item)}
                  <span className="fisher-library-name" title={item.name}>
                    {item.name}
                  </span>
                </button>
                <div className="fisher-library-card-info">
                  <span>{categoryOf(item)}</span>
                  {actions(item)}
                </div>
                {!workflow && (
                  <p className="fisher-library-ownership" title={item.ownership || '通用资产'}>
                    归属：{item.ownership || '通用资产'}
                  </p>
                )}
                {confirmDelete(item)}
              </article>
            ))}
          </div>
        )}
      </div>
      <div className="fisher-library-count" role="status">
        {loading
          ? '正在读取资产'
          : `${filtered.length} 项${filtered.length !== assets.length ? ` / 共 ${assets.length} 项` : ''}`}
      </div>
    </div>
  );
}
