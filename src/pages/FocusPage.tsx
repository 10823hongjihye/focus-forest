import { useEffect } from 'react';
import { SUBJECTS, categoryLabel } from '../lib/constants';
import { cx } from '../lib/cx';
import { formatHMS, formatMMSS } from '../lib/time';
import { LpPlayer } from '../components/LpPlayer';
import { PlayerBar } from '../components/PlayerBar';
import { useAppState } from '../context/AppState';
import { usePlayer } from '../context/Player';
import { useTimer } from '../context/Timer';

export function FocusPage() {
  const { data } = useAppState();
  const { snapshot, displaySec, start, pause, stopAndSave, setSubject } = useTimer();
  const player = usePlayer();
  const locked = snapshot.status !== 'idle';
  const running = snapshot.status === 'running';
  const time = snapshot.mode === 'pomodoro' ? formatMMSS(displaySec) : formatHMS(displaySec);
  const choices = [
    ...SUBJECTS.map((subject) => ({ id: subject.id, name: subject.name })),
    ...data.categories.map((category) => ({ id: category.id, name: category.name })),
  ];

  useEffect(() => {
    if (snapshot.status !== 'idle') return;
    const known =
      SUBJECTS.some((subject) => subject.id === snapshot.subject) ||
      data.categories.some((category) => category.id === snapshot.subject);
    if (!known) setSubject('math');
  }, [snapshot.status, snapshot.subject, data.categories, setSubject]);

  return (
    <div className="focus-screen">
      <div className="focus-main">
        <p className="focus-kicker">FOCUS TIME</p>
        <p className="focus-time">{time}</p>
        <p className="focus-subject">{locked ? `${categoryLabel(snapshot.subject, data.categories)} 공부 중` : '과목을 고르고 시작해 보세요'}</p>
        <div className="focus-actions">
          <button
            type="button"
            className="btn-pause"
            onClick={() => {
              if (running) {
                pause();
                return;
              }
              start();
              player.playSelected();
            }}
          >
            {running ? '일시정지' : snapshot.status === 'paused' ? '이어하기' : '공부 시작'}
          </button>
          <button type="button" className="btn-end" disabled={!locked} onClick={() => stopAndSave(false)}>
            종료하기
          </button>
        </div>
        <div className="subject-chips focus-subjects" role="group" aria-label="공부 과목">
          {choices.map((subject) => (
            <button
              key={subject.id}
              type="button"
              className={cx('chip', snapshot.subject === subject.id && 'is-on')}
              disabled={locked}
              onClick={() => setSubject(subject.id)}
            >
              {subject.name}
            </button>
          ))}
        </div>
        <div className="stage">
          <LpPlayer />
        </div>
      </div>
      <PlayerBar />
    </div>
  );
}
