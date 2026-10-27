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

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlToBytes(value: string): Uint8Array | null {
  try {
    const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return bytes;
  } catch {
    return null;
  }
}

/** 다른 기기의 가입 신청을 개발자에게 넘기는 코드. 이 브라우저 밖으로는 자동으로 전달되지 않습니다. */
export function encodeAccountTicket(account: Account): string {
  const bytes = new TextEncoder().encode(JSON.stringify(account));
  return `ff1.${bytesToBase64Url(bytes)}`;
}

export function decodeAccountTicket(raw: string): Account | null {
  const token = raw.trim().replace(/\s+/g, '');
  const payload = token.startsWith('ff1.') ? token.slice(4) : token;
  const bytes = base64UrlToBytes(payload);
  if (!bytes) return null;
  try {
    const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
    return isAccount(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
