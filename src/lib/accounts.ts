const ACCOUNTS_KEY = 'focus-forest-accounts';
const SESSION_KEY = 'focus-forest-session';

/** 개발자 전용 로그인 비밀번호. 이 기기에서만 쓰입니다. */
export const DEVELOPER_PASSWORD = '3435';

export type AccountStatus = 'pending' | 'approved';

export type Account = {
  id: string;
  email: string;
  nickname: string;
  passwordHash: string;
  status: AccountStatus;
  createdAt: number;
};

export type Session =
  | { role: 'developer' }
  | { role: 'user'; userId: string; nickname: string };

function readJson(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function isAccount(value: unknown): value is Account {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Account;
  return (
    typeof item.id === 'string' &&
    typeof item.email === 'string' &&
    typeof item.nickname === 'string' &&
    typeof item.passwordHash === 'string' &&
    (item.status === 'pending' || item.status === 'approved') &&
    typeof item.createdAt === 'number'
  );
}

export function loadAccounts(): Account[] {
  const parsed = readJson(ACCOUNTS_KEY);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(isAccount);
}

export function saveAccounts(accounts: Account[]): void {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function loadSession(): Session | null {
  const parsed = readJson(SESSION_KEY);
  if (typeof parsed !== 'object' || parsed === null) return null;
  const session = parsed as Session;
  if (session.role === 'developer') return { role: 'developer' };
  if (session.role === 'user' && typeof session.userId === 'string' && typeof session.nickname === 'string') {
    const account = loadAccounts().find((item) => item.id === session.userId && item.status === 'approved');
    if (!account) return null;
    return { role: 'user', userId: account.id, nickname: account.nickname };
  }
  return null;
}

export function saveSession(session: Session | null): void {
  if (!session) {
    localStorage.removeItem(SESSION_KEY);
    return;
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export async function hashPassword(nickname: string, password: string): Promise<string> {
  const data = new TextEncoder().encode(`focus-forest:${nickname.trim().toLowerCase()}:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function normalizeNickname(value: string): string {
  return value.trim().replace(/\s+/g, ' ').slice(0, 20);
}

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
