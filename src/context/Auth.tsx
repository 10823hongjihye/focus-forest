import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import {
  DEVELOPER_PASSWORD,
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

type SignupInput = {
  email: string;
  nickname: string;
  password: string;
  confirm: string;
};

type AuthValue = {
  session: Session | null;
  accounts: Account[];
  loginUser: (nickname: string, password: string) => Promise<string | null>;
  loginDeveloper: (password: string) => string | null;
  signup: (input: SignupInput) => Promise<string | null>;
  approveAccount: (id: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthValue | null>(null);

function newId(): string {
  return `acct-${crypto.randomUUID()}`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => loadSession());
  const [accounts, setAccounts] = useState<Account[]>(() => loadAccounts());

  const writeAccounts = useCallback((next: Account[]) => {
    setAccounts(next);
    saveAccounts(next);
  }, []);

  const enter = useCallback((next: Session) => {
    saveSession(next);
    setSession(next);
  }, []);

  const loginUser = useCallback(
    async (nickname: string, password: string) => {
      const name = normalizeNickname(nickname);
      if (!name || !password) return '닉네임과 비밀번호를 입력해 주세요.';
      const account = accounts.find((item) => item.nickname.toLowerCase() === name.toLowerCase());
      if (!account) return '계정을 찾지 못했어요. 회원 가입을 먼저 해 주세요.';
      const hash = await hashPassword(account.nickname, password);
      if (hash !== account.passwordHash) return '비밀번호가 맞지 않아요.';
      if (account.status !== 'approved') return '아직 승낙 전이에요. 개발자가 확인하면 로그인할 수 있어요.';
      enter({ role: 'user', userId: account.id, nickname: account.nickname });
      return null;
    },
    [accounts, enter],
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
    async ({ email, nickname, password, confirm }: SignupInput) => {
      const mail = email.trim().toLowerCase();
      const name = normalizeNickname(nickname);
      if (!isEmail(mail)) return '이메일 형식을 확인해 주세요.';
      if (name.length < 2) return '닉네임은 2글자 이상으로 적어 주세요.';
      if (password.length < 4) return '비밀번호는 4자 이상으로 적어 주세요.';
      if (password !== confirm) return '비밀번호 확인이 같지 않아요.';
      if (accounts.some((item) => item.nickname.toLowerCase() === name.toLowerCase())) return '이미 있는 닉네임이에요.';
      if (accounts.some((item) => item.email === mail)) return '이미 가입된 이메일이에요.';
      const account: Account = {
        id: newId(),
        email: mail,
        nickname: name,
        passwordHash: await hashPassword(name, password),
        status: 'pending',
        createdAt: Date.now(),
      };
      writeAccounts([...accounts, account]);
      return null;
    },
    [accounts, writeAccounts],
  );

  const approveAccount = useCallback(
    (id: string) => {
      writeAccounts(accounts.map((account) => (account.id === id ? { ...account, status: 'approved' } : account)));
    },
    [accounts, writeAccounts],
  );

  const logout = useCallback(() => {
    saveSession(null);
    setSession(null);
  }, []);

  const value = useMemo<AuthValue>(
    () => ({ session, accounts, loginUser, loginDeveloper, signup, approveAccount, logout }),
    [session, accounts, loginUser, loginDeveloper, signup, approveAccount, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('AuthProvider가 필요합니다.');
  return ctx;
}
