import { type Account, type AccountStatus } from './accounts';

const APPROVAL_URL = 'https://kvdb.io/EJrkyDzAwMWk4jTBYzmN4P/approved';
const DIRECTORY_URL = 'https://kvdb.io/EJrkyDzAwMWk4jTBYzmN4P/directory';

export type AccountDirectory = {
  accounts: Account[];
  removed: string[];
};

export type ApprovalWrite = {
  ok: boolean;
  needsVerify: boolean;
};

function readIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((id): id is string => typeof id === 'string' && id.startsWith('acct-'));
}

export async function loadApprovedIds(): Promise<string[] | null> {
  try {
    const response = await fetch(APPROVAL_URL, { cache: 'no-store' });
    if (response.status === 404) return [];
    if (!response.ok) return null;
    const parsed: unknown = JSON.parse(await response.text());
    return readIds(parsed);
  } catch {
    return null;
  }
}

async function saveApprovedIds(ids: string[]): Promise<ApprovalWrite> {
  try {
    const response = await fetch(APPROVAL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(ids),
    });
    if (response.ok) return { ok: true, needsVerify: false };
    const text = await response.text();
    return { ok: false, needsVerify: /not verified/i.test(text) };
  } catch {
    return { ok: false, needsVerify: false };
  }
}

export async function publishApprovedId(id: string): Promise<ApprovalWrite> {
  const current = await loadApprovedIds();
  if (!current) return { ok: false, needsVerify: false };
  if (current.includes(id)) return { ok: true, needsVerify: false };
  const saved = await saveApprovedIds([...current, id]);
  if (!saved.ok) return saved;
  const check = await loadApprovedIds();
  return { ok: Boolean(check?.includes(id)), needsVerify: false };
}

export async function publishApprovedIds(ids: string[]): Promise<ApprovalWrite> {
  const current = await loadApprovedIds();
  if (!current) return { ok: false, needsVerify: false };
  const merged = [...new Set([...current, ...ids])];
  if (merged.length === current.length) return { ok: true, needsVerify: false };
  return saveApprovedIds(merged);
}

export async function revokeApprovedId(id: string): Promise<ApprovalWrite> {
  const current = await loadApprovedIds();
  if (!current) return { ok: false, needsVerify: false };
  if (!current.includes(id)) return { ok: true, needsVerify: false };
  return saveApprovedIds(current.filter((item) => item !== id));
}

function isDirectoryAccount(value: unknown): value is Account {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Account;
  return (
    typeof item.id === 'string' &&
    typeof item.email === 'string' &&
    typeof item.nickname === 'string' &&
    typeof item.passwordHash === 'string' &&
    (item.password === undefined || typeof item.password === 'string') &&
    (item.status === 'pending' || item.status === 'approved') &&
    typeof item.createdAt === 'number'
  );
}

export async function loadDirectory(): Promise<AccountDirectory | null> {
  try {
    const response = await fetch(DIRECTORY_URL, { cache: 'no-store' });
    if (response.status === 404) return { accounts: [], removed: [] };
    if (!response.ok) return null;
    const parsed = JSON.parse(await response.text()) as { accounts?: unknown; removed?: unknown };
    const accounts = Array.isArray(parsed.accounts) ? parsed.accounts.filter(isDirectoryAccount) : [];
    const removed = Array.isArray(parsed.removed) ? parsed.removed.filter((id): id is string => typeof id === 'string') : [];
    return { accounts, removed };
  } catch {
    return null;
  }
}

async function saveDirectory(directory: AccountDirectory): Promise<ApprovalWrite> {
  try {
    const response = await fetch(DIRECTORY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(directory),
    });
    if (response.ok) return { ok: true, needsVerify: false };
    const text = await response.text();
    return { ok: false, needsVerify: /not verified/i.test(text) };
  } catch {
    return { ok: false, needsVerify: false };
  }
}

export function mergeDirectory(local: Account[], remote: AccountDirectory): Account[] {
  const removed = new Set(remote.removed);
  const byId = new Map<string, Account>();
  for (const account of remote.accounts) {
    if (!removed.has(account.id)) byId.set(account.id, account);
  }
  for (const account of local) {
    if (removed.has(account.id)) continue;
    const prev = byId.get(account.id);
    if (!prev) {
      byId.set(account.id, account);
      continue;
    }
    const status: AccountStatus = prev.status === 'approved' || account.status === 'approved' ? 'approved' : 'pending';
    byId.set(account.id, { ...prev, ...account, status, password: account.password || prev.password });
  }
  return [...byId.values()].sort((a, b) => a.createdAt - b.createdAt);
}

const pendingRemovals = new Set<string>();

export async function publishDirectory(local: Account[]): Promise<ApprovalWrite> {
  const remote = await loadDirectory();
  if (!remote) return { ok: false, needsVerify: false };
  const removed = [...new Set([...remote.removed, ...pendingRemovals])];
  const accounts = mergeDirectory(local, { ...remote, removed });
  const same =
    accounts.length === remote.accounts.length &&
    removed.length === remote.removed.length &&
    accounts.every((account) => {
      const prev = remote.accounts.find((item) => item.id === account.id);
      return prev && prev.status === account.status && prev.password === account.password && prev.email === account.email;
    });
  if (same) return { ok: true, needsVerify: false };
  return saveDirectory({ accounts, removed });
}

export async function removeDirectoryAccount(id: string): Promise<ApprovalWrite> {
  pendingRemovals.add(id);
  const remote = await loadDirectory();
  if (!remote) return { ok: false, needsVerify: false };
  const removed = [...new Set([...remote.removed, ...pendingRemovals])];
  const saved = await saveDirectory({
    accounts: remote.accounts.filter((account) => !removed.includes(account.id)),
    removed,
  });
  if (!saved.ok) return saved;
  return revokeApprovedId(id);
}
