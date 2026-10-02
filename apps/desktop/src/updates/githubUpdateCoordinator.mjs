const TERMINAL = new Set(['current', 'ready', 'failed', 'disabled']);

function blankEvent(fields = {}) {
  return {
    revision: 0,
    event: 'progress',
    status: 'checking',
    stage: 'ComparingInstalled',
    completedBytes: 0,
    totalBytes: 0,
    overallPercent: 0,
    version: null,
    title: null,
    summary: null,
    changes: [],
    message: '正在检查更新…',
    ...fields,
  };
}

function releaseChanges(notes) {
  if (!notes) return [];
  const text = Array.isArray(notes)
    ? notes.map((item) => typeof item === 'string' ? item : item?.note || '').join('\n')
    : String(notes);
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim())
    .filter(Boolean)
    .slice(0, 12);
}

function releaseTitle(info) {
  return String(info?.releaseName || info?.version ? `AIFISHER ${info.releaseName || info.version}` : '发现新版本');
}

export function createGithubUpdateCoordinator({ autoUpdater, packaged, currentVersion }) {
  let latest = blankEvent();
  let checking = null;
  let applying = false;
  let revision = 0;
  const listeners = new Set();
  const waiters = new Set();

  const copy = (event) => ({ ...event, changes: [...(event.changes || [])] });
  const emit = (event) => {
    latest = { ...event, revision: ++revision };
    for (const listener of [...listeners]) {
      try { listener(copy(latest)); } catch {}
    }
    if (TERMINAL.has(latest.status)) {
      for (const resolve of [...waiters]) resolve(copy(latest));
      waiters.clear();
    }
    return copy(latest);
  };

  const finishAfterEvents = () => new Promise((resolve) => waiters.add(resolve));

  if (packaged && autoUpdater) {
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.allowPrerelease = false;

    autoUpdater.on('checking-for-update', () => {
      emit(blankEvent({ message: '正在检查 GitHub Release 新版本…' }));
    });
    autoUpdater.on('update-available', (info) => {
      emit(blankEvent({
        version: String(info?.version || ''),
        title: releaseTitle(info),
        summary: '发现新版本，正在下载安装包…',
        changes: releaseChanges(info?.releaseNotes),
        message: '发现新版本，正在下载安装包…',
      }));
    });
    autoUpdater.on('update-not-available', () => {
      emit(blankEvent({
        event: 'complete',
        status: 'current',
        overallPercent: 100,
        version: String(currentVersion || ''),
        title: '当前已是最新版本',
        summary: '没有发现可用更新。',
        message: '当前已是最新版本。',
      }));
    });
    autoUpdater.on('download-progress', (progress) => {
      const total = Number(progress?.total) || 0;
      const transferred = Number(progress?.transferred) || 0;
      const percent = Math.max(0, Math.min(100, Math.round(Number(progress?.percent) || 0)));
      emit(blankEvent({
        stage: 'Downloading',
        completedBytes: transferred,
        totalBytes: total,
        overallPercent: percent,
        version: latest.version,
        title: latest.title,
        summary: latest.summary,
        changes: latest.changes,
        message: total > 0
          ? `正在下载更新… ${(transferred / 1024 / 1024).toFixed(1)} / ${(total / 1024 / 1024).toFixed(1)} MB`
          : '正在下载更新…',
      }));
    });
    autoUpdater.on('update-downloaded', (info) => {
      const changes = releaseChanges(info?.releaseNotes);
      emit(blankEvent({
        event: 'complete',
        status: 'ready',
        stage: 'VerifyingCandidate',
        completedBytes: latest.totalBytes,
        totalBytes: latest.totalBytes,
        overallPercent: 100,
        version: String(info?.version || latest.version || ''),
        title: releaseTitle(info),
        summary: '更新已下载完成，可以立即重启安装。',
        changes: changes.length ? changes : latest.changes,
        message: '更新已下载完成，可以立即重启安装。',
      }));
    });
    autoUpdater.on('error', (error) => {
      emit(blankEvent({
        event: 'complete',
        status: 'failed',
        message: error instanceof Error ? `更新失败：${error.message}` : '更新检查失败。',
      }));
    });
  }

  async function prepare({ force = false } = {}) {
    if (!packaged || !autoUpdater) {
      return emit(blankEvent({
        event: 'complete',
        status: 'disabled',
        message: '开发模式不检查在线更新。',
      }));
    }
    if (!force && latest.status === 'ready') return copy(latest);
    if (checking) return checking;
    checking = (async () => {
      const settled = finishAfterEvents();
      try {
        await autoUpdater.checkForUpdates();
        return await settled;
      } catch (error) {
        waiters.clear();
        return emit(blankEvent({
          event: 'complete',
          status: 'failed',
          message: error instanceof Error ? `更新检查失败：${error.message}` : '更新检查失败。',
        }));
      } finally {
        checking = null;
      }
    })();
    return checking;
  }

  async function apply({ beforeHandoff, afterFailedHandoff } = {}) {
    if (!packaged || !autoUpdater) throw new Error('当前环境不支持在线更新。');
    if (latest.status !== 'ready') throw new Error('更新尚未下载完成。');
    if (applying) return copy(latest);
    applying = true;
    if (beforeHandoff && !(await Promise.resolve().then(beforeHandoff).catch(() => false))) {
      applying = false;
      throw new Error('本机服务未能在更新前安全停止。');
    }
    const applyingEvent = emit({
      ...latest,
      event: 'complete',
      status: 'applying',
      overallPercent: 100,
      message: '正在退出并安装新版本…',
    });
    try {
      setTimeout(() => autoUpdater.quitAndInstall(false, true), 150);
      return applyingEvent;
    } catch (error) {
      applying = false;
      try { await afterFailedHandoff?.(); } catch {}
      throw error;
    }
  }

  return {
    status: () => copy(latest),
    prepare,
    apply,
    source: async () => ({ directory: null, enabled: false, provider: 'github' }),
    setSource: async () => {
      throw new Error('当前版本使用 GitHub Releases 正式更新源。');
    },
    onProgress(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
