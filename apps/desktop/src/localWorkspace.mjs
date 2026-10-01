import { randomUUID } from 'node:crypto';
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

export async function resolveLocalWorkspaceId({ dataDirectory, preferredId = null } = {}) {
  const preferred = String(preferredId || '').toLowerCase();
  if (UUID.test(preferred)) return preferred;

  const usersDirectory = path.join(dataDirectory, 'users');
  let entries = [];
  try {
    entries = await readdir(usersDirectory, { withFileTypes: true });
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }

  const candidates = [];
  for (const entry of entries) {
    const id = entry.name.toLowerCase();
    if (!entry.isDirectory() || entry.isSymbolicLink() || !UUID.test(id)) continue;
    let modifiedAt = 0;
    try {
      modifiedAt = (await stat(path.join(usersDirectory, entry.name))).mtimeMs;
    } catch {}
    candidates.push({ id, modifiedAt });
  }

  candidates.sort((left, right) => right.modifiedAt - left.modifiedAt || left.id.localeCompare(right.id));
  return candidates[0]?.id || randomUUID();
}
