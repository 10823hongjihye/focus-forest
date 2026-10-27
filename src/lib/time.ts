import type { StudySession, TimeInterval } from '../types';
import { WEEKDAYS } from './constants';

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function dateKeyToDate(key: string): Date {
  const [y, m, d] = key.split('-').map((part) => Number(part));
  return new Date(y || 1970, (m || 1) - 1, d || 1);
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function startOfWeek(date: Date): Date {
  const start = startOfDay(date);
  return addDays(start, -start.getDay());
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function monthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const start = startOfWeek(first);
  const cells = Array.from({ length: 42 }, (_, index) => addDays(start, index));
  const lastRow = cells.slice(35);
  if (lastRow.every((day) => day.getMonth() !== month)) return cells.slice(0, 35);
  return cells;
}

export function formatHMS(totalSec: number): string {
  const safe = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

export function formatMMSS(totalSec: number): string {
  const safe = Math.max(0, Math.ceil(totalSec - 1e-6));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatKoreanDuration(totalSec: number): string {
  const safe = Math.max(0, Math.round(totalSec));
  if (safe < 60) return safe <= 0 ? '0분' : '1분 미만';
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  if (h <= 0) return `${m}분`;
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
}

export function formatShort(totalSec: number): string {
  if (totalSec < 60) return totalSec > 0 ? '1분' : '';
  const minutes = Math.round(totalSec / 60);
  if (minutes < 60) return `${minutes}분`;
  const hours = Math.round((totalSec / 3600) * 10) / 10;
  return Number.isInteger(hours) ? `${hours}h` : `${hours}h`;
}

export function formatPercent(part: number, total: number): string {
  if (part <= 0 || total <= 0) return '0%';
  const ratio = part / total;
  if (ratio < 0.01) return '<1%';
  return `${Math.round(ratio * 100)}%`;
}

export function barPercent(part: number, total: number): number {
  if (part <= 0 || total <= 0) return 0;
  return Math.max(4, Math.min(100, (part / total) * 100));
}

export function formatGoal(minutes: number): string {
  if (minutes % 60 === 0) return `${minutes / 60}시간`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h <= 0) return `${m}분`;
  return `${h}시간 ${m}분`;
}

export function formatDayTitle(date: Date): string {
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${WEEKDAYS[date.getDay()]})`;
}

export function formatKoreanDate(date: Date): string {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

export function formatMonthDay(date: Date): string {
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

export function overlap(a0: number, a1: number, b0: number, b1: number): number {
  return Math.max(0, Math.min(a1, b1) - Math.max(a0, b0));
}

export function elapsedMs(intervals: TimeInterval[], now: number): number {
  return intervals.reduce((sum, interval) => {
    const end = interval.end ?? now;
    return sum + Math.max(0, end - interval.start);
  }, 0);
}

export function intervalsToSessions(
  intervals: TimeInterval[],
  subject: string,
  now: number,
): Array<Omit<StudySession, 'id'>> {
  const sessions: Array<Omit<StudySession, 'id'>> = [];
  for (const interval of intervals) {
    const end = interval.end ?? now;
    let cursor = interval.start;
    if (!(end > cursor)) continue;
    while (cursor < end) {
      const current = new Date(cursor);
      const nextMidnight = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1).getTime();
      const sliceEnd = Math.min(end, nextMidnight);
      if (sliceEnd <= cursor) break;
      const durationSec = Math.round((sliceEnd - cursor) / 1000);
      if (durationSec > 0) {
        sessions.push({
          date: toDateKey(current),
          subject,
          durationSec,
          startedAt: cursor,
          endedAt: sliceEnd,
        });
      }
      cursor = sliceEnd;
    }
  }
  return sessions;
}

export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
