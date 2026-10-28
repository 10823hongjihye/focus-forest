import { withoutPassword, type Account, type AccountStatus } from './accounts';

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
    (item.status === 'pending' || item.status === 'approved' || item.status === 'rejected') &&
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

function cleanDirectory(accounts: Account[]): Account[] {
  return accounts.map((account) => withoutPassword(account));
}

/** 목록에 없는 계정만 추가합니다. 이미 있는 계정의 승인 상태와 비밀번호 해시는 바꾸지 않습니다. */
export async function publishIfAbsent(account: Account): Promise<ApprovalWrite> {
  const remote = await loadDirectory();
  if (!remote) return { ok: false, needsVerify: false };
  if (remote.removed.includes(account.id) || remote.accounts.some((item) => item.id === account.id)) {
    return { ok: true, needsVerify: false };
  }
  const saved = await saveDirectory({
    accounts: [...cleanDirectory(remote.accounts), withoutPassword(account)],
    removed: remote.removed,
  });
  if (!saved.ok || account.status !== 'approved') return saved;
  return publishApprovedId(account.id);
}

/** 관리자가 누른 승인 또는 거절만 공유 목록에 기록합니다. */
export async function writeAccountStatus(account: Account, status: AccountStatus): Promise<ApprovalWrite> {
  const remote = await loadDirectory();
  if (!remote) return { ok: false, needsVerify: false };
  const existing = remote.accounts.find((item) => item.id === account.id);
  const next = withoutPassword({ ...(existing ?? account), ...withoutPassword(account), status, passwordHash: existing?.passwordHash ?? account.passwordHash });
  const accounts = existing
    ? remote.accounts.map((item) => (item.id === account.id ? next : withoutPassword(item)))
    : [...cleanDirectory(remote.accounts), next];
  const saved = await saveDirectory({
    accounts,
    removed: remote.removed.filter((id) => id !== account.id),
  });
  if (!saved.ok) return saved;
  if (status === 'approved') return publishApprovedId(account.id);
  return revokeApprovedId(account.id);
}

export async function removeDirectoryAccount(id: string): Promise<ApprovalWrite> {
  const remote = await loadDirectory();
  if (!remote) return { ok: false, needsVerify: false };
  const removed = [...new Set([...remote.removed, id])];
  const saved = await saveDirectory({
    accounts: cleanDirectory(remote.accounts.filter((account) => account.id !== id)),
    removed,
  });
  if (!saved.ok) return saved;
  return revokeApprovedId(id);
}
