import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { AlignCenter, AlignLeft, AlignRight, RotateCw, X } from 'lucide-react';
import { PageHeader } from '../components/ui';
import { useAppState } from '../context/AppState';
import { DIARY_ALIGNS, DIARY_FONTS, diaryFontFamily } from '../lib/diaryText';
import { useCustomStickerSources } from '../hooks/useCustomStickerSources';
import { STICKER_GROUPS, stickerArt } from '../lib/stickers';
import { cx } from '../lib/cx';
import { uid } from '../lib/time';
import type { DiaryEntry, PaperStyle, PlacedSticker } from '../types';

const PAPERS: Array<{ id: PaperStyle; name: string }> = [
  { id: 'lines', name: '줄선' },
  { id: 'dots', name: '점선' },
  { id: 'grid', name: '그리드' },
];

const HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as const;
const MAX_STICKERS = 20;

type DecorState = Pick<DiaryEntry, 'paper' | 'textX' | 'textY' | 'textSize' | 'textWidth' | 'textRotation' | 'textFont' | 'textAlign' | 'stickers'>;

type Gesture =
  | { kind: 'move'; id: string; px: number; py: number; x: number; y: number }
  | { kind: 'rotate'; id: string; cx: number; cy: number; startAngle: number; rotation: number }
  | { kind: 'scale'; id: string; cx: number; cy: number; startDist: number; size: number; font: number; widthPx: number; height: number }
  | { kind: 'width'; id: string; handle: 'e' | 'w'; cx: number; cy: number; px: number; py: number; rotation: number; widthPx: number; height: number };

function fromEntry(entry: DiaryEntry | undefined): DecorState {
  return {
    paper: entry?.paper ?? 'lines',
    textX: entry?.textX ?? 8,
    textY: entry?.textY ?? 12,
    textSize: entry?.textSize ?? 16,
    textWidth: entry?.textWidth ?? 70,
    textRotation: entry?.textRotation ?? 0,
    textFont: entry?.textFont ?? 'sans',
    textAlign: entry?.textAlign ?? 'left',
    stickers: entry?.stickers ?? [],
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function wrapDegrees(value: number) {
  return ((value % 360) + 360) % 360;
}

export function DiaryDecor({ date, onBack }: { date: string; onBack: () => void }) {
  const { data, saveDiaryDecor, showToast, addCustomSticker, removeCustomSticker } = useAppState();
  const customSources = useCustomStickerSources(data.customStickers.map((item) => item.id));
  const entry = data.diaries.find((item) => item.date === date);
  const [decor, setDecor] = useState<DecorState>(() => fromEntry(entry));
  const [selected, setSelected] = useState<string | null>(entry?.text ? 'text' : null);
  const [textEditing, setTextEditing] = useState(false);
  const [draft, setDraft] = useState(entry?.text ?? '');
  const sheetRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const decorRef = useRef(decor);
  const textValue = useRef(entry?.text ?? '');
  const gesture = useRef<Gesture | null>(null);
  decorRef.current = decor;
  textValue.current = entry?.text ?? '';

  useEffect(() => {
    const found = data.diaries.find((item) => item.date === date);
    const next = fromEntry(found);
    setDecor(next);
    decorRef.current = next;
    setTextEditing(false);
    setSelected(found?.text ? 'text' : null);
    // 저장할 때마다 기록을 다시 읽으면 끌어 옮기던 위치가 되돌아갑니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const commit = (next: DecorState) => {
    decorRef.current = next;
    setDecor(next);
    saveDiaryDecor(date, next);
  };

  const patch = (partial: Partial<DecorState>) => {
    commit({ ...decorRef.current, ...partial });
  };

  const update = (recipe: (prev: DecorState) => DecorState) => {
    setDecor((prev) => {
      const next = recipe(prev);
      decorRef.current = next;
      return next;
    });
  };

  const pointOnSheet = (clientX: number, clientY: number) => {
    const rect = sheetRef.current?.getBoundingClientRect();
    if (!rect || rect.width < 1 || rect.height < 1) return null;
    return { x: clientX - rect.left, y: clientY - rect.top, rect };
  };

  const boxMetrics = (id: string) => {
    const sheet = sheetRef.current;
    const node = sheet?.querySelector<HTMLElement>(`[data-object="${CSS.escape(id)}"]`);
    const rect = sheet?.getBoundingClientRect();
    if (!sheet || !node || !rect || rect.width < 1 || rect.height < 1) return null;
    const left = (parseFloat(node.style.left) / 100) * rect.width;
    const top = (parseFloat(node.style.top) / 100) * rect.height;
    const widthPx = node.offsetWidth;
    const height = node.offsetHeight;
    return { left, top, widthPx, height, cx: left + widthPx / 2, cy: top + height / 2, rect };
  };

  const capture = (event: ReactPointerEvent) => {
    event.preventDefault();
    event.stopPropagation();
    sheetRef.current?.setPointerCapture(event.pointerId);
  };

  const raiseSticker = (id: string) => {
    if (id === 'text') return;
    update((prev) => {
      const index = prev.stickers.findIndex((item) => item.id === id);
      if (index < 0 || index === prev.stickers.length - 1) return prev;
      const stickers = [...prev.stickers];
      const [item] = stickers.splice(index, 1);
      return { ...prev, stickers: [...stickers, item] };
    });
  };

  const beginMove = (event: ReactPointerEvent, id: string, x: number, y: number) => {
    capture(event);
    gesture.current = { kind: 'move', id, px: event.clientX, py: event.clientY, x, y };
    setSelected(id);
    raiseSticker(id);
  };

  const beginScale = (event: ReactPointerEvent, id: string) => {
    capture(event);
    const metrics = boxMetrics(id);
    const placed = pointOnSheet(event.clientX, event.clientY);
    if (!metrics || !placed) return;
    const current = decorRef.current;
    const sticker = current.stickers.find((item) => item.id === id);
    gesture.current = {
      kind: 'scale',
      id,
      cx: metrics.cx,
      cy: metrics.cy,
      startDist: Math.max(12, Math.hypot(placed.x - metrics.cx, placed.y - metrics.cy)),
      size: sticker?.size ?? 96,
      font: current.textSize,
      widthPx: metrics.widthPx,
      height: metrics.height,
    };
    setSelected(id);
  };

  const beginWidth = (event: ReactPointerEvent, handle: 'e' | 'w') => {
    capture(event);
    const metrics = boxMetrics('text');
    if (!metrics) return;
    gesture.current = {
      kind: 'width',
      id: 'text',
      handle,
      cx: metrics.cx,
      cy: metrics.cy,
      px: event.clientX,
      py: event.clientY,
      rotation: decorRef.current.textRotation,
      widthPx: metrics.widthPx,
      height: metrics.height,
    };
    setSelected('text');
  };

  const beginRotate = (event: ReactPointerEvent, id: string, rotation: number) => {
    capture(event);
    const metrics = boxMetrics(id);
    const placed = pointOnSheet(event.clientX, event.clientY);
    if (!metrics || !placed) return;
    gesture.current = {
      kind: 'rotate',
      id,
      cx: metrics.cx,
      cy: metrics.cy,
      startAngle: Math.atan2(placed.y - metrics.cy, placed.x - metrics.cx),
      rotation,
    };
    setSelected(id);
  };

  useEffect(() => {
    const apply = (event: PointerEvent) => {
      const current = gesture.current;
      const placed = pointOnSheet(event.clientX, event.clientY);
      if (!current || !placed) return;
      if (current.kind === 'move') {
        const x = clamp(current.x + ((event.clientX - current.px) / placed.rect.width) * 100, 0, 80);
        const y = clamp(current.y + ((event.clientY - current.py) / placed.rect.height) * 100, 0, 80);
        update((prev) => current.id === 'text'
          ? { ...prev, textX: x, textY: y }
          : { ...prev, stickers: prev.stickers.map((item) => (item.id === current.id ? { ...item, x, y } : item)) });
        return;
      }
      if (current.kind === 'rotate') {
        const angle = Math.atan2(placed.y - current.cy, placed.x - current.cx);
        const rotation = wrapDegrees(current.rotation + ((angle - current.startAngle) * 180) / Math.PI);
        update((prev) => current.id === 'text'
          ? { ...prev, textRotation: rotation }
          : { ...prev, stickers: prev.stickers.map((item) => (item.id === current.id ? { ...item, rotation } : item)) });
        return;
      }
      if (current.kind === 'scale') {
        const dist = Math.max(12, Math.hypot(placed.x - current.cx, placed.y - current.cy));
        const scale = dist / current.startDist;
        if (current.id === 'text') {
          const textSize = clamp(Math.round(current.font * scale), 12, 64);
          const height = current.height * (textSize / current.font);
          const textX = clamp(((current.cx - current.widthPx / 2) / placed.rect.width) * 100, 0, 80);
          const textY = clamp(((current.cy - height / 2) / placed.rect.height) * 100, 0, 80);
          update((prev) => ({ ...prev, textSize, textX, textY }));
          return;
        }
        const size = clamp(Math.round(current.size * scale), 48, 220);
        const height = current.height * (size / current.size);
        const x = clamp(((current.cx - size / 2) / placed.rect.width) * 100, 0, 80);
        const y = clamp(((current.cy - height / 2) / placed.rect.height) * 100, 0, 80);
        update((prev) => ({
          ...prev,
          stickers: prev.stickers.map((item) => (item.id === current.id ? { ...item, size, x, y } : item)),
        }));
        return;
      }
      const rad = (current.rotation * Math.PI) / 180;
      const dx = event.clientX - current.px;
      const dy = event.clientY - current.py;
      const localDx = dx * Math.cos(rad) + dy * Math.sin(rad);
      const sign = current.handle === 'e' ? 1 : -1;
      const widthPx = clamp(current.widthPx + localDx * sign, placed.rect.width * 0.24, placed.rect.width * 0.92);
      const shift = ((widthPx - current.widthPx) / 2) * sign;
      const cx = current.cx + Math.cos(rad) * shift;
      const cy = current.cy + Math.sin(rad) * shift;
      const textWidth = clamp((widthPx / placed.rect.width) * 100, 24, 92);
      const textX = clamp(((cx - widthPx / 2) / placed.rect.width) * 100, 0, 80);
      const textY = clamp(((cy - current.height / 2) / placed.rect.height) * 100, 0, 80);
      update((prev) => ({ ...prev, textWidth, textX, textY }));
    };
    const end = (event: PointerEvent, edit: boolean) => {
      const current = gesture.current;
      if (!current) return;
      const moved = current.kind === 'move' ? Math.hypot(event.clientX - current.px, event.clientY - current.py) : 99;
      gesture.current = null;
      saveDiaryDecor(date, decorRef.current);
      if (edit && current.kind === 'move' && current.id === 'text' && moved < 6) {
        setDraft(textValue.current);
        setTextEditing(true);
      }
    };
    const up = (event: PointerEvent) => end(event, true);
    const cancel = (event: PointerEvent) => end(event, false);
    window.addEventListener('pointermove', apply);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    return () => {
      window.removeEventListener('pointermove', apply);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
    };
  }, [date, saveDiaryDecor]);

  useEffect(() => {
    if (!textEditing) return;
    const node = inputRef.current;
    if (!node) return;
    node.focus();
    const length = node.value.length;
    node.setSelectionRange(length, length);
    node.style.height = 'auto';
    node.style.height = `${node.scrollHeight}px`;
  }, [textEditing]);

  const addSticker = (stickerId: string) => {
    if (decor.stickers.length >= MAX_STICKERS) {
      showToast('스티커는 20개까지 붙일 수 있어요.');
      return;
    }
    const offset = decor.stickers.length % 5;
    const placed: PlacedSticker = {
      id: uid(),
      stickerId,
      x: 28 + offset * 8,
      y: 34 + (offset % 3) * 8,
      size: 96,
      rotation: 0,
    };
    commit({ ...decor, stickers: [...decor.stickers, placed] });
    setSelected(placed.id);
  };

  const selectedSticker = decor.stickers.find((item) => item.id === selected);
  const editingText = selected === 'text';
  const textStyle = {
    fontSize: decor.textSize,
    textAlign: decor.textAlign,
    fontFamily: diaryFontFamily(decor.textFont),
  };
  const alignIcon = { left: AlignLeft, center: AlignCenter, right: AlignRight };

  const chrome = (id: string, text: boolean) => (
    <div className="transform-chrome">
      <span className="transform-bounds" />
      <span className="rotate-stem" />
      <button
        type="button"
        className="rotate-handle"
        aria-label="회전"
        onPointerDown={(event) => beginRotate(event, id, text ? decor.textRotation : selectedSticker?.rotation ?? 0)}
      >
        <RotateCw size={12} />
      </button>
      {HANDLES.map((handle) => (
        <button
          key={handle}
          type="button"
          className={cx('resize-handle', `is-${handle}`)}
          aria-label={text && (handle === 'e' || handle === 'w') ? '글 칸 너비' : '크기'}
          onPointerDown={(event) => {
            if (text && (handle === 'e' || handle === 'w')) beginWidth(event, handle);
            else beginScale(event, id);
          }}
        />
      ))}
    </div>
  );

  return (
    <div className="page diary-editor">
      <PageHeader title="다이어리 꾸미기" onBack={onBack} />
      <div className="paper-picks" role="group" aria-label="페이지 디자인">
        {PAPERS.map((paper) => (
          <button
            key={paper.id}
            type="button"
            className={cx('paper-pick', decor.paper === paper.id && 'is-on')}
            aria-pressed={decor.paper === paper.id}
            onClick={() => patch({ paper: paper.id })}
          >
            {paper.name}
          </button>
        ))}
      </div>
      <div
        ref={sheetRef}
        className={cx('diary-sheet', `is-${decor.paper}`)}
        onPointerDown={(event) => {
          if (event.target === event.currentTarget) setSelected(null);
        }}
      >
        <div
          data-object="text"
          className={cx('transform-box', editingText && 'is-selected', textEditing && 'is-editing')}
          style={{ left: `${decor.textX}%`, top: `${decor.textY}%`, width: `${decor.textWidth}%`, transform: `rotate(${decor.textRotation}deg)` }}
          onPointerDown={(event) => {
            if (textEditing) return;
            beginMove(event, 'text', decor.textX, decor.textY);
          }}
        >
          {textEditing ? (
            <textarea
              ref={inputRef}
              className="placed-text is-input"
              value={draft}
              maxLength={500}
              rows={1}
              placeholder="글을 적어 보세요"
              style={textStyle}
              onChange={(event) => {
                setDraft(event.target.value);
                event.target.style.height = 'auto';
                event.target.style.height = `${event.target.scrollHeight}px`;
              }}
              onBlur={() => {
                saveDiaryDecor(date, { text: draft, textFont: decor.textFont, textAlign: decor.textAlign });
                setTextEditing(false);
              }}
              onPointerDown={(event) => event.stopPropagation()}
            />
          ) : (
            <p className={cx('placed-text', !entry?.text && 'is-placeholder')} style={textStyle}>
              {entry?.text || '글을 적어 보세요'}
            </p>
          )}
          {editingText && !textEditing && chrome('text', true)}
        </div>
        {decor.stickers.map((item) => {
          const art = stickerArt(item.stickerId);
          const src = art?.src ?? customSources[item.stickerId];
          const name = art?.name ?? data.customStickers.find((sticker) => sticker.id === item.stickerId)?.name ?? '내 스티커';
          if (!src) return null;
          const on = selected === item.id;
          return (
            <div
              key={item.id}
              data-object={item.id}
              className={cx('transform-box', on && 'is-selected')}
              style={{ left: `${item.x}%`, top: `${item.y}%`, width: item.size, transform: `rotate(${item.rotation}deg)` }}
              onPointerDown={(event) => beginMove(event, item.id, item.x, item.y)}
            >
              <img className="placed-sticker" src={src} alt={name} draggable={false} />
              {on && (
                <button
                  type="button"
                  className="sticker-remove"
                  aria-label="스티커 빼기"
                  onPointerDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                  }}
                  onClick={() => {
                    patch({ stickers: decor.stickers.filter((sticker) => sticker.id !== item.id) });
                    setSelected(null);
                  }}
                >
                  <X size={12} strokeWidth={3} />
                </button>
              )}
              {on && chrome(item.id, false)}
            </div>
          );
        })}
      </div>
      {editingText && (
        <div className="text-tools">
          <div className="font-picks" role="group" aria-label="글씨체">
            {DIARY_FONTS.map((font) => (
              <button
                key={font.id}
                type="button"
                className={cx('font-pick', decor.textFont === font.id && 'is-on')}
                style={{ fontFamily: font.family }}
                aria-pressed={decor.textFont === font.id}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => patch({ textFont: font.id })}
              >
                {font.name}
              </button>
            ))}
          </div>
          <div className="align-picks" role="group" aria-label="정렬">
            {DIARY_ALIGNS.map((align) => {
              const Icon = alignIcon[align.id];
              return (
                <button
                  key={align.id}
                  type="button"
                  className={cx('align-pick', decor.textAlign === align.id && 'is-on')}
                  aria-label={align.name}
                  aria-pressed={decor.textAlign === align.id}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => patch({ textAlign: align.id })}
                >
                  <Icon size={18} />
                </button>
              );
            })}
          </div>
        </div>
      )}
      <p className="sticker-note">주의: 배경이 투명한 PNG여야 해요.</p>
      <div className="sticker-tray" role="group" aria-label="스티커">
        {STICKER_GROUPS.map((group) => (
          <div key={group.cover.id} className="sticker-group">
            <button type="button" className="sticker-btn" aria-label={`${group.cover.name} 붙이기`} onClick={() => addSticker(group.cover.id)}>
              <img src={group.cover.src} alt="" draggable={false} />
            </button>
            {group.variants.length > 0 && (
              <div className="sticker-bubble">
                <div className="sticker-bubble-row" role="group" aria-label={`${group.cover.name} 종류`}>
                  {group.variants.map((sticker) => (
                    <button key={sticker.id} type="button" className="sticker-btn" aria-label={`${sticker.name} 붙이기`} onClick={() => addSticker(sticker.id)}>
                      <img src={sticker.src} alt="" draggable={false} />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        {data.customStickers.map((sticker) => (
          <div key={sticker.id} className="sticker-own">
            <button type="button" className="sticker-btn" aria-label={`${sticker.name} 붙이기`} onClick={() => addSticker(sticker.id)}>
              {customSources[sticker.id] ? <img src={customSources[sticker.id]} alt="" draggable={false} /> : null}
            </button>
            <button
              type="button"
              className="sticker-own-remove"
              aria-label={`${sticker.name} 지우기`}
              onClick={() => removeCustomSticker(sticker.id)}
            >
              <X size={10} strokeWidth={3} />
            </button>
          </div>
        ))}
        <label className="sticker-upload">
          올리기
          <input
            type="file"
            accept="image/png,.png"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              event.target.value = '';
              void addCustomSticker(file);
            }}
          />
        </label>
      </div>
    </div>
  );
}
