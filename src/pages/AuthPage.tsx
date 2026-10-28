import { useState } from 'react';
import { Leaf } from 'lucide-react';
import { useAuth } from '../context/Auth';

type Mode = 'login' | 'signup' | 'developer';

export function AuthPage() {
  const { loginUser, loginDeveloper, signup, linkNotice } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const reset = (next: Mode) => {
    setMode(next);
    setError('');
    setNotice('');
    setPassword('');
    setConfirm('');
  };

  const submitLogin = async () => {
    setBusy(true);
    setError('');
    const message = await loginUser(nickname, password);
    setBusy(false);
    if (message) setError(message);
  };

  const submitDeveloper = () => {
    setError('');
    const message = loginDeveloper(password);
    if (message) setError(message);
  };

  const submitSignup = async () => {
    setBusy(true);
    setError('');
    const result = await signup({ email, nickname, password, confirm });
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setNickname('');
    setEmail('');
    setPassword('');
    setConfirm('');
    setMode('login');
    setNotice(
      result.synced
        ? '가입 신청을 보냈어요. 관리자가 승인하면 여기서 로그인할 수 있어요.'
        : '가입 신청은 이 폰에 저장됐어요. 관리자 목록과 연결되지 않았으면 잠시 후 다시 열어 주세요.',
    );
  };

  return (
    <div className="auth-screen">
      <header className="theme-head">
        <span className="leaf-badge">
          <Leaf size={18} />
        </span>
        <h1>{mode === 'signup' ? '회원 가입' : mode === 'developer' ? '관리자 로그인' : '로그인'}</h1>
        <p>
          {mode === 'signup'
            ? '가입하면 승인 대기가 돼요. 관리자가 승인하면 로그인할 수 있어요.'
            : mode === 'developer'
              ? '관리자 화면에서 가입 신청을 승인하거나 거절해요.'
              : '닉네임 또는 이메일과 비밀번호로 들어가요.'}
        </p>
      </header>

      {notice && <p className="auth-notice">{notice}</p>}
      {error && <p className="auth-error" role="alert">{error}</p>}
      {linkNotice && <p className="auth-notice">{linkNotice}</p>}

      {mode === 'login' && (
        <form
          className="auth-form"
          onSubmit={(event) => {
            event.preventDefault();
            void submitLogin();
          }}
        >
          <label className="field">
            <span>닉네임 또는 이메일</span>
            <input value={nickname} autoComplete="username" onChange={(event) => setNickname(event.target.value)} placeholder="닉네임 또는 이메일" />
          </label>
          <label className="field">
            <span>비밀번호</span>
            <input
              type="password"
              value={password}
              autoComplete="current-password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="비밀번호"
            />
          </label>
          <button type="submit" className="btn-primary" disabled={busy}>
            로그인
          </button>
        </form>
      )}

      {mode === 'signup' && (
        <form
          className="auth-form"
          onSubmit={(event) => {
            event.preventDefault();
            void submitSignup();
          }}
        >
          <label className="field">
            <span>이메일</span>
            <input type="email" value={email} autoComplete="email" onChange={(event) => setEmail(event.target.value)} placeholder="이메일" />
          </label>
          <label className="field">
            <span>닉네임</span>
            <input value={nickname} autoComplete="nickname" onChange={(event) => setNickname(event.target.value)} placeholder="닉네임" />
          </label>
          <label className="field">
            <span>비밀번호</span>
            <input
              type="password"
              value={password}
              autoComplete="new-password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="비밀번호"
            />
          </label>
          <label className="field">
            <span>비밀번호 확인</span>
            <input
              type="password"
              value={confirm}
              autoComplete="new-password"
              onChange={(event) => setConfirm(event.target.value)}
              placeholder="비밀번호 확인"
            />
          </label>
          <button type="submit" className="btn-primary" disabled={busy}>
            가입 신청
          </button>
          <button type="button" className="btn-ghost wide" onClick={() => reset('login')}>
            로그인으로 돌아가기
          </button>
        </form>
      )}

      {mode === 'developer' && (
        <form
          className="auth-form"
          onSubmit={(event) => {
            event.preventDefault();
            submitDeveloper();
          }}
        >
          <label className="field">
            <span>비밀번호</span>
            <input
              type="password"
              value={password}
              autoComplete="current-password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="개발자 비밀번호"
            />
          </label>
          <button type="submit" className="btn-primary">
            관리자 화면으로 들어가기
          </button>
          <button type="button" className="btn-ghost wide" onClick={() => reset('login')}>
            로그인으로 돌아가기
          </button>
        </form>
      )}

      {mode === 'login' && (
        <div className="auth-actions">
          <button type="button" className="btn-ghost wide" onClick={() => reset('signup')}>
            회원 가입을 하시겠습니까?
          </button>
          <button type="button" className="text-btn" onClick={() => reset('developer')}>
            관리자 로그인
          </button>
        </div>
      )}
    </div>
  );
}
