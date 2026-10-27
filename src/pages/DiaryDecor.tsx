import { ArtSlot } from '../components/ArtSlot';
import { PageHeader } from '../components/ui';
import { useAppState } from '../context/AppState';
import { STICKERS } from '../lib/constants';
import { cx } from '../lib/cx';

const MARK: Record<string, string> = {
  leaf: '잎',
  star: '별',
  bear: '곰',
  note: '음',
  flower: '꽃',
  cup: '컵',
};

export function DiaryDecor({ date, onBack }: { date: string; onBack: () => void }) {
  const { data, saveStickers } = useAppState();
  const entry = data.diaries.find((item) => item.date === date);
  const picked = entry?.stickers ?? [];

  const toggle = (id: string) => {
    const next = picked.includes(id) ? picked.filter((item) => item !== id) : [...picked, id].slice(0, 8);
    saveStickers(date, next);
  };

  return (
    <div className="page">
      <PageHeader title="다이어리 꾸미기" onBack={onBack} />
      <ArtSlot name="diary-page" className="art-diary">
        <p className={entry?.text ? 'diary-text' : 'muted'}>{entry?.text || '글을 쓰면 이 종이에 올라가요.'}</p>
        <div className="sticker-placed">
          {picked.map((id) => (
            <span key={id} className={`sticker s-${id}`}>
              {MARK[id] ?? '스티커'}
            </span>
          ))}
        </div>
      </ArtSlot>
      <div className="sticker-tray" role="group" aria-label="스티커">
        {STICKERS.map((sticker) => (
          <button key={sticker.id} type="button" className={cx('sticker-btn', picked.includes(sticker.id) && 'is-on')} aria-pressed={picked.includes(sticker.id)} aria-label={sticker.name} onClick={() => toggle(sticker.id)}>
            <ArtSlot name={`sticker-${sticker.id}`}>
              <span className={`sticker s-${sticker.id}`} aria-hidden="true" />
            </ArtSlot>
            {sticker.name}
          </button>
        ))}
      </div>
      <p className="muted">스티커 그림도 나중에 직접 만든 이미지로 바꿀 수 있어요.</p>
    </div>
  );
}
