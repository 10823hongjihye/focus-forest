import { useMemo } from 'react';
import { useAppState } from '../context/AppState';
import { useTimer } from '../context/Timer';
import { totalSeconds } from '../lib/stats';

export function useStudiedSeconds(start: number, end: number, subject?: string): number {
  const { data } = useAppState();
  const { snapshot, now } = useTimer();
  return useMemo(
    () => totalSeconds(data.sessions, snapshot, now, start, end, subject),
    [data.sessions, snapshot, now, start, end, subject],
  );
}
