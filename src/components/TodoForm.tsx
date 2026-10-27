import { useState } from 'react';
import type { FormEvent } from 'react';
import { Plus, Star, X } from 'lucide-react';
import type { Todo } from '../types';
import { SUBJECTS, categoryTone } from '../lib/constants';
import { cx } from '../lib/cx';
import { formatKoreanDate } from '../lib/time';
import { useAppState } from '../context/AppState';
import { useTimer } from '../context/Timer';

export function TodoForm({
  date,
  initial,
  onSave,
  onDelete,
}: {
  date: string;
  initial?: Todo | null;
  onSave: (value: { title: string; subject: string; importance: number }) => void;
  onDelete?: () => void;
}) {
  const { data, addCategory, removeCategory } = useAppState();
  const { snapshot, setSubject: setTimerSubject } = useTimer();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [subject, setSubject] = useState(initial?.subject ?? 'math');
  const [importance, setImportance] = useState(initialImportance(initial));
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [catError, setCatError] = useState('');

  const commitCategory = () => {
    const result = addCategory(draft);
    if (result === 'empty') {
      setCatError('카테고리 이름을 입력해 주세요.');
      return;
    }
    if (result === 'duplicate') {
      setCatError('이미 있는 카테고리예요.');
      return;
    }
    if (result === 'limit') {
      setCatError('카테고리는 20개까지 추가할 수 있어요.');
      return;
    }
    setSubject(result.id);
    setDraft('');
    setCatError('');
    setAdding(false);
  };

  const dropCategory = (id: string) => {
    removeCategory(id);
    if (subject === id) setSubject('math');
    if (snapshot.status === 'idle' && snapshot.subject === id) setTimerSubject('math');
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) {
      setError('할 일 내용을 입력해 주세요.');
      return;
    }
    onSave({ title: title.trim(), subject, importance });
  };

  return (
    <form className="form todo-form" onSubmit={submit}>
      <p className="muted">{formatKoreanDate(dateFromKey(date))}</p>
      <label className="field">
        <span>할 일</span>
        <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={80} placeholder="오늘 할 일을 적어보세요" autoFocus />
      </label>
      {error && <p className="form-error">{error}</p>}
      <div className="field">
        <span>카테고리</span>
        <div className="chip-row form-chips">
          {SUBJECTS.map((item) => {
            const tone = categoryTone(item.id);
            const on = subject === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={cx('chip', 'cat-chip', on && 'is-on')}
                style={on ? undefined : { background: tone.bg, color: tone.fg }}
                aria-pressed={on}
                onClick={() => setSubject(item.id)}
              >
                {item.name}
              </button>
            );
          })}
          {data.categories.map((item) => {
            const tone = categoryTone(item.id, data.categories);
            const on = subject === item.id;
            return (
              <span
                key={item.id}
                className={cx('cat-own', on && 'is-on')}
                style={on ? undefined : { background: tone.bg, color: tone.fg, borderColor: tone.fg }}
              >
                <button type="button" className="cat-own-name" aria-pressed={on} onClick={() => setSubject(item.id)}>
                  {item.name}
                </button>
                <button type="button" className="cat-own-x" aria-label={`${item.name} 카테고리 삭제`} onClick={() => dropCategory(item.id)}>
                  <X size={12} />
                </button>
              </span>
            );
          })}
          <button
            type="button"
            className={cx('add-chip', adding && 'is-on')}
            aria-label="카테고리 추가"
            aria-expanded={adding}
            onClick={() => {
              setAdding((value) => !value);
              setCatError('');
            }}
          >
            <Plus size={16} />
          </button>
        </div>
        {adding && (
          <div className="inline-add">
            <input
              value={draft}
              maxLength={16}
              placeholder="새 카테고리"
              aria-label="새 카테고리 이름"
              onChange={(event) => {
                setDraft(event.target.value);
                setCatError('');
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  commitCategory();
                }
              }}
            />
            <button type="button" className="btn-primary slim" onClick={commitCategory}>
              추가
            </button>
          </div>
        )}
        {catError && <p className="form-error">{catError}</p>}
      </div>
      <div className="field">
        <span>중요도 {importance}/5</span>
        <div className="star-row" role="radiogroup" aria-label="중요도">
          {[1, 2, 3, 4, 5].map((score) => (
            <button
              key={score}
              type="button"
              role="radio"
              aria-checked={importance === score}
              aria-label={`별 ${score}개`}
              className={cx('star-pick', score <= importance && 'is-on')}
              onClick={() => setImportance(score)}
            >
              <Star size={18} fill={score <= importance ? 'currentColor' : 'none'} />
            </button>
          ))}
        </div>
      </div>
      <button type="submit" className="btn-primary">
        저장하기
      </button>
      {onDelete && (
        <button type="button" className="btn-ghost danger" onClick={onDelete}>
          삭제하기
        </button>
      )}
    </form>
  );
}

function initialImportance(initial?: Todo | null): number {
  if (!initial) return 1;
  if (initial.importance > 0) return initial.importance;
  return initial.important ? 5 : 1;
}

function dateFromKey(key: string): Date {
  const [y, m, d] = key.split('-').map((part) => Number(part));
  return new Date(y || 1970, (m || 1) - 1, d || 1);
}
