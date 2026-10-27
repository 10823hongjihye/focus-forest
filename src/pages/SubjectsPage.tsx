import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { SubjectId } from '../types';
import { PageHeader } from '../components/ui';
import { SubjectIcon } from '../components/SubjectIcon';
import { useAppState } from '../context/AppState';
import { useTimer } from '../context/Timer';
import { useNav } from '../context/nav';
import { SUBJECTS, SUBJECT_COLORS, subjectName } from '../lib/constants';
import { totalSeconds } from '../lib/stats';
import { addDays, barPercent, formatHMS, formatPercent, startOfWeek } from '../lib/time';

export function SubjectsPage() {
  const { data, updateSettings } = useAppState();
  const { snapshot, now } = useTimer();
  const { go } = useNav();
  const [editing, setEditing] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const weekStart = addDays(startOfWeek(new Date()), weekOffset * 7);
  const start = weekStart.getTime();
  const end = addDays(weekStart, 7).getTime();

  const seconds = useMemo(() => {
    const map = {} as Record<SubjectId, number>;
    for (const subject of SUBJECTS) {
      map[subject.id] = totalSeconds(data.sessions, snapshot, now, start, end, subject.id);
    }
    return map;
  }, [data.sessions, snapshot, now, start, end]);

  const total = SUBJECTS.reduce((sum, subject) => sum + seconds[subject.id], 0);

  return (
    <div className="page">
      <PageHeader title="과목별 공부 현황" onBack={() => go('study', 'focus')} />
      <div className="row-between">
        <div className="range-row compact">
          <button type="button" className="icon-btn plain" onClick={() => setWeekOffset((value) => value - 1)} aria-label="이전 주">
            <ChevronLeft size={18} />
          </button>
          <p className="muted">{weekOffset === 0 ? '이번 주' : weekOffset > 0 ? `${weekOffset}주 뒤` : `${Math.abs(weekOffset)}주 전`}</p>
          <button type="button" className="icon-btn plain" onClick={() => setWeekOffset((value) => value + 1)} aria-label="다음 주">
            <ChevronRight size={18} />
          </button>
        </div>
        <button type="button" className="text-btn" onClick={() => setEditing((value) => !value)}>
          {editing ? '닫기' : '목표 수정'}
        </button>
      </div>
      {editing && (
        <div className="card goal-edit">
          {SUBJECTS.map((subject) => (
            <label key={subject.id} className="field inline-field">
              <span>{subject.name}</span>
              <input
                type="number"
                min={0.5}
                max={40}
                step={0.5}
                value={data.settings.subjectGoals[subject.id] / 60}
                onChange={(event) => {
                  const hours = Number(event.target.value);
                  if (!Number.isFinite(hours)) return;
                  updateSettings({
                    subjectGoals: {
                      ...data.settings.subjectGoals,
                      [subject.id]: Math.min(2400, Math.max(30, Math.round(hours * 60))),
                    },
                  });
                }}
              />
              <em>시간</em>
            </label>
          ))}
        </div>
      )}
      <div className="stack">
        {SUBJECTS.map((subject) => {
          const sec = seconds[subject.id];
          const goal = data.settings.subjectGoals[subject.id] * 60;
          return (
            <article key={subject.id} className="card subject-row">
              <div className="subject-top">
                <span className="subject-ico" style={{ background: SUBJECT_COLORS[subject.id].bg, color: SUBJECT_COLORS[subject.id].fg }}>
                  <SubjectIcon id={subject.id} />
                </span>
                <div className="subject-name">
                  <strong>{subjectName(subject.id)}</strong>
                  <span className="num">{formatHMS(sec)}</span>
                </div>
                <b className="num percent">{formatPercent(sec, goal)}</b>
              </div>
              <div className="bar" aria-hidden>
                <span style={{ width: `${barPercent(sec, goal)}%` }} />
              </div>
            </article>
          );
        })}
      </div>
      {total <= 0 && <p className="muted center">공부를 마치면 막대가 채워져요.</p>}
      {weekOffset !== 0 && (
        <button type="button" className="btn-ghost" onClick={() => setWeekOffset(0)}>
          이번 주로
        </button>
      )}
    </div>
  );
}
