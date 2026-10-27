import { useEffect, useState } from 'react';
import { Bell, Play } from 'lucide-react';
import { Bear, Spark } from '../components/Bear';
import { CheckButton, ProgressRing } from '../components/ui';
import { useAppState } from '../context/AppState';
import { useAuth } from '../context/Auth';
import { useNav } from '../context/nav';
import { useTimer } from '../context/Timer';
import { cx } from '../lib/cx';
import { addDays, formatGoal, formatHMS, formatKoreanDuration, formatPercent, startOfDay, toDateKey } from '../lib/time';
import { useStudiedSeconds } from '../hooks/useStudiedSeconds';

export function HomePage() {
  const { data, toggleTodo } = useAppState();
  const { session, accounts } = useAuth();
  const pendingSignup = session?.role === 'developer' && accounts.some((account) => account.status === 'pending');
  const { snapshot } = useTimer();
  const { go } = useNav();
  const [bellOpen, setBellOpen] = useState(false);
  const today = startOfDay(new Date());
  const todayKey = toDateKey(today);
  const todaySec = useStudiedSeconds(today.getTime(), addDays(today, 1).getTime());
  const goalSec = data.settings.dailyGoalMin * 60;
  const ratio = goalSec > 0 ? todaySec / goalSec : 0;
  const name = data.settings.displayName.trim() || '친구';
  const todos = data.todos
    .filter((todo) => todo.date === todayKey)
    .sort((a, b) => Number(a.done) - Number(b.done) || b.importance - a.importance);
  const preview = todos.slice(0, 3);
  const allDone = todos.length > 0 && todos.every((todo) => todo.done);
  const remain = Math.max(0, goalSec - todaySec);
  const cta = snapshot.status === 'idle' ? '공부 시작하기' : snapshot.status === 'running' ? '집중 이어가기' : '이어서 공부하기';

  useEffect(() => {
    if (!bellOpen) return;
    const close = () => setBellOpen(false);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [bellOpen]);

  return (
    <div className="page home-page">
      <header className="greet">
        <div>
          <h1 className="greet-title">
            <span className="name">안녕하세요, {name}님!</span>
            <Bear character={data.settings.character} crop="face" size={28} />
            <Spark />
          </h1>
          <p>오늘도 함께 공부해요!</p>
        </div>
        <button
          type="button"
          className="icon-btn bell"
          aria-label={pendingSignup ? '알림, 가입 신청이 있어요' : '알림'}
          aria-expanded={bellOpen}
          onClick={(event) => {
            event.stopPropagation();
            setBellOpen((open) => !open);
          }}
        >
          <Bell size={18} />
          {pendingSignup && <span className="bell-dot" aria-hidden />}
        </button>
        {bellOpen && (
          <div className="popover" onClick={(event) => event.stopPropagation()}>
            <strong>오늘의 알림</strong>
            <p>{ratio >= 1 ? '오늘의 목표를 채웠어요.' : `목표까지 ${formatKoreanDuration(remain)} 남았어요.`}</p>
            <p className="muted">{data.settings.notifications ? '타이머가 끝나면 알려드릴게요.' : '알림은 아직 꺼져 있어요.'}</p>
            <button type="button" className="text-btn" onClick={() => go('settings')}>
              알림 설정
            </button>
          </div>
        )}
      </header>

      <section className="card time-card">
        <div>
          <p className="kicker">오늘의 순공시간</p>
          <p className="clock">{formatHMS(todaySec)}</p>
          <p className="goal">목표 {formatGoal(data.settings.dailyGoalMin)}</p>
        </div>
        <ProgressRing value={todaySec > 0 ? Math.max(ratio, 0.03) : 0} label={formatPercent(todaySec, goalSec)} />
      </section>

      <section className="card">
        <div className="card-head">
          <button type="button" className="text-title" onClick={() => go('todo')}>
            오늘의 할 일 요약
          </button>
          <span className={cx('mini-check', allDone && 'is-on')} aria-hidden>
            <svg width="14" height="14" viewBox="0 0 14 14">
              <path d="M3 7.2 5.6 10 11 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </span>
        </div>
        {preview.length === 0 ? (
          <p className="muted">할 일을 추가하면 여기에 보여요.</p>
        ) : (
          <ul className="todo-mini">
            {preview.map((todo) => (
              <li key={todo.id}>
                <CheckButton on={todo.done} label={todo.done ? `${todo.title} 완료 취소` : `${todo.title} 완료`} onClick={() => toggleTodo(todo.id)} />
                <span className={cx('todo-line', todo.done && 'is-done')}>{todo.title}</span>
              </li>
            ))}
          </ul>
        )}
        {todos.length > 3 && (
          <button type="button" className="text-btn" onClick={() => go('todo')}>
            외 {todos.length - 3}개 더 보기
          </button>
        )}
      </section>

      <button type="button" className="btn-primary start-btn" onClick={() => go('study', 'focus')}>
        <Play size={18} fill="currentColor" />
        {cta}
      </button>
    </div>
  );
}
