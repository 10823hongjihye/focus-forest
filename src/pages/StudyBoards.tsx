import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Lock } from 'lucide-react';
import { Flame, Flower2, Leaf, Music, Star, Trophy } from 'lucide-react';
import { ArtSlot } from '../components/ArtSlot';
import { Bear } from '../components/Bear';
import { OutfitLayers } from '../components/OutfitLayers';
import { PageHeader } from '../components/ui';
import { useShellEl } from '../components/shell';
import { useAppState } from '../context/AppState';
import { useAuth } from '../context/Auth';
import { useNav } from '../context/nav';
import { useTimer } from '../context/Timer';
import { SUBJECTS, SUBJECT_COLORS, categoryLabel } from '../lib/constants';
import { cx } from '../lib/cx';
import { characterArt } from '../lib/characterArt';
import { earnedLeaves, outfitPrice, outfitUnlocked, shopOutfits, spentOutfitLeaves, wornAllowed, type Outfit } from '../lib/outfits';
import { totalSeconds } from '../lib/stats';
import { addDays, elapsedMs, formatKoreanDuration, startOfDay, toDateKey } from '../lib/time';

export function StudyCompletePage() {
  const { data, saveDiary } = useAppState();
  const { recap, dismissRecap } = useTimer();
  const { go } = useNav();
  const today = toDateKey(new Date());
  const existing = data.diaries.find((entry) => entry.date === today)?.text ?? '';
  const [note, setNote] = useState(existing);
  const subject = recap?.subject ?? 'math';
  const seconds = recap?.durationSec ?? 0;

  const leave = (page: 'home' | 'study') => {
    dismissRecap();
    go(page, 'focus');
  };

  return (
    <div className="page complete-page">
      <PageHeader title="공부 완료" onBack={() => leave('study')} />
      <ArtSlot name="complete-bear" className="art-hero">
        <Bear character={data.settings.character} size={140} />
      </ArtSlot>
      <p className="complete-time">{seconds > 0 ? formatKoreanDuration(seconds) : '기록할 시간이 없어요'}</p>
      <p className="muted center">{categoryLabel(subject, data.categories)} 공부를 마쳤어요.</p>
      <label className="field">
        <span>한 줄 기록</span>
        <textarea value={note} maxLength={500} rows={3} placeholder="오늘 남기고 싶은 한 줄" onChange={(event) => setNote(event.target.value)} />
      </label>
      <button
        type="button"
        className="btn-primary"
        onClick={() => {
          if (note.trim()) saveDiary(today, note);
          leave('home');
        }}
      >
        기록하고 홈으로
      </button>
    </div>
  );
}

export function SubjectPiePage() {
  const { data } = useAppState();
  const { snapshot, now } = useTimer();
  const { go } = useNav();
  const start = startOfDay(new Date());
  const end = addDays(start, 1).getTime();
  const parts = SUBJECTS.map((subject) => ({
    ...subject,
    sec: totalSeconds(data.sessions, snapshot, now, start.getTime(), end, subject.id),
    color: SUBJECT_COLORS[subject.id].fg,
  }));
  const total = parts.reduce((sum, part) => sum + part.sec, 0);
  let cursor = 0;
  const gradient =
    total <= 0
      ? 'var(--track)'
      : `conic-gradient(${parts
          .filter((part) => part.sec > 0)
          .map((part) => {
            const from = (cursor / total) * 100;
            cursor += part.sec;
            const to = (cursor / total) * 100;
            return `${part.color} ${from}% ${to}%`;
          })
          .join(', ')})`;

  return (
    <div className="page">
      <PageHeader title="과목 비율" onBack={() => go('study', 'stats')} />
      <ArtSlot name="subject-pie" className="art-pie">
        <div className="pie" style={{ background: gradient }} role="img" aria-label="오늘 과목 비율" />
      </ArtSlot>
      <ul className="pie-legend">
        {parts.map((part) => (
          <li key={part.id}>
            <i style={{ background: part.color }} />
            <span>{part.name}</span>
            <strong>{total > 0 ? `${Math.round((part.sec / total) * 100)}%` : '0%'}</strong>
          </li>
        ))}
      </ul>
      {total <= 0 && <p className="muted center">오늘 기록이 생기면 원이 나뉘어요.</p>}
    </div>
  );
}

export function PatternPage() {
  const { data } = useAppState();
  const { snapshot, now } = useTimer();
  const { go } = useNav();
  const start = startOfDay(new Date());
  const hours = Array.from({ length: 18 }, (_, index) => index + 6);
  const values = hours.map((hour) => {
    const from = new Date(start);
    from.setHours(hour, 0, 0, 0);
    const to = new Date(from);
    to.setHours(hour + 1);
    return totalSeconds(data.sessions, snapshot, now, from.getTime(), to.getTime());
  });
  const max = Math.max(...values, 1);

  return (
    <div className="page">
      <PageHeader title="생활 패턴" onBack={() => go('study', 'stats')} />
      <p className="muted">오늘 6시부터 자정 전에 공부한 시간이에요.</p>
      <ArtSlot name="day-pattern" className="art-pattern">
        <div className="pattern" role="img" aria-label="시간대별 공부">
          {hours.map((hour, index) => (
            <div key={hour} className="pattern-col">
              <div className="chart-track">
                <div className="chart-bar" style={{ height: values[index] > 0 ? Math.max(6, Math.round((values[index] / max) * 96)) : 0 }} />
              </div>
              {hour % 3 === 0 && <span>{hour}</span>}
            </div>
          ))}
        </div>
      </ArtSlot>
    </div>
  );
}

export function StreakPage() {
  const { data } = useAppState();
  const { go } = useNav();
  const days = useMemo(() => {
    const keys = new Set<string>();
    for (const session of data.sessions) keys.add(session.date);
    for (const entry of data.diaries) if (entry.text || entry.stickers.length) keys.add(entry.date);
    return keys;
  }, [data.sessions, data.diaries]);
  const streak = countStreak(days);
  const totalSec = data.sessions.reduce((sum, session) => sum + session.durationSec, 0);
  const badges = [
    { id: 'first', name: '첫 공부', on: data.sessions.length > 0, icon: Leaf },
    { id: 'hour', name: '1시간', on: totalSec >= 3600, icon: Star },
    { id: 'three', name: '3일 연속', on: streak >= 3, icon: Flame },
    { id: 'week', name: '일주일', on: streak >= 7, icon: Trophy },
    { id: 'note', name: '한 줄 기록', on: data.diaries.some((entry) => entry.text), icon: Flower2 },
    { id: 'song', name: '음악과 함께', on: data.settings.musicEnabled, icon: Music },
  ];

  return (
    <div className="page">
      <PageHeader title="연속 공부" onBack={() => go('study', 'stats')} />
      <section className="card streak-card">
        <ArtSlot name="streak-flame">
          <Flame size={36} />
        </ArtSlot>
        <p className="complete-time">{streak}일</p>
        <p className="muted">이어서 공부한 날</p>
      </section>
      <ul className="badge-grid">
        {badges.map((badge) => {
          const Icon = badge.icon;
          return (
            <li key={badge.id} className={cx('badge', badge.on && 'is-on')}>
              <ArtSlot name={`badge-${badge.id}`}>
                <Icon size={22} />
              </ArtSlot>
              <span>{badge.name}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function ShopPage() {
  const { data, wearCloth, toggleItem, buyOutfit } = useAppState();
  const { session } = useAuth();
  const { snapshot, now } = useTimer();
  const { go } = useNav();
  const developer = session?.role === 'developer';
  const shell = useShellEl();
  const [offer, setOffer] = useState<Outfit | null>(null);
  const [celebrate, setCelebrate] = useState<Outfit | null>(null);
  const full = characterArt(data.settings.character).full;
  const owned = data.settings.ownedOutfitIds;
  const clothIds = wornAllowed(data.settings.clothIds, owned, developer);
  const itemIds = wornAllowed(data.settings.itemIds, owned, developer);
  const studied = data.sessions.reduce((sum, session) => sum + session.durationSec, 0) + elapsedMs(snapshot.intervals, now) / 1000;
  const leaves = Math.max(0, earnedLeaves(studied) - spentOutfitLeaves(owned));

  useEffect(() => {
    if (!celebrate) return;
    const timer = window.setTimeout(() => setCelebrate(null), 2000);
    return () => window.clearTimeout(timer);
  }, [celebrate]);

  const open = (outfit: Outfit) => {
    if (outfitUnlocked(outfit.id, owned, developer)) {
      if (outfit.group === 'clothes') wearCloth(outfit.id);
      else toggleItem(outfit.id);
      return;
    }
    setOffer(outfit);
  };

  const confirmBuy = () => {
    if (!offer) return;
    const result = buyOutfit(offer.id, elapsedMs(snapshot.intervals, now) / 1000);
    if (result !== 'ok' && result !== 'owned') return;
    const bought = offer;
    setOffer(null);
    setCelebrate(bought);
  };

  return (
    <div className="page dress-page">
      <PageHeader title="캐릭터 옷 입히기" onBack={() => go('settings')} right={<span className="leaf-count">잎 {leaves}</span>} />
      <div className="dress-layout">
        <div className="dress-stage" aria-label="입은 모습">
          <img className="dress-base" src={full} alt="" draggable={false} />
          <OutfitLayers where="dress" clothIds={clothIds} itemIds={itemIds} />
        </div>
        <div className="dress-picks">
          <OutfitPicker title="옷" items={shopOutfits('clothes')} worn={clothIds} owned={owned} developer={developer} onPick={open} />
          <OutfitPicker title="아이템" items={shopOutfits('item')} worn={itemIds} owned={owned} developer={developer} onPick={open} />
        </div>
      </div>
      {shell && (offer || celebrate) && createPortal(
        <div className="outfit-shade" role="dialog" aria-modal="true" aria-label={celebrate ? '구매 완료' : '옷 구매'}>
          {offer && (
            <>
              <button type="button" className="outfit-shade-bg" aria-label="닫기" onClick={() => setOffer(null)} />
              <div className="outfit-pop">
                <img src={offer.dressSrc} alt="" draggable={false} />
                <button type="button" className="btn-primary slim" disabled={leaves < outfitPrice(offer.id)} onClick={confirmBuy}>
                  {leaves < outfitPrice(offer.id) ? '잎이 부족해요' : `잎 ${outfitPrice(offer.id)}개로 구매`}
                </button>
              </div>
            </>
          )}
          {celebrate && (
            <div className="outfit-celebrate" aria-hidden>
              <img src={celebrate.dressSrc} alt="" draggable={false} />
              {SPARKS.map((spark) => (
                <span key={spark.x} className="outfit-spark" style={{ left: spark.x, top: spark.y, animationDelay: spark.delay }} />
              ))}
            </div>
          )}
        </div>,
        shell,
      )}
    </div>
  );
}

const SPARKS = [
  { x: '12%', y: '10%', delay: '0s' },
  { x: '72%', y: '6%', delay: '0.15s' },
  { x: '88%', y: '28%', delay: '0.35s' },
  { x: '8%', y: '42%', delay: '0.5s' },
  { x: '80%', y: '58%', delay: '0.2s' },
  { x: '18%', y: '72%', delay: '0.45s' },
  { x: '64%', y: '82%', delay: '0.1s' },
  { x: '40%', y: '4%', delay: '0.55s' },
];

function OutfitPicker({
  title,
  items,
  worn,
  owned,
  developer,
  onPick,
}: {
  title: string;
  items: Outfit[];
  worn: string[];
  owned: string[];
  developer: boolean;
  onPick: (outfit: Outfit) => void;
}) {
  return (
    <section className="dress-group">
      <h2>{title}</h2>
      <ul className="outfit-grid">
        {items.map((item) => {
          const on = worn.includes(item.id);
          const locked = !outfitUnlocked(item.id, owned, developer);
          return (
            <li key={item.id}>
              <button
                type="button"
                className={cx('outfit-card', on && 'is-on', locked && 'is-locked')}
                aria-label={locked ? `${item.name} 잠김` : item.name}
                aria-pressed={on}
                onClick={() => onPick(item)}
              >
                <img className="outfit-thumb" src={item.dressSrc} alt="" draggable={false} />
                {locked && <Lock className="outfit-lock" size={16} aria-hidden />}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function countStreak(days: Set<string>): number {
  let cursor = startOfDay(new Date());
  if (!days.has(toDateKey(cursor))) cursor = addDays(cursor, -1);
  let count = 0;
  while (days.has(toDateKey(cursor))) {
    count += 1;
    cursor = addDays(cursor, -1);
  }
  return count;
}
