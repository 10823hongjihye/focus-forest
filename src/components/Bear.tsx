import type { CharacterId } from '../types';
import { characterArt } from '../lib/characterArt';
import { OutfitLayers } from './OutfitLayers';

type BearProps = {
  character: CharacterId;
  size?: number;
  crop?: 'full' | 'face';
  wear?: { clothIds: string[]; itemIds: string[] };
};

export function Bear({ character, size = 120, crop = 'full', wear }: BearProps) {
  const art = characterArt(character);
  const src = crop === 'face' ? art.face : art.full;
  const img = <img className="bear-art" src={src} alt="" width={size} draggable={false} style={{ width: size, height: 'auto' }} />;
  if (crop === 'face' || !wear) return img;
  return (
    <span className="dressed-bear" style={{ width: size }}>
      <img className="bear-art" src={src} alt="" draggable={false} />
      <OutfitLayers where="dress" clothIds={wear.clothIds} itemIds={wear.itemIds} />
    </span>
  );
}

export function Spark({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden>
      <path d="M8 1.2 9.1 6 14 8 9.1 10 8 14.8 6.9 10 2 8 6.9 6 Z" fill="#E3B34C" />
    </svg>
  );
}
