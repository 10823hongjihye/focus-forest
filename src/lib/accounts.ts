const ACCOUNTS_KEY = 'focus-forest-accounts';
const SESSION_KEY = 'focus-forest-session';

/** 개발자 전용 로그인 비밀번호. 이 기기에서만 쓰입니다. */
export const DEVELOPER_PASSWORD = '3435';

export type AccountStatus = 'pending' | 'approved' | 'rejected';

export type Account = {
  id: string;
  email: string;
  nickname: string;
  passwordHash: string;
  /** 예전 가입 코드에만 남아 있을 수 있습니다. 저장할 때 지웁니다. */
  password?: string;
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
    (item.password === undefined || typeof item.password === 'string') &&
    (item.status === 'pending' || item.status === 'approved' || item.status === 'rejected') &&
    typeof item.createdAt === 'number'
  );
}

export function loadAccounts(): Account[] {
  const parsed = readJson(ACCOUNTS_KEY);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(isAccount);
}

export function withoutPassword(account: Account): Account {
  if (account.password === undefined) return account;
  const next = { ...account };
  delete next.password;
  return next;
}

export function saveAccounts(accounts: Account[]): void {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts.map(withoutPassword)));
}

export function samePerson(account: Account, typed: string): boolean {
  const raw = typed.trim();
  const name = normalizeNickname(raw).toLowerCase();
  const mail = raw.toLowerCase();
  return account.nickname.toLowerCase() === name || account.email === mail;
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

/** 메일 링크와, 메일이 안 갔을 때의 가입 코드에 쓰는 계정 정보입니다. */
export function encodeAccountTicket(account: Account): string {
  const bytes = new TextEncoder().encode(JSON.stringify(account));
  return `ff1.${bytesToBase64Url(bytes)}`;
}

export function applyAccountTicket(accounts: Account[], raw: string): { accounts: Account[]; error: string | null; account: Account | null } {
  const account = decodeAccountTicket(raw);
  if (!account) return { accounts, error: '코드를 읽지 못했어요. 코드 전체를 붙여 넣어 주세요.', account: null };
  const same = accounts.find((item) => item.id === account.id);
  if (same) {
    if (same.passwordHash !== account.passwordHash) {
      return { accounts, error: '이 코드는 저장된 계정과 맞지 않아요.', account: null };
    }
    const status: AccountStatus =
      same.status === 'rejected' || account.status === 'rejected'
        ? 'rejected'
        : same.status === 'approved' || account.status === 'approved'
          ? 'approved'
          : 'pending';
    const next = withoutPassword({ ...same, ...account, status, passwordHash: same.passwordHash });
    return {
      accounts: accounts.map((item) => (item.id === account.id ? next : item)),
      error: null,
      account: next,
    };
  }
  if (accounts.some((item) => item.nickname.toLowerCase() === account.nickname.toLowerCase())) {
    return { accounts, error: '이미 있는 닉네임이에요.', account: null };
  }
  if (accounts.some((item) => item.email === account.email)) {
    return { accounts, error: '이미 가입된 이메일이에요.', account: null };
  }
  const clean = withoutPassword(account);
  return {
    accounts: [...accounts, clean].sort((a, b) => a.createdAt - b.createdAt),
    error: null,
    account: clean,
  };
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
