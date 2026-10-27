import type { StudySession, TimerSnapshot } from '../types';
import { overlap } from './time';

export function totalSeconds(
  sessions: StudySession[],
  snapshot: TimerSnapshot,
  now: number,
  start: number,
  end: number,
  subject?: string,
): number {
  let ms = 0;
  for (const session of sessions) {
    if (subject && session.subject !== subject) continue;
    const span = Math.max(1, session.endedAt - session.startedAt);
    const covered = overlap(session.startedAt, session.endedAt, start, end);
    if (covered <= 0) continue;
    ms += session.durationSec * 1000 * (covered / span);
  }
  if (!subject || snapshot.subject === subject) {
    for (const interval of snapshot.intervals) {
      const intervalEnd = interval.end ?? now;
      ms += overlap(interval.start, intervalEnd, start, end);
    }
  }
  return ms / 1000;
}
