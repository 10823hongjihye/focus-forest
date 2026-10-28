import { useState } from 'react';
import { Eye, EyeOff, Leaf } from 'lucide-react';
import { useAuth } from '../context/Auth';

type Mode = 'login' | 'signup' | 'developer';

function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
  placeholder,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  placeholder: string;
  error?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="field">
      <span>{label}</span>
      <span className="password-field">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          autoComplete={autoComplete}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
        />
        <button
          type="button"
          className="password-toggle"
          aria-label={visible ? '비밀번호 숨기기' : '비밀번호 표시'}
          aria-pressed={visible}
          onClick={() => setVisible((shown) => !shown)}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </span>
      {error && (
        <em className="field-error" role="alert">
          {error}
        </em>
      )}
    </label>
  );
}

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
  const confirmMismatch = confirm.length > 0 && confirm !== password;

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
    if (confirm !== password) return;
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
          <PasswordField
            label="비밀번호"
            value={password}
            autoComplete="current-password"
            placeholder="비밀번호"
            onChange={setPassword}
          />
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
          <PasswordField label="비밀번호" value={password} autoComplete="new-password" placeholder="비밀번호" onChange={setPassword} />
          <PasswordField
            label="비밀번호 확인"
            value={confirm}
            autoComplete="new-password"
            placeholder="비밀번호 확인"
            onChange={setConfirm}
            error={confirmMismatch ? '비밀번호가 틀립니다' : undefined}
          />
          <button type="submit" className="btn-primary" disabled={busy || password !== confirm}>
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
          <PasswordField
            label="비밀번호"
            value={password}
            autoComplete="current-password"
            placeholder="개발자 비밀번호"
            onChange={setPassword}
          />
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
