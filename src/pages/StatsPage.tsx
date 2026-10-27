import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { StatsRange } from '../types';
import { Flower } from '../components/Illustrations';
import { PageHeader, Segmented } from '../components/ui';
import { useAppState } from '../context/AppState';
import { useNav } from '../context/nav';
import { useTimer } from '../context/Timer';
import { WEEKDAYS } from '../lib/constants';
import { cx } from '../lib/cx';
import { totalSeconds } from '../lib/stats';
import { addDays, formatKoreanDate, formatKoreanDuration, formatMonthDay, formatShort, isSameDay, startOfDay, startOfWeek } from '../lib/time';

type Bucket = { label: string; start: number; end: number; active: boolean };

export function StatsPage() {
  const { data } = useAppState();
  const { snapshot, now } = useTimer();
  const { go } = useNav();
  const [range, setRange] = useState<StatsRange>('week');
  const [cursor, setCursor] = useState(() => startOfDay(new Date()));

  const buckets = useMemo(() => buildBuckets(range, cursor), [range, cursor]);
  const values = useMemo(
    () => buckets.map((bucket) => totalSeconds(data.sessions, snapshot, now, bucket.start, bucket.end)),
    [buckets, data.sessions, snapshot, now],
  );
  const total = values.reduce((sum, value) => sum + value, 0);
  const max = Math.max(...values, 1);

  const shift = (dir: number) => {
    setCursor((current) => {
      if (range === 'day') return addDays(current, dir);
      if (range === 'week') return addDays(current, dir * 7);
      if (range === 'month') return new Date(current.getFullYear(), current.getMonth() + dir, 1);
      return new Date(current.getFullYear() + dir, 0, 1);
    });
  };

  return (
    <div className="page">
      <PageHeader title="공부 시간 통계" onBack={() => go('study', 'focus')} />
      <Segmented
        label="통계 기간"
        value={range}
        onChange={setRange}
        options={[
          { id: 'day', label: '일간' },
          { id: 'week', label: '주간' },
          { id: 'month', label: '월간' },
          { id: 'year', label: '연간' },
        ]}
      />
      <div className="range-row">
        <button type="button" className="icon-btn plain" onClick={() => shift(-1)} aria-label="이전 기간">
          <ChevronLeft size={18} />
        </button>
        <span>{rangeLabel(range, cursor)}</span>
        <button type="button" className="icon-btn plain" onClick={() => shift(1)} aria-label="다음 기간">
          <ChevronRight size={18} />
        </button>
      </div>
      <section className="card stat-total">
        <div>
          <p className="kicker">총 공부 시간</p>
          <p className="stat-hours">{formatKoreanDuration(total)}</p>
        </div>
        <Flower />
      </section>
      <section className={cx('card chart-card', range === 'month' && 'is-dense')}>
        <div className={cx('chart-wrap', range === 'month' && 'is-dense')}>
          <div className="chart" role="img" aria-label="공부 시간 막대그래프">
            {buckets.map((bucket, index) => {
              const sec = values[index] ?? 0;
              const height = sec > 0 ? Math.max(8, Math.round((sec / max) * 112)) : 0;
              return (
                <div className="chart-col" key={`${bucket.label}-${bucket.start}`}>
                  <span className="chart-val">{sec > 0 ? formatShort(sec) : ''}</span>
                  <div className="chart-track">
                    <div className={cx('chart-bar', bucket.active && 'is-now')} style={{ height }} />
                  </div>
                  <span className={cx('chart-x', bucket.active && 'is-now')}>{bucket.label}</span>
                </div>
              );
            })}
          </div>
        </div>
        {total <= 0 && <p className="muted center">기록이 쌓이면 막대가 자라요.</p>}
      </section>
      <div className="link-row">
        <button type="button" className="text-btn" onClick={() => go('study', 'pie')}>
          과목 비율
        </button>
        <button type="button" className="text-btn" onClick={() => go('study', 'pattern')}>
          생활 패턴
        </button>
        <button type="button" className="text-btn" onClick={() => go('study', 'streak')}>
          연속 공부
        </button>
      </div>
    </div>
  );
}

function rangeLabel(range: StatsRange, cursor: Date): string {
  if (range === 'day') return formatKoreanDate(cursor);
  if (range === 'week') {
    const start = startOfWeek(cursor);
    const end = addDays(start, 6);
    return `${formatMonthDay(start)} - ${formatMonthDay(end)}`;
  }
  if (range === 'month') return `${cursor.getFullYear()}년 ${cursor.getMonth() + 1}월`;
  return `${cursor.getFullYear()}년`;
}

function buildBuckets(range: StatsRange, cursor: Date): Bucket[] {
  if (range === 'day') {
    const day = startOfDay(cursor);
    const labels = ['새벽', '아침', '오전', '오후', '저녁', '밤'];
    return labels.map((label, index) => {
      const start = new Date(day);
      start.setHours(index * 4, 0, 0, 0);
      const end = new Date(start);
      end.setHours(start.getHours() + 4);
      return {
        label,
        start: start.getTime(),
        end: end.getTime(),
        active: isSameDay(day, new Date()) && Date.now() >= start.getTime() && Date.now() < end.getTime(),
      };
    });
  }
  if (range === 'week') {
    const start = startOfWeek(cursor);
    return WEEKDAYS.map((label, index) => {
      const day = addDays(start, index);
      return { label, start: day.getTime(), end: addDays(day, 1).getTime(), active: isSameDay(day, new Date()) };
    });
  }
  if (range === 'month') {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const last = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: last }, (_, index) => {
      const day = new Date(year, month, index + 1);
      return { label: String(index + 1), start: day.getTime(), end: addDays(day, 1).getTime(), active: isSameDay(day, new Date()) };
    });
  }
  const year = cursor.getFullYear();
  return Array.from({ length: 12 }, (_, month) => {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 1);
    const today = new Date();
    return { label: `${month + 1}월`, start: start.getTime(), end: end.getTime(), active: today.getFullYear() === year && today.getMonth() === month };
  });
}
