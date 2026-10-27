import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import recordSrc from '../../forest-img/record.png';
import armSrc from '../../forest-img/start_music.png';
import stopSrc from '../../forest-img/stop-music.png';
import { characterArt } from '../lib/characterArt';
import { wornAllowed } from '../lib/outfits';
import { useAuth } from '../context/Auth';
import { OutfitLayers } from './OutfitLayers';
import { useAppState } from '../context/AppState';
import { usePlayer } from '../context/Player';
import { LP_DESIGN } from '../lib/lpDesign';
import { cx } from '../lib/cx';

/** start_music.png 측정값. 큰 축(피벗)과 끝의 흰 카트리지. */
const PIVOT_X = 83.5;
const PIVOT_Y = 20.6;
const TIP_X = 32.45;
const TIP_Y = 60.58;
const ARM_RATIO = 956 / 898;

/** 바늘이 레코드 위에 있는 각도. */
const PLAY_DEG = 0;
/** 흰 카트리지가 STOP 위에 있는 각도. */
const STOP_DEG = -56;

/** 검은 판 반지름 (record.png 너비 대비). 홈 가장자리 ≈ 29.2%. */
const DISC_RADIUS = 0.3;

function clampArm(value: number): number {
  const lo = Math.min(PLAY_DEG, STOP_DEG);
  const hi = Math.max(PLAY_DEG, STOP_DEG);
  return Math.min(hi, Math.max(lo, value));
}

function wrapDelta(delta: number): number {
  let value = delta;
  while (value > 180) value -= 360;
  while (value < -180) value += 360;
  return value;
}

/** 멈춘 자세에서 흰 카트리지가 놓이는 점 (LP 영역 %). */
function stopAnchor(): { x: number; y: number } {
  const width = LP_DESIGN.armWidth;
  const height = width * ARM_RATIO;
  const scale = LP_DESIGN.tonearmScale;
  const pivotX = LP_DESIGN.armX + (PIVOT_X / 100) * width;
  const pivotY = LP_DESIGN.armY + (PIVOT_Y / 100) * height;
  const dx = ((TIP_X - PIVOT_X) / 100) * width;
  const dy = ((TIP_Y - PIVOT_Y) / 100) * height;
  const rad = (STOP_DEG * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return {
    x: pivotX + scale * (dx * cos - dy * sin) + LP_DESIGN.stopNudgeX,
    y: pivotY + scale * (dx * sin + dy * cos) + LP_DESIGN.stopNudgeY,
  };
}

export function LpPlayer() {
  const player = usePlayer();
  const { session } = useAuth();
  const { data } = useAppState();
  const developer = session?.role === 'developer';
  const clothIds = wornAllowed(data.settings.clothIds, data.settings.ownedOutfitIds, developer);
  const itemIds = wornAllowed(data.settings.itemIds, data.settings.ownedOutfitIds, developer);
  const active =
    player.playing && !player.muted && data.settings.musicEnabled && data.settings.musicVolume > 0;

  const pivotRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLSpanElement>(null);
  const stopRef = useRef<HTMLImageElement>(null);
  const turnRef = useRef<HTMLDivElement>(null);
  const recordRef = useRef<HTMLImageElement>(null);
  const orbitRef = useRef<HTMLDivElement>(null);
  const bearRef = useRef<HTMLDivElement>(null);
  const spinRef = useRef<Animation[] | null>(null);
  const dragRef = useRef<{ pointerId: number; x: number; y: number; moved: boolean; start: number; grab: number } | null>(null);
  const activeRef = useRef(active);
  const playingRef = useRef(player.playing);
  activeRef.current = active;
  playingRef.current = player.playing;

  const [angle, setAngle] = useState(active ? PLAY_DEG : STOP_DEG);
  const [dragging, setDragging] = useState(false);
  const angleRef = useRef(angle);
  angleRef.current = angle;

  const stop = stopAnchor();
  const designStyle = {
      '--lp-record-width': `${LP_DESIGN.recordWidth}%`,
      '--lp-record-x': `${LP_DESIGN.recordX}%`,
      '--lp-record-y': `${LP_DESIGN.recordY}%`,
      '--lp-bear-size': `${LP_DESIGN.bearSize}%`,
      '--lp-bear-x': `${LP_DESIGN.bearX}%`,
      '--lp-bear-y': `${LP_DESIGN.bearY}%`,
      '--lp-bear-orbit-lift': `${LP_DESIGN.bearOrbitLift}%`,
      '--lp-bear-orbit-x': `${LP_DESIGN.bearOrbitShiftX}%`,
      '--lp-spin-duration': `${LP_DESIGN.spinSeconds}s`,
      '--lp-arm-width': `${LP_DESIGN.armWidth}%`,
      '--lp-arm-x': `${LP_DESIGN.armX}%`,
      '--lp-arm-y': `${LP_DESIGN.armY}%`,
      '--lp-tonearm-scale': String(LP_DESIGN.tonearmScale),
      '--lp-stop-width': `${LP_DESIGN.stopWidth}%`,
      '--lp-stop-scale': String(LP_DESIGN.stopScale),
      '--lp-stop-x': `${stop.x}%`,
      '--lp-stop-y': `${stop.y}%`,
      '--lp-hole-x': `${LP_DESIGN.holeX}%`,
      '--lp-hole-y': `${LP_DESIGN.holeY}%`,
  } as CSSProperties;

  useEffect(() => {
    const record = recordRef.current;
    const orbit = orbitRef.current;
    const bear = bearRef.current;
    if (!record || !orbit || !bear) return;
    const timing: KeyframeAnimationOptions = {
      duration: LP_DESIGN.spinSeconds * 1000,
      iterations: Infinity,
      easing: 'linear',
    };
    const spin: Keyframe[] = [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }];
    const upright: Keyframe[] = [
      { transform: 'translateX(-50%) rotate(0deg)' },
      { transform: 'translateX(-50%) rotate(-360deg)' },
    ];
    for (const el of [record, orbit, bear]) {
      for (const anim of el.getAnimations()) anim.cancel();
    }
    const animations = [record.animate(spin, timing), orbit.animate(spin, timing), bear.animate(upright, timing)];
    spinRef.current = animations;
    let dropped = false;
    const apply = () => {
      if (dropped) return;
      const running = activeRef.current;
      for (const anim of animations) {
        if (running) {
          const time = anim.currentTime;
          anim.play();
          if (time != null) anim.currentTime = time;
        } else {
          anim.pause();
        }
      }
    };
    // iPad Safari는 애니메이션을 만들자마자 멈추면, 이후 play()를 무시합니다.
    requestAnimationFrame(apply);
    return () => {
      dropped = true;
      if (spinRef.current === animations) spinRef.current = null;
      for (const anim of animations) anim.cancel();
    };
  }, []);

  useEffect(() => {
    const animations = spinRef.current;
    if (!animations) return;
    for (const anim of animations) {
      if (active) {
        const time = anim.currentTime;
        anim.play();
        if (time != null) anim.currentTime = time;
      } else {
        anim.pause();
      }
    }
  }, [active]);

  const stopMusic = useRef(() => undefined as void);
  const playMusic = useRef(() => undefined as void);
  stopMusic.current = () => {
    setAngle(STOP_DEG);
    angleRef.current = STOP_DEG;
    if (playingRef.current) player.stop();
  };
  playMusic.current = () => {
    setAngle(PLAY_DEG);
    angleRef.current = PLAY_DEG;
    if (!playingRef.current) player.playSelected();
  };

  useEffect(() => {
    if (dragging) return;
    setAngle(active ? PLAY_DEG : STOP_DEG);
  }, [active, dragging]);

  useEffect(() => {
    const pointerAngle = (clientX: number, clientY: number) => {
      const pivot = pivotRef.current?.getBoundingClientRect();
      if (!pivot) return null;
      const cx = pivot.left + pivot.width / 2;
      const cy = pivot.top + pivot.height / 2;
      return (Math.atan2(clientY - cy, clientX - cx) * 180) / Math.PI;
    };

    const tipCenter = () => {
      const tip = tipRef.current?.getBoundingClientRect();
      if (!tip) return null;
      return { x: tip.left + tip.width / 2, y: tip.top + tip.height / 2 };
    };

    const tipOnRecord = () => {
      const tip = tipCenter();
      const turn = turnRef.current?.getBoundingClientRect();
      if (!tip || !turn || turn.width < 1) return false;
      const cx = turn.left + (turn.width * LP_DESIGN.holeX) / 100;
      const cy = turn.top + (turn.height * LP_DESIGN.holeY) / 100;
      const radius = turn.width * DISC_RADIUS;
      return Math.hypot(tip.x - cx, tip.y - cy) <= radius;
    };

    const tipOnStop = () => {
      const tip = tipCenter();
      const stop = stopRef.current?.getBoundingClientRect();
      if (!tip || !stop || stop.width < 1) return false;
      const sx = stop.left + stop.width * 0.597;
      const sy = stop.top + stop.height * 0.449;
      return Math.hypot(tip.x - sx, tip.y - sy) <= Math.max(18, stop.width * 0.42);
    };

    const finishDrag = () => {
      const drag = dragRef.current;
      if (drag && !drag.moved) {
        if (playingRef.current) stopMusic.current();
        else playMusic.current();
        return;
      }
      if (tipOnRecord()) {
        playMusic.current();
        return;
      }
      if (tipOnStop()) {
        stopMusic.current();
        return;
      }
      const toStop = Math.abs(angleRef.current - STOP_DEG);
      const toPlay = Math.abs(angleRef.current - PLAY_DEG);
      if (toPlay <= toStop) playMusic.current();
      else stopMusic.current();
    };

    const onMove = (event: PointerEvent | MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      if ('pointerId' in event && drag.pointerId >= 0 && event.pointerId !== drag.pointerId) return;
      event.preventDefault();
      if (Math.hypot(event.clientX - drag.x, event.clientY - drag.y) > 6) drag.moved = true;
      const raw = pointerAngle(event.clientX, event.clientY);
      if (raw == null) return;
      const next = clampArm(drag.start + wrapDelta(raw - drag.grab));
      angleRef.current = next;
      setAngle(next);
    };

    const onUp = (event: PointerEvent | MouseEvent) => {
      if (!dragRef.current) return;
      if ('pointerId' in event && dragRef.current.pointerId >= 0 && event.pointerId !== dragRef.current.pointerId) {
        return;
      }
      finishDrag();
      dragRef.current = null;
      setDragging(false);
    };

    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    window.addEventListener('mousemove', onMove, { passive: false });
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  const onPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* unsupported capture */
    }
    const pivot = pivotRef.current?.getBoundingClientRect();
    const grab = pivot
      ? (Math.atan2(event.clientY - (pivot.top + pivot.height / 2), event.clientX - (pivot.left + pivot.width / 2)) * 180) / Math.PI
      : 0;
    dragRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      moved: false,
      start: angleRef.current,
      grab,
    };
    setDragging(true);
  };

  return (
    <div className="lp" style={designStyle} aria-label="레코드 플레이어">
      <div className="lp-turn" ref={turnRef}>
        <img ref={recordRef} className="lp-record" src={recordSrc} alt="" draggable={false} />
      </div>
      <div ref={orbitRef} className="lp-bear-orbit">
        <div ref={bearRef} className="lp-bear">
          <img className="lp-bear-base" src={characterArt(data.settings.character).record} alt="" draggable={false} />
          <OutfitLayers where="record" clothIds={clothIds} itemIds={itemIds} />
        </div>
      </div>

      <img className="lp-stop" ref={stopRef} src={stopSrc} alt="" draggable={false} />

      <div className={cx('lp-arm-wrap', dragging && 'is-drag')} style={{ transform: `rotate(${angle}deg)` }}>
        <div className="lp-pivot" ref={pivotRef} aria-hidden />
        <img className="lp-arm" src={armSrc} alt="" draggable={false} />
        <span className="lp-tip" ref={tipRef} aria-hidden />
        <button
          type="button"
          className="lp-arm-hit"
          aria-label={active ? '톤암을 STOP으로 옮겨 음악 정지' : '톤암을 레코드로 옮겨 음악 재생'}
          aria-pressed={active}
          onPointerDown={onPointerDown}
        />
      </div>
    </div>
  );
}
