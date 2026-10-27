import type { DiaryEntry } from '../types';
import { diaryFontFamily } from '../lib/diaryText';
import { stickerArt } from '../lib/stickers';
import { useCustomStickerSources } from '../hooks/useCustomStickerSources';
import { cx } from '../lib/cx';

export function DiaryCanvas({ entry }: { entry: DiaryEntry }) {
  const customSources = useCustomStickerSources(entry.stickers.map((item) => item.stickerId));
  const textStyle = {
    fontSize: entry.textSize,
    textAlign: entry.textAlign,
    fontFamily: diaryFontFamily(entry.textFont),
  };

  return (
    <div className={cx('diary-sheet', 'is-preview', `is-${entry.paper}`)} aria-label="꾸민 다이어리">
      {entry.text ? (
        <div
          className="transform-box"
          style={{ left: `${entry.textX}%`, top: `${entry.textY}%`, width: `${entry.textWidth}%`, transform: `rotate(${entry.textRotation}deg)` }}
        >
          <p className="placed-text" style={textStyle}>{entry.text}</p>
        </div>
      ) : null}
      {entry.stickers.map((item) => {
        const art = stickerArt(item.stickerId);
        const src = art?.src ?? customSources[item.stickerId];
        if (!src) return null;
        return (
          <div
            key={item.id}
            className="transform-box"
            style={{ left: `${item.x}%`, top: `${item.y}%`, width: item.size, transform: `rotate(${item.rotation}deg)` }}
          >
            <img className="placed-sticker" src={src} alt="" draggable={false} />
          </div>
        );
      })}
    </div>
  );
}
