import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  DEVELOPER_PASSWORD,
  applyAccountTicket,
  encodeAccountTicket,
  hashPassword,
  isEmail,
  loadAccounts,
  loadSession,
  normalizeNickname,
  saveAccounts,
  saveSession,
  type Account,
  type Session,
} from '../lib/accounts';
import { publishApprovedId, publishApprovedIds, loadApprovedIds, loadDirectory, mergeDirectory, publishDirectory, removeDirectoryAccount } from '../lib/approvalSync';
import { deliverSignup } from '../lib/signupMail';

type SignupInput = {
  email: string;
  nickname: string;
  password: string;
  confirm: string;
};

export type SignupResult = {
  error: string | null;
  ticket: string | null;
  already: boolean;
  mailed: boolean;
  activate: boolean;
};

type ApprovalResult = {
  ok: boolean;
  needsVerify: boolean;
};

type AuthValue = {
  session: Session | null;
  accounts: Account[];
  linkNotice: string;
  loginUser: (nickname: string, password: string) => Promise<string | null>;
  loginDeveloper: (password: string) => string | null;
  signup: (input: SignupInput) => Promise<SignupResult>;
  importTicket: (raw: string) => string | null;
  approveAccount: (id: string) => Promise<ApprovalResult | null>;
  removeAccount: (id: string) => Promise<ApprovalResult>;
  logout: () => void;
};

const AuthContext = createContext<AuthValue | null>(null);

function newId(): string {
  return `acct-${crypto.randomUUID()}`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => loadSession());
  const [accounts, setAccounts] = useState<Account[]>(() => loadAccounts());
  const [linkNotice, setLinkNotice] = useState('');
  const joined = useRef(false);
  const publishedApprovals = useRef(false);

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
    writeAccounts(result.accounts);
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
      if (stop) return;
      const kept = remote ? accounts.filter((account) => !remote.removed.includes(account.id)) : accounts;
      if (kept.length !== accounts.length) {
        writeAccounts(kept);
        return;
      }
      for (const account of kept) {
        if (account.status === 'pending') void deliverSignup(account);
      }
      if (kept.length > 0) void publishDirectory(kept);
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
      if (stop || !remote) return;
      const merged = mergeDirectory(loadAccounts(), remote);
      if (JSON.stringify(loadAccounts()) !== JSON.stringify(merged)) writeAccounts(merged);
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

  useEffect(() => {
    if (session?.role !== 'developer' || publishedApprovals.current) return;
    void publishDirectory(accounts);
    const ids = accounts.filter((account) => account.status === 'approved').map((account) => account.id);
    if (ids.length === 0) return;
    void publishApprovedIds(ids).then((result) => {
      if (result.ok) publishedApprovals.current = true;
    });
  }, [accounts, session]);

  const enter = useCallback((next: Session) => {
    saveSession(next);
    setSession(next);
  }, []);

  const loginUser = useCallback(
    async (nickname: string, password: string) => {
      const name = normalizeNickname(nickname);
      if (!name || !password) return '닉네임과 비밀번호를 입력해 주세요.';
      const directory = await loadDirectory();
      const removed = directory?.removed ?? [];
      const known = accounts.find((item) => item.nickname.toLowerCase() === name.toLowerCase());
      if (known && removed.includes(known.id)) {
        writeAccounts(accounts.filter((item) => !removed.includes(item.id)));
        return '삭제된 계정이에요. 다시 가입해 주세요.';
      }
      if (removed.length) {
        const kept = accounts.filter((item) => !removed.includes(item.id));
        if (kept.length !== accounts.length) writeAccounts(kept);
      }
      const approvedIds = await loadApprovedIds();
      let list = accounts.filter((item) => !removed.includes(item.id));
      if (approvedIds) {
        let changed = false;
        list = list.map((item) => {
          if (item.status === 'approved' || !approvedIds.includes(item.id)) return item;
          changed = true;
          return { ...item, status: 'approved' as const };
        });
        if (changed) writeAccounts(list);
      }
      const account = list.find((item) => item.nickname.toLowerCase() === name.toLowerCase());
      if (!account) return '계정을 찾지 못했어요. 회원 가입을 먼저 해 주세요.';
      const hash = await hashPassword(account.nickname, password);
      if (hash !== account.passwordHash) return '비밀번호가 맞지 않아요.';
      if (account.status !== 'approved') {
        if (!approvedIds) return '승낙 여부를 확인하지 못했어요. 인터넷을 확인하고 다시 로그인해 주세요.';
        return '아직 승낙 전이에요. 개발자가 확인하면 로그인할 수 있어요.';
      }
      enter({ role: 'user', userId: account.id, nickname: account.nickname });
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
      if (!isEmail(mail)) return { error: '이메일 형식을 확인해 주세요.', ticket: null, already: false, mailed: false, activate: false };
      if (name.length < 2) return { error: '닉네임은 2글자 이상으로 적어 주세요.', ticket: null, already: false, mailed: false, activate: false };
      if (password.length < 4) return { error: '비밀번호는 4자 이상으로 적어 주세요.', ticket: null, already: false, mailed: false, activate: false };
      if (password !== confirm) return { error: '비밀번호 확인이 같지 않아요.', ticket: null, already: false, mailed: false, activate: false };
      const existing = accounts.find((item) => item.nickname.toLowerCase() === name.toLowerCase() || item.email === mail);
      if (existing?.status === 'pending') {
        const sentMail = await deliverSignup(existing);
        return {
          error: null,
          ticket: sentMail.ok ? null : encodeAccountTicket(existing),
          already: true,
          mailed: sentMail.ok,
          activate: sentMail.activate,
        };
      }
      if (existing) {
        const error = existing.email === mail ? '이미 가입된 이메일이에요.' : '이미 있는 닉네임이에요.';
        return { error, ticket: null, already: false, mailed: false, activate: false };
      }
      const account: Account = {
        id: newId(),
        email: mail,
        nickname: name,
        passwordHash: await hashPassword(name, password),
        password,
        status: 'pending',
        createdAt: Date.now(),
      };
      writeAccounts([...accounts, account]);
      const sent = await deliverSignup(account);
      return {
        error: null,
        ticket: sent.ok ? null : encodeAccountTicket(account),
        already: false,
        mailed: sent.ok,
        activate: sent.activate,
      };
    },
    [accounts, writeAccounts],
  );

  const importTicket = useCallback(
    (raw: string) => {
      const result = applyAccountTicket(accounts, raw);
      if (result.error || !result.account) return result.error ?? '코드를 읽지 못했어요.';
      writeAccounts(result.accounts);
      return null;
    },
    [accounts, writeAccounts],
  );

  const approveAccount = useCallback(
    async (id: string) => {
      const current = accounts.find((account) => account.id === id);
      if (!current) return null;
      const next: Account = { ...current, status: 'approved' };
      const nextList = accounts.map((account) => (account.id === id ? next : account));
      writeAccounts(nextList);
      const published = await publishApprovedId(id);
      void publishDirectory(nextList);
      return published;
    },
    [accounts, writeAccounts],
  );

  const removeAccount = useCallback(
    async (id: string) => {
      const removed = await removeDirectoryAccount(id);
      writeAccounts(accounts.filter((account) => account.id !== id));
      return removed;
    },
    [accounts, writeAccounts],
  );

  const logout = useCallback(() => {
    saveSession(null);
    setSession(null);
  }, []);

  const value = useMemo<AuthValue>(
    () => ({ session, accounts, linkNotice, loginUser, loginDeveloper, signup, importTicket, approveAccount, removeAccount, logout }),
    [session, accounts, linkNotice, loginUser, loginDeveloper, signup, importTicket, approveAccount, removeAccount, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('AuthProvider가 필요합니다.');
  return ctx;
}
