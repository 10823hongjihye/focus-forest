import { useState } from 'react';
import { Leaf } from 'lucide-react';
import { useAuth } from '../context/Auth';
import { encodeAccountTicket } from '../lib/accounts';

type Mode = 'login' | 'signup' | 'developer';

function TicketBox({ label, ticket }: { label: string; ticket: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <label className="field">
      <span>{label}</span>
      <textarea className="ticket-code" readOnly rows={3} value={ticket} />
      <button
        type="button"
        className="btn-ghost"
        onClick={() => {
          void navigator.clipboard.writeText(ticket).then(
            () => setCopied(true),
            () => setCopied(false),
          );
        }}
      >
        {copied ? '복사했어요' : '코드 복사'}
      </button>
    </label>
  );
}

export function AuthPage() {
  const { accounts, loginUser, loginDeveloper, signup, importTicket } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [ticket, setTicket] = useState('');
  const [approval, setApproval] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = accounts.filter((account) => account.status === 'pending');

  const reset = (next: Mode) => {
    setMode(next);
    setError('');
    setNotice('');
    setTicket('');
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
    setTicket(result.ticket ?? '');
    setNotice(
      result.already
        ? '이 기기에 이미 가입 신청이 있어요. 아래 코드를 개발자에게 보내 주세요.'
        : '가입 신청을 이 기기에 저장했어요. 아래 코드를 개발자에게 보내 주세요.',
    );
  };

  const applyApproval = () => {
    const message = importTicket(approval);
    if (message) {
      setError(message);
      return;
    }
    setApproval('');
    setError('');
    setNotice('승낙을 반영했어요. 닉네임과 비밀번호로 로그인해 주세요.');
  };

  return (
    <div className="auth-screen">
      <header className="theme-head">
        <span className="leaf-badge">
          <Leaf size={18} />
        </span>
        <h1>{mode === 'signup' ? '회원 가입' : mode === 'developer' ? '개발자 로그인' : '로그인'}</h1>
        <p>
          {mode === 'signup'
            ? '가입하면 이 기기에 코드가 생겨요. 그 코드를 개발자에게 보내 주세요.'
            : mode === 'developer'
              ? '비밀번호만 입력하면 개발자 화면으로 들어가요.'
              : '닉네임과 비밀번호로 포커스 포레스트에 들어가요.'}
        </p>
      </header>

      {notice && <p className="auth-notice">{notice}</p>}
      {error && <p className="auth-error" role="alert">{error}</p>}
      {mode === 'login' && pending.length > 0 && !notice && (
        <p className="muted">이 기기의 가입 신청은 개발자 화면에 자동으로 안 보여요. 아래 코드를 개발자에게 보내 주세요.</p>
      )}
      {mode === 'login' && ticket && <TicketBox label="개발자에게 보낼 가입 코드" ticket={ticket} />}
      {mode === 'login' &&
        pending
          .filter((account) => encodeAccountTicket(account) !== ticket)
          .map((account) => (
            <TicketBox key={account.id} label={`${account.nickname} 가입 코드`} ticket={encodeAccountTicket(account)} />
          ))}

      {mode === 'login' && (
        <form
          className="auth-form"
          onSubmit={(event) => {
            event.preventDefault();
            void submitLogin();
          }}
        >
          <label className="field">
            <span>닉네임</span>
            <input value={nickname} autoComplete="username" onChange={(event) => setNickname(event.target.value)} placeholder="닉네임" />
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
          <label className="field">
            <span>승낙 코드</span>
            <textarea
              className="ticket-code"
              rows={3}
              value={approval}
              onChange={(event) => setApproval(event.target.value)}
              placeholder="개발자가 보내 준 승낙 코드"
            />
          </label>
          <button type="button" className="btn-ghost" onClick={applyApproval}>
            승낙 코드 적용
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
            개발자로 들어가기
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
            개발자 전용 로그인
          </button>
        </div>
      )}
    </div>
  );
}
