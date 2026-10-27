import { useState, type CSSProperties } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import logo from '../../forest-img/logo.png';
import recordBear from '../../forest-img/on-record.png';
import { Bear } from '../components/Bear';
import { ArtSlot } from '../components/ArtSlot';
import { ThemePage } from './ThemePage';
import { useAppState } from '../context/AppState';
import { CHARACTERS } from '../lib/constants';
import { cx } from '../lib/cx';
import { ONBOARD_DESIGN as D } from '../lib/onboardDesign';

const GOAL_MIN = 30;
const GOAL_MAX = 12 * 60;

/** logo.png 2048×1179 아래쪽 투명 여백. 이 만큼 빼야 splashLogoCopyGap 이 글자와 로고 사이 실제 간격이 됩니다. */
function logoPadBottom(width: number) {
  return (252 / 2048) * width;
}

export function OnboardPage() {
  const { data, updateSettings } = useAppState();
  const [step, setStep] = useState(0);
  const goal = data.settings.dailyGoalMin;

  if (step >= 3) return <ThemePage />;

  return (
    <div className="theme-screen onboard">
      <div className="step-dots" aria-hidden>
        {[0, 1, 2, 3].map((index) => (
          <span key={index} className={cx('step-dot', index === step && 'is-on')} />
        ))}
      </div>
      {step === 0 && (
        <>
          <div className="splash-shift" style={{ marginTop: D.splashOffsetY }}>
            <img
              className="splash-bear"
              src={recordBear}
              alt=""
              width={D.splashBearWidth}
              draggable={false}
              style={{ width: D.splashBearWidth, marginTop: D.splashBearY }}
            />
            <img
              className="splash-logo"
              src={logo}
              alt="포커스 포레스트"
              draggable={false}
              style={{
                width: D.splashLogoWidth,
                marginTop: D.splashBearLogoGap + D.splashLogoY,
                marginBottom: -logoPadBottom(D.splashLogoWidth),
              }}
            />
            <p className="splash-copy" style={{ marginTop: D.splashLogoCopyGap }}>숲속에서 조용히 집중하는 공부 시간</p>
          </div>
          <div className="theme-start">
            <button type="button" className="btn-primary" onClick={() => setStep(1)}>
              시작하기
            </button>
          </div>
        </>
      )}
      {step === 1 && (
        <>
          <header className="theme-head">
            <h1>함께할 친구</h1>
            <p>공부할 때 옆에 둘 캐릭터를 골라 주세요</p>
          </header>
          <div className="character-grid">
            {CHARACTERS.map((character) => {
              const on = data.settings.character === character.id;
              return (
                <button
                  key={character.id}
                  type="button"
                  className={cx('character-card', on && 'is-on')}
                  aria-pressed={on}
                  onClick={() => updateSettings({ character: character.id })}
                >
                  <ArtSlot name={`character-${character.id}`}>
                    <Bear character={character.id} size={92} />
                  </ArtSlot>
                  <span>{character.name}</span>
                </button>
              );
            })}
          </div>
          <div className="theme-start">
            <button type="button" className="btn-primary" onClick={() => setStep(2)}>
              다음
            </button>
          </div>
        </>
      )}
      {step === 2 && (
        <>
          <header className="theme-head">
            <h1>오늘의 목표</h1>
            <p>하루에 공부하고 싶은 시간을 정해 주세요</p>
          </header>
          <GoalClock minutes={goal} onChange={(dailyGoalMin) => updateSettings({ dailyGoalMin })} />
          <div className="theme-start row-gap">
            <button type="button" className="btn-ghost" onClick={() => setStep(1)}>
              이전
            </button>
            <button type="button" className="btn-primary" onClick={() => setStep(3)}>
              다음
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function GoalClock({ minutes, onChange }: { minutes: number; onChange: (minutes: number) => void }) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const apply = (nextHours: number, nextMins: number) => {
    const total = nextHours * 60 + nextMins;
    if (total < GOAL_MIN || total > GOAL_MAX) return;
    onChange(total);
  };

  const stepStyle = { width: D.goalStepWidth, height: D.goalStepHeight };
  const clockStyle = {
    columnGap: D.goalClockGap,
    rowGap: D.goalRowGap,
    transform: `translate(calc(-50% + ${D.goalClockX}px), calc(-50% + ${D.goalClockY}px))`,
  } as CSSProperties;

  return (
    <div className="goal-clock" role="group" aria-label="하루 목표 시간" style={clockStyle}>
      <button type="button" className="goal-step goal-hour-up" style={stepStyle} aria-label="시간 올리기" disabled={hours >= 12 || (hours + 1) * 60 + mins > GOAL_MAX} onClick={() => apply(hours + 1, mins)}>
        <ChevronUp size={D.goalArrowSize} />
      </button>
      <button type="button" className="goal-step goal-min-up" style={stepStyle} aria-label="분 올리기" disabled={hours * 60 + mins + 5 > GOAL_MAX} onClick={() => apply(hours, mins + 5)}>
        <ChevronUp size={D.goalArrowSize} />
      </button>
      <strong className="goal-num goal-hour-num" style={{ fontSize: D.goalNumberSize }}>{String(hours).padStart(2, '0')}</strong>
      <b className="goal-colon" style={{ fontSize: D.goalNumberSize }}>:</b>
      <strong className="goal-num goal-min-num" style={{ fontSize: D.goalNumberSize }}>{String(mins).padStart(2, '0')}</strong>
      <button type="button" className="goal-step goal-hour-down" style={stepStyle} aria-label="시간 내리기" disabled={(hours - 1) * 60 + mins < GOAL_MIN} onClick={() => apply(hours - 1, mins)}>
        <ChevronDown size={D.goalArrowSize} />
      </button>
      <button type="button" className="goal-step goal-min-down" style={stepStyle} aria-label="분 내리기" disabled={hours * 60 + mins - 5 < GOAL_MIN} onClick={() => apply(hours, mins - 5)}>
        <ChevronDown size={D.goalArrowSize} />
      </button>
      <span className="goal-hour-label">시간</span>
      <span className="goal-min-label">분</span>
    </div>
  );
}
