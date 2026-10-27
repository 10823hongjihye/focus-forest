import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react';
import type { Todo } from '../types';
import { Flower } from '../components/Illustrations';
import { DiaryDecor } from './DiaryDecor';
import { TodoForm } from '../components/TodoForm';
import { CheckButton, Modal } from '../components/ui';
import { useAppState } from '../context/AppState';
import { useTimer } from '../context/Timer';
import { SUBJECTS, WEEKDAYS, categoryLabel, categoryTone } from '../lib/constants';
import { DiaryCanvas } from '../components/DiaryCanvas';
import { cx } from '../lib/cx';
import { addDays, formatDayTitle, formatHMS, isSameDay, monthGrid, startOfDay, startOfWeek, toDateKey } from '../lib/time';
import { totalSeconds } from '../lib/stats';
import { useStudiedSeconds } from '../hooks/useStudiedSeconds';
import { useNav } from '../context/nav';

export function CalendarPage() {
  const { data, addTodo, toggleTodo, deleteTodo, updateTodo, saveDiary, deleteDiary, deleteSession } = useAppState();
  const { snapshot, now } = useTimer();
  const { go } = useNav();
  const today = new Date();
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(() => toDateKey(today));
  const [menu, setMenu] = useState(false);
  const [todoOpen, setTodoOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [diaryOn, setDiaryOn] = useState(false);
  const [draft, setDraft] = useState('');
  const [diaryError, setDiaryError] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [decorating, setDecorating] = useState(false);

  const cells = monthGrid(cursor.getFullYear(), cursor.getMonth());
  const selectedDate = useMemo(() => {
    const [y, m, d] = selected.split('-').map((part) => Number(part));
    return new Date(y || today.getFullYear(), (m || 1) - 1, d || 1);
  }, [selected, today]);
  const dayStart = startOfDay(selectedDate).getTime();
  const dayEnd = addDays(startOfDay(selectedDate), 1).getTime();
  const studied = useStudiedSeconds(dayStart, dayEnd);
  const weekStart = startOfWeek(selectedDate).getTime();
  const weekSec = useStudiedSeconds(weekStart, addDays(startOfWeek(selectedDate), 7).getTime());
  const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1).getTime();
  const monthEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1).getTime();
  const monthSec = useStudiedSeconds(monthStart, monthEnd);
  const diary = data.diaries.find((entry) => entry.date === selected);
  const todos = data.todos.filter((todo) => todo.date === selected);
  const sessions = data.sessions.filter((session) => session.date === selected);

  const categoryParts = useMemo(() => {
    const ids = [...SUBJECTS.map((subject) => subject.id), ...data.categories.map((category) => category.id)];
    return ids
      .map((id) => ({
        id,
        label: categoryLabel(id, data.categories),
        sec: totalSeconds(data.sessions, snapshot, now, dayStart, dayEnd, id),
        tone: categoryTone(id, data.categories),
      }))
      .filter((part) => part.sec > 0);
  }, [data.categories, data.sessions, snapshot, now, dayStart, dayEnd]);
  const weekBars = useMemo(() => {
    const start = startOfWeek(selectedDate);
    return Array.from({ length: 7 }, (_, index) => {
      const day = addDays(start, index);
      const from = day.getTime();
      return totalSeconds(data.sessions, snapshot, now, from, addDays(day, 1).getTime());
    });
  }, [data.sessions, snapshot, now, selectedDate]);

  const logged = useMemo(() => {
    const keys = new Set<string>();
    for (const session of data.sessions) keys.add(session.date);
    for (const entry of data.diaries) keys.add(entry.date);
    for (const todo of data.todos) keys.add(todo.date);
    return keys;
  }, [data.sessions, data.diaries, data.todos]);

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(false);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [menu]);

  const openDiary = () => {
    setDraft(diary?.text ?? '');
    setDiaryError('');
    setDiaryOn(true);
    setMenu(false);
  };

  if (decorating) {
    return <DiaryDecor date={selected} onBack={() => setDecorating(false)} />;
  }

  return (
    <div className="page">
      <header className="cal-head">
        <button type="button" className="icon-btn plain" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} aria-label="이전 달">
          <ChevronLeft size={20} />
        </button>
        <h1>
          {cursor.getFullYear()}년 {cursor.getMonth() + 1}월
        </h1>
        <button type="button" className="icon-btn plain" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} aria-label="다음 달">
          <ChevronRight size={20} />
        </button>
        <button
          type="button"
          className="icon-btn"
          aria-label="기록 추가"
          onClick={(event) => {
            event.stopPropagation();
            setMenu((open) => !open);
          }}
        >
          <Plus size={18} />
        </button>
        {menu && (
          <div className="pop-menu" onClick={(event) => event.stopPropagation()}>
            <button type="button" onClick={openDiary}>한 줄 기록</button>
            <button
              type="button"
              onClick={() => {
                setMenu(false);
                setTodoOpen(true);
              }}
            >
              할 일 추가
            </button>
          </div>
        )}
      </header>

      <div className="cal-week">
        {WEEKDAYS.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="cal-grid">
        {cells.map((day) => {
          const key = toDateKey(day);
          const outside = day.getMonth() !== cursor.getMonth();
          return (
            <button
              key={key + (outside ? '-o' : '')}
              type="button"
              className={cx('cal-cell', outside && 'is-out', isSameDay(day, today) && 'is-today', key === selected && 'is-picked')}
              onClick={() => {
                if (outside) setCursor(new Date(day.getFullYear(), day.getMonth(), 1));
                setSelected(key);
                setDiaryOn(false);
              }}
            >
              <span className="cal-num">{day.getDate()}</span>
              {logged.has(key) && <span className="cal-dot" />}
            </button>
          );
        })}
      </div>

      <div className="row-between day-title">
        <h2>{formatDayTitle(selectedDate)}</h2>
        {isSameDay(selectedDate, today) && <span className="badge">오늘</span>}
      </div>
      <div className="stat-grid">
        <article className="card mini-stat">
          <span>선택일</span>
          <strong className="num">{formatHMS(studied)}</strong>
        </article>
        <article className="card mini-stat">
          <span>이번 주</span>
          <strong className="num">{formatHMS(weekSec)}</strong>
        </article>
        <article className="card mini-stat">
          <span>이번 달</span>
          <strong className="num">{formatHMS(monthSec)}</strong>
        </article>
      </div>
      <section className="card">
        <div className="card-head">
          <h2>카테고리별 공부</h2>
          <div className="row-gap">
            <button type="button" className="text-btn" onClick={() => go('study', 'subjects')}>
              과목 정리
            </button>
            <button type="button" className="text-btn" onClick={() => go('study', 'stats')}>
              시간 통계
            </button>
          </div>
        </div>
        {studied <= 0 ? (
          <p className="muted">이 날은 공부 기록이 없어요.</p>
        ) : (
          <ul className="day-cats">
            {categoryParts.map((part) => (
              <li key={part.id}>
                <span className="tag" style={{ background: part.tone.bg, color: part.tone.fg }}>{part.label}</span>
                <span className="grow day-bar"><i style={{ width: `${Math.max(8, (part.sec / Math.max(studied, 1)) * 100)}%` }} /></span>
                <strong>{formatHMS(part.sec)}</strong>
              </li>
            ))}
          </ul>
        )}
        <div className="week-bars" role="img" aria-label="선택한 주의 공부 시간">
          {weekBars.map((sec, index) => (
            <div key={WEEKDAYS[index]} className="week-col">
              <div className="chart-track">
                <div className="chart-bar" style={{ height: sec > 0 ? Math.max(6, Math.round((sec / Math.max(...weekBars, 1)) * 48)) : 0 }} />
              </div>
              <span>{WEEKDAYS[index]}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h2>할 일</h2>
          <button type="button" className="icon-btn plain" aria-label="할 일 추가" onClick={() => setTodoOpen(true)}>
            <Plus size={16} />
          </button>
        </div>
        {todos.length === 0 ? (
          <p className="muted">이 날의 할 일이 없어요.</p>
        ) : (
          <ul className="todo-mini">
            {todos.map((todo) => (
              <li key={todo.id}>
                <CheckButton on={todo.done} label="완료" onClick={() => toggleTodo(todo.id)} />
                <button type="button" className={cx('todo-line', 'grow', todo.done && 'is-done')} onClick={() => setEditingTodo(todo)}>
                  {todo.title}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card diary">
        <div className="card-head">
          <h2>오늘의 한 줄 기록</h2>
          <button type="button" className="icon-btn plain" aria-label={diary ? '기록 수정' : '기록 작성'} onClick={openDiary}>
            <Pencil size={16} />
          </button>
        </div>
        {diaryOn ? (
          <div className="form">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={500}
              rows={3}
              placeholder="오늘 공부한 마음을 남겨보세요"
            />
            {diaryError && <p className="form-error">{diaryError}</p>}
            <div className="row-gap">
              <button
                type="button"
                className="btn-primary slim"
                onClick={() => {
                  if (!draft.trim()) {
                    setDiaryError('내용을 입력해 주세요.');
                    return;
                  }
                  saveDiary(selected, draft);
                  setDiaryOn(false);
                }}
              >
                저장
              </button>
              <button type="button" className="btn-ghost" onClick={() => setDiaryOn(false)}>
                취소
              </button>
              {diary && (
                <button
                  type="button"
                  className="btn-ghost danger"
                  onClick={() => {
                    deleteDiary(selected);
                    setDiaryOn(false);
                  }}
                >
                  삭제
                </button>
              )}
            </div>
          </div>
        ) : (
          diary ? (
            <DiaryCanvas entry={diary} />
          ) : (
            <p className="muted">오늘 공부한 마음을 남겨보세요.</p>
          )
        )}
        <button type="button" className="text-btn" onClick={() => setDecorating(true)}>
          다이어리 꾸미기
        </button>
        <Flower className="diary-flower" />
      </section>

      {sessions.length > 0 && (
        <section className="card">
          <h2 className="section-label">공부 기록</h2>
          <ul className="session-list">
            {sessions.map((session) => (
              <li key={session.id}>
                <span>
                  {categoryLabel(session.subject, data.categories)} · {formatHMS(session.durationSec)}
                </span>
                {confirmId === session.id ? (
                  <span className="confirm-row">
                    <button type="button" className="text-btn danger" onClick={() => { deleteSession(session.id); setConfirmId(null); }}>
                      삭제
                    </button>
                    <button type="button" className="text-btn" onClick={() => setConfirmId(null)}>
                      취소
                    </button>
                  </span>
                ) : (
                  <button type="button" className="icon-btn plain" aria-label="기록 삭제" onClick={() => setConfirmId(session.id)}>
                    <Trash2 size={15} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <Modal open={todoOpen} title="할 일 추가" onClose={() => setTodoOpen(false)}>
        <TodoForm
          date={selected}
          onSave={(value) => {
            addTodo({ ...value, date: selected });
            setTodoOpen(false);
          }}
        />
      </Modal>
      <Modal open={Boolean(editingTodo)} title="할 일 수정" onClose={() => setEditingTodo(null)}>
        {editingTodo && (
          <TodoForm
            date={editingTodo.date}
            initial={editingTodo}
            onSave={(value) => {
              updateTodo(editingTodo.id, value);
              setEditingTodo(null);
            }}
            onDelete={() => {
              deleteTodo(editingTodo.id);
              setEditingTodo(null);
            }}
          />
        )}
      </Modal>
    </div>
  );
}
