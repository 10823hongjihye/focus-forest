import apple1 from '../../sitckers/apple1.png';
import apple2 from '../../sitckers/apple2.png';
import ribbon1 from '../../sitckers/ribbon1.png';
import ribbon2 from '../../sitckers/ribbon2.png';
import ribbon3 from '../../sitckers/ribbon3.png';
import ribbon4 from '../../sitckers/ribbon4.png';
import ribbon5 from '../../sitckers/ribbon5.png';
import ribbon6 from '../../sitckers/ribbon6.png';
import ribbon7 from '../../sitckers/ribbon7.png';
import ribbon8 from '../../sitckers/ribbon8.png';
import ribbon9 from '../../sitckers/ribbon9.png';
import ribbon10 from '../../sitckers/ribbon10.png';
import ribbon11 from '../../sitckers/ribbon11.png';

export const STICKER_ART = [
  { id: 'ribbon1', name: '리본 1', src: ribbon1 },
  { id: 'ribbon2', name: '리본 2', src: ribbon2 },
  { id: 'ribbon3', name: '리본 3', src: ribbon3 },
  { id: 'ribbon4', name: '리본 4', src: ribbon4 },
  { id: 'ribbon5', name: '리본 5', src: ribbon5 },
  { id: 'ribbon6', name: '리본 6', src: ribbon6 },
  { id: 'ribbon7', name: '리본 7', src: ribbon7 },
  { id: 'ribbon8', name: '리본 8', src: ribbon8 },
  { id: 'ribbon9', name: '리본 9', src: ribbon9 },
  { id: 'ribbon10', name: '리본 10', src: ribbon10 },
  { id: 'ribbon11', name: '리본 11', src: ribbon11 },
  { id: 'apple1', name: '사과 1', src: apple1 },
  { id: 'apple2', name: '사과 2', src: apple2 },
] as const;

export type StickerArt = (typeof STICKER_ART)[number];

export const STICKER_GROUPS: Array<{ cover: StickerArt; variants: StickerArt[] }> = [];

for (const item of STICKER_ART) {
  const family = item.id.replace(/\d+$/, '');
  const group = STICKER_GROUPS.find((entry) => entry.cover.id.replace(/\d+$/, '') === family);
  if (group) group.variants.push(item);
  else STICKER_GROUPS.push({ cover: item, variants: [] });
}

export function isStickerId(value: string): boolean {
  return STICKER_ART.some((item) => item.id === value) || value.startsWith('user-sticker-');
}

export function stickerArt(id: string) {
  return STICKER_ART.find((item) => item.id === id);
}
