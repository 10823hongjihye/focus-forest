import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  DEVELOPER_PASSWORD,
  applyAccountTicket,
  hashPassword,
  isEmail,
  loadAccounts,
  loadSession,
  normalizeNickname,
  samePerson,
  saveAccounts,
  saveSession,
  withoutPassword,
  type Account,
  type AccountStatus,
  type Session,
} from '../lib/accounts';
import { loadDirectory, markNoticesSeen, publishIfAbsent, removeDirectoryAccount, writeAccountStatus } from '../lib/approvalSync';

type SignupInput = {
  email: string;
  nickname: string;
  password: string;
  confirm: string;
};

export type SignupResult = {
  error: string | null;
  synced: boolean;
};

type ApprovalResult = {
  ok: boolean;
  needsVerify: boolean;
};

type AuthValue = {
  session: Session | null;
  accounts: Account[];
  linkNotice: string;
  syncNotice: string;
  seenNoticeIds: string[];
  approvalFocus: boolean;
  markNoticeRead: (id: string) => void;
  requestApprovalFocus: () => void;
  clearApprovalFocus: () => void;
  loginUser: (nickname: string, password: string) => Promise<string | null>;
  loginDeveloper: (password: string) => string | null;
  signup: (input: SignupInput) => Promise<SignupResult>;
  importTicket: (raw: string) => string | null;
  approveAccount: (id: string) => Promise<ApprovalResult | null>;
  rejectAccount: (id: string) => Promise<ApprovalResult | null>;
  removeAccount: (id: string) => Promise<ApprovalResult>;
  logout: () => void;
};

const AuthContext = createContext<AuthValue | null>(null);
const NOTICE_SEEN_KEY = 'focus-forest-notice-seen';

function loadSeenIds(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(NOTICE_SEEN_KEY) ?? '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === 'string' && id.startsWith('acct-'));
  } catch {
    return [];
  }
}

function saveSeenIds(ids: string[]): void {
  localStorage.setItem(NOTICE_SEEN_KEY, JSON.stringify(ids));
}

function newId(): string {
  return `acct-${crypto.randomUUID()}`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => loadSession());
  const [accounts, setAccounts] = useState<Account[]>(() => loadAccounts());
  const [linkNotice, setLinkNotice] = useState('');
  const [syncNotice, setSyncNotice] = useState('');
  const [seenNoticeIds, setSeenNoticeIds] = useState<string[]>(() => loadSeenIds());
  const [approvalFocus, setApprovalFocus] = useState(false);
  const joined = useRef(false);

  const writeAccounts = useCallback((next: Account[]) => {
    setAccounts(next);
    saveAccounts(next);
  }, []);

  useEffect(() => {
    if (joined.current) return;
    const url = new URL(window.location.href);
    const raw = url.searchParams.get('join');
    if (!raw) return;
    joined.current = true;
    url.searchParams.delete('join');
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
    const result = applyAccountTicket(loadAccounts(), raw);
    if (result.error || !result.account) {
      setLinkNotice(result.error ?? '가입 링크를 읽지 못했어요.');
      return;
    }
    writeAccounts(result.accounts.map(withoutPassword));
    void publishIfAbsent(result.account);
    setLinkNotice(
      result.account.status === 'approved'
        ? '승낙되었어요. 닉네임과 비밀번호로 로그인해 주세요.'
        : `${result.account.nickname} 님의 가입 신청을 가져왔어요. 설정 > 계정에서 승낙할 수 있어요.`,
    );
  }, [writeAccounts]);

  useEffect(() => {
    if (session?.role === 'developer') return;
    let stop = false;
    void (async () => {
      const remote = await loadDirectory();
      if (stop || !remote) return;
      let changed = false;
      const next = accounts.flatMap((account) => {
        if (remote.removed.includes(account.id)) {
          changed = true;
          return [];
        }
        const found = remote.accounts.find((item) => item.id === account.id);
        if (!found || found.status === account.status) return [withoutPassword(account)];
        changed = true;
        return [{ ...withoutPassword(account), status: found.status }];
      });
      if (
        session?.role === 'user' &&
        (remote.removed.includes(session.userId) ||
          remote.accounts.some((account) => account.id === session.userId && account.status !== 'approved'))
      ) {
        saveSession(null);
        setSession(null);
      }
      if (changed) {
        writeAccounts(next);
        return;
      }
      for (const account of next) {
        if (!remote.accounts.some((item) => item.id === account.id)) void publishIfAbsent(account);
      }
    })();
    return () => {
      stop = true;
    };
  }, [accounts, session, writeAccounts]);

  useEffect(() => {
    if (session?.role !== 'developer') return;
    let stop = false;
    const sync = async () => {
      if (document.hidden) return;
      const remote = await loadDirectory();
      if (stop) return;
      if (!remote) {
        setSyncNotice('승인 목록을 불러오지 못했어요. 인터넷을 확인해 주세요.');
        return;
      }
      const local = loadAccounts().map(withoutPassword);
      let notice = '';
      for (const account of local) {
        if (remote.removed.includes(account.id) || remote.accounts.some((item) => item.id === account.id)) continue;
        const published = await publishIfAbsent(account);
        if (stop) return;
        if (published.needsVerify) {
          notice = '다른 폰과 승인을 맞추려면 지메일로 온 kvdb 확인 메일을 한 번 열어 주세요. 가입 신청 메일은 더 이상 보내지 않아요.';
          break;
        }
        if (!published.ok) {
          notice = '승인 목록을 저장하지 못했어요. 잠시 후 다시 열어 주세요.';
          break;
        }
      }
      const again = notice ? remote : await loadDirectory();
      if (stop || !again) return;
      const seen = new Set(again.accounts.map((account) => account.id));
      const extras = local.filter((account) => !seen.has(account.id) && !again.removed.includes(account.id));
      const visible = [...again.accounts.map(withoutPassword), ...extras].sort((a, b) => a.createdAt - b.createdAt);
      if (JSON.stringify(local) !== JSON.stringify(visible)) writeAccounts(visible);
      setSeenNoticeIds((current) => {
        const merged = [...new Set([...current, ...again.seen])];
        if (merged.length === current.length && merged.every((id) => current.includes(id))) return current;
        saveSeenIds(merged);
        return merged;
      });
      setSyncNotice(notice);
    };
    void sync();
    const timer = window.setInterval(() => void sync(), 12000);
    window.addEventListener('visibilitychange', sync);
    return () => {
      stop = true;
      window.clearInterval(timer);
      window.removeEventListener('visibilitychange', sync);
    };
  }, [session, writeAccounts]);

  const enter = useCallback((next: Session) => {
    saveSession(next);
    setSession(next);
  }, []);

  const loginUser = useCallback(
    async (nickname: string, password: string) => {
      const typed = nickname.trim();
      if (!typed || !password) return '닉네임과 비밀번호를 입력해 주세요.';
      const directory = await loadDirectory();
      const local = accounts.find((item) => samePerson(item, typed));
      const remote = directory?.accounts.find((item) => samePerson(item, typed));
      const account = local ?? remote;
      if (!account) {
        if (!directory) return '계정을 확인하지 못했어요. 인터넷을 확인하고 다시 로그인해 주세요.';
        return '계정을 찾지 못했어요. 회원 가입을 먼저 해 주세요.';
      }
      const hash = await hashPassword(account.nickname, password);
      if (hash !== (local?.passwordHash ?? account.passwordHash)) return '비밀번호가 맞지 않아요.';
      if (directory?.removed.includes(account.id)) {
        writeAccounts(accounts.filter((item) => item.id !== account.id).map(withoutPassword));
        return '삭제된 계정이에요. 다시 가입해 주세요.';
      }
      const status = remote?.status ?? local?.status ?? 'pending';
      if (!remote && !directory && local?.status !== 'approved') {
        return '승인 상태를 확인하지 못했어요. 인터넷을 확인하고 다시 로그인해 주세요.';
      }
      if (status === 'rejected') return '가입이 거절되어 로그인할 수 없어요.';
      if (status !== 'approved') return '아직 승인 전이에요. 관리자가 승인하면 로그인할 수 있어요.';
      const stored = withoutPassword({ ...(local ?? account), status: 'approved' });
      const exists = accounts.some((item) => item.id === stored.id);
      writeAccounts(exists ? accounts.map((item) => (item.id === stored.id ? stored : withoutPassword(item))) : [...accounts.map(withoutPassword), stored]);
      enter({ role: 'user', userId: stored.id, nickname: stored.nickname });
      return null;
    },
    [accounts, enter, writeAccounts],
  );

  const loginDeveloper = useCallback(
    (password: string) => {
      if (password !== DEVELOPER_PASSWORD) return '개발자 비밀번호가 맞지 않아요.';
      enter({ role: 'developer' });
      return null;
    },
    [enter],
  );

  const signup = useCallback(
    async ({ email, nickname, password, confirm }: SignupInput): Promise<SignupResult> => {
      const mail = email.trim().toLowerCase();
      const name = normalizeNickname(nickname);
      if (!isEmail(mail)) return { error: '이메일 형식을 확인해 주세요.', synced: false };
      if (name.length < 2) return { error: '닉네임은 2글자 이상으로 적어 주세요.', synced: false };
      if (password.length < 4) return { error: '비밀번호는 4자 이상으로 적어 주세요.', synced: false };
      if (password !== confirm) return { error: '비밀번호 확인이 같지 않아요.', synced: false };
      const directory = await loadDirectory();
      const known = [...accounts, ...(directory?.accounts ?? [])].find(
        (item) => !directory?.removed.includes(item.id) && (item.nickname.toLowerCase() === name.toLowerCase() || item.email === mail),
      );
      if (known?.status === 'pending') return { error: '이미 승인 대기 중이에요. 관리자가 승인하면 로그인할 수 있어요.', synced: false };
      if (known?.status === 'rejected') return { error: '이 계정은 가입이 거절되었어요.', synced: false };
      if (known) return { error: known.email === mail ? '이미 가입된 이메일이에요.' : '이미 있는 닉네임이에요.', synced: false };
      const account: Account = {
        id: newId(),
        email: mail,
        nickname: name,
        passwordHash: await hashPassword(name, password),
        status: 'pending',
        createdAt: Date.now(),
      };
      writeAccounts([...accounts.map(withoutPassword), account]);
      const published = await publishIfAbsent(account);
      if (published.needsVerify) setSyncNotice('가입은 이 폰에 저장됐어요. 다른 폰의 관리자 목록에 연결하려면 kvdb 확인 메일을 한 번 열어 주세요.');
      return { error: null, synced: published.ok };
    },
    [accounts, writeAccounts],
  );

  const importTicket = useCallback(
    (raw: string) => {
      const result = applyAccountTicket(accounts, raw);
      if (result.error || !result.account) return result.error ?? '코드를 읽지 못했어요.';
      writeAccounts(result.accounts.map(withoutPassword));
      void publishIfAbsent(result.account);
      return null;
    },
    [accounts, writeAccounts],
  );

  const setStatus = useCallback(
    async (id: string, status: AccountStatus) => {
      const current = accounts.find((account) => account.id === id);
      if (!current) return null;
      const nextList = accounts.map((account) => (account.id === id ? withoutPassword({ ...account, status }) : withoutPassword(account)));
      writeAccounts(nextList);
      const published = await writeAccountStatus(current, status);
      if (!published.ok) writeAccounts(accounts.map(withoutPassword));
      if (published.needsVerify) {
        setSyncNotice('승인 상태를 다른 폰에 저장하지 못했어요. 지메일로 온 kvdb 확인 메일을 한 번 열어 주세요.');
      }
      return published;
    },
    [accounts, writeAccounts],
  );

  const approveAccount = useCallback((id: string) => setStatus(id, 'approved'), [setStatus]);
  const rejectAccount = useCallback((id: string) => setStatus(id, 'rejected'), [setStatus]);

  const removeAccount = useCallback(
    async (id: string) => {
      const removed = await removeDirectoryAccount(id);
      if (!removed.ok) {
        if (removed.needsVerify) setSyncNotice('가입 정보를 다른 폰에서 지우지 못했어요. 지메일로 온 kvdb 확인 메일을 한 번 열어 주세요.');
        return removed;
      }
      writeAccounts(accounts.filter((account) => account.id !== id).map(withoutPassword));
      return removed;
    },
    [accounts, writeAccounts],
  );

  const logout = useCallback(() => {
    saveSession(null);
    setSession(null);
  }, []);

  const markNoticeRead = useCallback(
    (id: string) => {
      if (session?.role !== 'developer' || !id.startsWith('acct-')) return;
      setSeenNoticeIds((current) => {
        if (current.includes(id)) return current;
        const next = [...current, id];
        saveSeenIds(next);
        return next;
      });
      void markNoticesSeen([id]);
    },
    [session],
  );

  const requestApprovalFocus = useCallback(() => setApprovalFocus(true), []);
  const clearApprovalFocus = useCallback(() => setApprovalFocus(false), []);

  const value = useMemo<AuthValue>(
    () => ({
      session,
      accounts,
      linkNotice,
      syncNotice,
      seenNoticeIds,
      approvalFocus,
      loginUser,
      loginDeveloper,
      signup,
      importTicket,
      approveAccount,
      rejectAccount,
      removeAccount,
      logout,
      markNoticeRead,
      requestApprovalFocus,
      clearApprovalFocus,
    }),
    [
      session,
      accounts,
      linkNotice,
      syncNotice,
      seenNoticeIds,
      approvalFocus,
      loginUser,
      loginDeveloper,
      signup,
      importTicket,
      approveAccount,
      rejectAccount,
      removeAccount,
      logout,
      markNoticeRead,
      requestApprovalFocus,
      clearApprovalFocus,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('AuthProvider가 필요합니다.');
  return ctx;
}
