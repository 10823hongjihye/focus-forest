import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Settings, TimerSnapshot } from '../types';
import { playChime } from '../lib/audio';
import { defaultTimer } from '../lib/constants';
import { beatTimer, clearTimerStorage, loadTimer, saveTimer } from '../lib/storage';
import { elapsedMs, intervalsToSessions } from '../lib/time';
import { useAppState } from './AppState';

type TimerValue = {
  snapshot: TimerSnapshot;
  now: number;
  elapsedSec: number;
  displaySec: number;
  recap: { subject: string; durationSec: number; at: number } | null;
  dismissRecap: () => void;
  start: () => void;
  pause: () => void;
  stopAndSave: (auto?: boolean) => void;
  setSubject: (subject: string) => void;
  resetTimer: () => void;
};

const TimerContext = createContext<TimerValue | null>(null);

function idleFrom(prev: TimerSnapshot, settings: Settings): TimerSnapshot {
  return {
    status: 'idle',
    subject: prev.subject,
    mode: settings.timerMode,
    targetSec: settings.timerMode === 'pomodoro' ? settings.pomodoroMin * 60 : 0,
    intervals: [],
  };
}

function notifyDone(): void {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  try {
    new Notification('포커스 타임이 끝났어요', { body: '공부 기록을 저장해 두었어요.' });
  } catch {
    /* 알림을 띄울 수 없는 환경이면 토스트만 사용합니다. */
  }
}

export function TimerProvider({ children }: { children: ReactNode }) {
  const { data, addSessions, showToast } = useAppState();
  const settings = data.settings;
  const [snapshot, setSnapshot] = useState<TimerSnapshot>(() => loadTimer(settings));
  const [now, setNow] = useState(() => Date.now());
  const [recap, setRecap] = useState<TimerValue['recap']>(null);
  const snapshotRef = useRef(snapshot);
  const settingsRef = useRef(settings);
  snapshotRef.current = snapshot;
  settingsRef.current = settings;

  const commit = useCallback((next: TimerSnapshot) => {
    snapshotRef.current = next;
    setSnapshot(next);
  }, []);

  useEffect(() => {
    saveTimer(snapshot);
  }, [snapshot]);

  useEffect(() => {
    setSnapshot((prev) => {
      if (prev.status !== 'idle') return prev;
      const targetSec = settings.timerMode === 'pomodoro' ? settings.pomodoroMin * 60 : 0;
      if (prev.mode === settings.timerMode && prev.targetSec === targetSec) return prev;
      return { ...prev, mode: settings.timerMode, targetSec };
    });
  }, [settings.timerMode, settings.pomodoroMin]);

  const stopAndSave = useCallback(
    (auto = false) => {
      const prev = snapshotRef.current;
      if (prev.status === 'idle') return;
      const endedAt = Date.now();
      const closed = prev.intervals.map((interval) => (interval.end == null ? { start: interval.start, end: endedAt } : interval));
      const pieces = intervalsToSessions(closed, prev.subject, endedAt);
      const total = pieces.reduce((sum, piece) => sum + piece.durationSec, 0);
      if (total >= 1) {
        addSessions(pieces);
        setRecap({ subject: prev.subject, durationSec: total, at: endedAt });
        showToast(auto ? '집중 시간이 끝났어요. 기록을 저장했어요.' : '공부 시간을 기록했어요.');
        if (auto) {
          if (settingsRef.current.notifications) notifyDone();
          if (settingsRef.current.musicEnabled) playChime();
        }
      } else {
        showToast('시간이 너무 짧아서 기록하지 않았어요.');
      }
      commit(idleFrom(prev, settingsRef.current));
    },
    [addSessions, commit, showToast],
  );

  useEffect(() => {
    if (snapshot.status !== 'running' || snapshot.mode !== 'pomodoro') return;
    const remain = snapshot.targetSec * 1000 - elapsedMs(snapshot.intervals, Date.now());
    if (remain <= 0) {
      stopAndSave(true);
      return;
    }
    const id = window.setTimeout(() => stopAndSave(true), remain + 40);
    return () => window.clearTimeout(id);
  }, [snapshot, stopAndSave]);

  useEffect(() => {
    if (snapshot.status !== 'running') return;
    const tick = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(tick);
  }, [snapshot.status]);

  useEffect(() => {
    if (snapshot.status !== 'running') return;
    beatTimer();
    const id = window.setInterval(beatTimer, 5000);
    return () => window.clearInterval(id);
  }, [snapshot.status]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState !== 'visible') return;
      setNow(Date.now());
      const prev = snapshotRef.current;
      if (prev.status === 'running' && prev.mode === 'pomodoro') {
        const remain = prev.targetSec * 1000 - elapsedMs(prev.intervals, Date.now());
        if (remain <= 0) stopAndSave(true);
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [stopAndSave]);

  const start = useCallback(() => {
    const prev = snapshotRef.current;
    if (prev.status === 'running') return;
    const current = settingsRef.current;
    const at = Date.now();
    if (prev.status === 'paused') {
      commit({ ...prev, status: 'running', intervals: [...prev.intervals, { start: at, end: null }] });
      return;
    }
    commit({
      status: 'running',
      subject: prev.subject,
      mode: current.timerMode,
      targetSec: current.timerMode === 'pomodoro' ? current.pomodoroMin * 60 : 0,
      intervals: [{ start: at, end: null }],
    });
  }, [commit]);

  const pause = useCallback(() => {
    const prev = snapshotRef.current;
    if (prev.status !== 'running') return;
    const at = Date.now();
    commit({
      ...prev,
      status: 'paused',
      intervals: prev.intervals.map((interval) => (interval.end == null ? { start: interval.start, end: at } : interval)),
    });
  }, [commit]);

  const setSubject = useCallback(
    (subject: string) => {
      const prev = snapshotRef.current;
      if (prev.status !== 'idle') return;
      commit({ ...prev, subject });
    },
    [commit],
  );

  const resetTimer = useCallback(() => {
    clearTimerStorage();
    commit(defaultTimer());
  }, [commit]);

  const dismissRecap = useCallback(() => setRecap(null), []);

  const elapsedSec = elapsedMs(snapshot.intervals, now) / 1000;
  const displaySec = snapshot.mode === 'pomodoro' ? Math.max(0, snapshot.targetSec - elapsedSec) : elapsedSec;

  const value = useMemo<TimerValue>(
    () => ({ snapshot, now, elapsedSec, displaySec, recap, dismissRecap, start, pause, stopAndSave, setSubject, resetTimer }),
    [snapshot, now, elapsedSec, displaySec, recap, dismissRecap, start, pause, stopAndSave, setSubject, resetTimer],
  );

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}

export function useTimer(): TimerValue {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error('TimerProvider가 필요합니다.');
  return ctx;
}
