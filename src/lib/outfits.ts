/**
 * 옷 / 아이템 배치
 *
 * x, y, width 는 캐릭터 그림 기준 % 입니다.
 * x 0 = 그림 왼쪽, y 0 = 그림 위, width 100 = 캐릭터와 같은 너비.
 * 그림 파일 자체가 캐릭터 칸에 맞춰져 있으면 0, 0, 100 이면 됩니다.
 * 어긋나면 그 항목의 dress(옷 입히기 화면) 또는 record(레코드) 숫자만 바꾸세요.
 */
import cloth1Dress from '../../forest-img/change-clothes-cloth1.png';
import cloth2Dress from '../../forest-img/change-clothes-cloth2.png';
import cloth3Dress from '../../forest-img/change-clothes-cloth3.png';
import cloth4Dress from '../../forest-img/change-clothes-cloth4.png';
import cloth5Dress from '../../forest-img/change-clothes-cloth5.png';
import cloth6Dress from '../../forest-img/change-clothes-cloth6.png';
import cloth7Dress from '../../forest-img/change-clothes-cloth7.png';
import cloth8Dress from '../../forest-img/change-clothes-cloth8.png';
import cloth9Dress from '../../forest-img/change-clothes-cloth9.png';
import cloth10Dress from '../../forest-img/change-clothes-cloth10.png';
import cloth11Dress from '../../forest-img/change-clothes-cloth11.png';
import item1Dress from '../../forest-img/change-clothes-item1.png';
import item2Dress from '../../forest-img/change-clothes-item2.png';
import item3Dress from '../../forest-img/change-clothes-item3.png';
import item4Dress from '../../forest-img/change-clothes-item4.png';
import item5Dress from '../../forest-img/change-clothes-item5.png';
import item6Dress from '../../forest-img/change-clothes-item6.png';
import item7Dress from '../../forest-img/change-clothes-item7.png';
import item8Dress from '../../forest-img/change-clothes-item8.png';
import item9Dress from '../../forest-img/change-clothes-item9.png';
import cloth1Record from '../../forest-img/record-cloth1.png';
import cloth2Record from '../../forest-img/record-cloth2.png';
import cloth3Record from '../../forest-img/record-cloth3.png';
import cloth4Record from '../../forest-img/record-cloth4.png';
import cloth5Record from '../../forest-img/record-cloth5.png';
import cloth6Record from '../../forest-img/record-cloth6.png';
import cloth7Record from '../../forest-img/record-cloth7.png';
import cloth8Record from '../../forest-img/record-cloth8.png';
import cloth9Record from '../../forest-img/record-cloth9.png';
import cloth10Record from '../../forest-img/record-cloth10.png';
import cloth11Record from '../../forest-img/record-cloth11.png';
import item1Record from '../../forest-img/record-item1.png';
import item2Record from '../../forest-img/record-item2.png';
import item3Record from '../../forest-img/record-item3.png';
import item4Record from '../../forest-img/record-item4.png';
import item5Record from '../../forest-img/record-item5.png';
import item6Record from '../../forest-img/record-item6.png';
import item7Record from '../../forest-img/record-item7.png';
import item8Record from '../../forest-img/record-item8.png';
import item9Record from '../../forest-img/record-item9.png';

export type OutfitSpot = {
  x: number;
  y: number;
  width: number;
};

export type OutfitGroup = 'clothes' | 'item';

export type Outfit = {
  id: string;
  group: OutfitGroup;
  name: string;
  dressSrc: string;
  recordSrc: string;
  dress: OutfitSpot;
  record: OutfitSpot;
};

function spot(x = 0, y = 0, width = 100): OutfitSpot {
  return { x, y, width };
}

export const OUTFITS: Outfit[] = [
  { id: 'cloth1', group: 'clothes', name: '옷 1', dressSrc: cloth1Dress, recordSrc: cloth1Record, dress: spot(), record: spot() },
  { id: 'cloth2', group: 'clothes', name: '옷 2', dressSrc: cloth2Dress, recordSrc: cloth2Record, dress: spot(), record: spot() },
  { id: 'cloth3', group: 'clothes', name: '옷 3', dressSrc: cloth3Dress, recordSrc: cloth3Record, dress: spot(), record: spot() },
  { id: 'cloth4', group: 'clothes', name: '옷 4', dressSrc: cloth4Dress, recordSrc: cloth4Record, dress: spot(), record: spot() },
  { id: 'cloth5', group: 'clothes', name: '옷 5', dressSrc: cloth5Dress, recordSrc: cloth5Record, dress: spot(), record: spot() },
  { id: 'cloth6', group: 'clothes', name: '옷 6', dressSrc: cloth6Dress, recordSrc: cloth6Record, dress: spot(), record: spot() },
  { id: 'cloth7', group: 'clothes', name: '옷 7', dressSrc: cloth7Dress, recordSrc: cloth7Record, dress: spot(), record: spot() },
  { id: 'cloth8', group: 'clothes', name: '옷 8', dressSrc: cloth8Dress, recordSrc: cloth8Record, dress: spot(), record: spot() },
  { id: 'cloth9', group: 'clothes', name: '옷 9', dressSrc: cloth9Dress, recordSrc: cloth9Record, dress: spot(), record: spot() },
  { id: 'cloth10', group: 'clothes', name: '옷 10', dressSrc: cloth10Dress, recordSrc: cloth10Record, dress: spot(), record: spot() },
  { id: 'cloth11', group: 'clothes', name: '옷 11', dressSrc: cloth11Dress, recordSrc: cloth11Record, dress: spot(), record: spot() },
  { id: 'item1', group: 'item', name: '아이템 1', dressSrc: item1Dress, recordSrc: item1Record, dress: spot(), record: spot() },
  { id: 'item2', group: 'item', name: '아이템 2', dressSrc: item2Dress, recordSrc: item2Record, dress: spot(), record: spot() },
  { id: 'item3', group: 'item', name: '아이템 3', dressSrc: item3Dress, recordSrc: item3Record, dress: spot(), record: spot() },
  { id: 'item4', group: 'item', name: '아이템 4', dressSrc: item4Dress, recordSrc: item4Record, dress: spot(), record: spot() },
  { id: 'item5', group: 'item', name: '아이템 5', dressSrc: item5Dress, recordSrc: item5Record, dress: spot(), record: spot() },
  { id: 'item6', group: 'item', name: '아이템 6', dressSrc: item6Dress, recordSrc: item6Record, dress: spot(), record: spot() },
  { id: 'item7', group: 'item', name: '아이템 7', dressSrc: item7Dress, recordSrc: item7Record, dress: spot(), record: spot() },
  { id: 'item8', group: 'item', name: '아이템 8', dressSrc: item8Dress, recordSrc: item8Record, dress: spot(), record: spot() },
  { id: 'item9', group: 'item', name: '아이템 9', dressSrc: item9Dress, recordSrc: item9Record, dress: spot(), record: spot() },
];

export function outfitsIn(group: OutfitGroup): Outfit[] {
  return OUTFITS.filter((outfit) => outfit.group === group);
}

/**
 * 옷 입히기 버튼 순서.
 * 옷 2가 첫 칸, 옷 1이 둘째 칸이다. 앞의 FREE_COUNT칸은 기본으로 입을 수 있다.
 * 그 다음부터 PRICE_GROUP개씩 묶이고, 묶음이 내려갈 때마다 잎이 PRICE_STEP개씩 오른다.
 * 첫 잠금 묶음은 잎 PRICE_STEP개.
 */
export const CLOTH_SHOP_ORDER = [
  'cloth2',
  'cloth1',
  'cloth3',
  'cloth4',
  'cloth5',
  'cloth6',
  'cloth7',
  'cloth8',
  'cloth9',
  'cloth10',
  'cloth11',
] as const;

export const ITEM_SHOP_ORDER = [
  'item1',
  'item2',
  'item3',
  'item4',
  'item5',
  'item6',
  'item7',
  'item8',
  'item9',
] as const;

export const OUTFIT_FREE_COUNT = 2;
export const OUTFIT_PRICE_GROUP = 3;
export const OUTFIT_PRICE_STEP = 5;
/** 집중 1시간당 잎 1개. */
export const LEAF_FOCUS_SEC = 60 * 60;

export function shopOutfits(group: OutfitGroup): Outfit[] {
  const order = group === 'clothes' ? CLOTH_SHOP_ORDER : ITEM_SHOP_ORDER;
  return order.map((id) => findOutfit(id)).filter((outfit): outfit is Outfit => Boolean(outfit));
}

export function outfitPrice(id: string): number {
  const outfit = findOutfit(id);
  if (!outfit) return 0;
  const order: readonly string[] = outfit.group === 'clothes' ? CLOTH_SHOP_ORDER : ITEM_SHOP_ORDER;
  const index = order.indexOf(id);
  if (index < OUTFIT_FREE_COUNT) return 0;
  const bundle = Math.floor((index - OUTFIT_FREE_COUNT) / OUTFIT_PRICE_GROUP);
  return OUTFIT_PRICE_STEP * (bundle + 1);
}

export function outfitUnlocked(id: string, owned: string[], developer: boolean): boolean {
  return developer || outfitPrice(id) === 0 || owned.includes(id);
}

export function wornAllowed(ids: string[], owned: string[], developer: boolean): string[] {
  if (developer) return ids;
  return ids.filter((id) => outfitUnlocked(id, owned, false));
}

export function spentOutfitLeaves(owned: string[]): number {
  return owned.reduce((sum, id) => sum + outfitPrice(id), 0);
}

export function earnedLeaves(totalSec: number): number {
  return Math.floor(Math.max(0, totalSec) / LEAF_FOCUS_SEC);
}

export function findOutfit(id: string): Outfit | undefined {
  return OUTFITS.find((outfit) => outfit.id === id);
}

export function isClothId(id: string): boolean {
  return OUTFITS.some((outfit) => outfit.group === 'clothes' && outfit.id === id);
}

export function isItemId(id: string): boolean {
  return OUTFITS.some((outfit) => outfit.group === 'item' && outfit.id === id);
}

/** 아래 옷. 옷 8이 겉옷으로 겹쳐질 때만 같이 남는다. */
export const LAYER_UNDER = 'cloth7';
/** 겉옷. 옷 7 위에만 겹친다. */
export const LAYER_OVER = 'cloth8';

/** 옷은 한 벌. 옷 7을 입고 옷 8을 고르면(또는 그 반대) 7이 아래, 8이 위다. */
export function nextClothIds(current: string[], id: string): string[] {
  if (current.includes(id)) return current.filter((item) => item !== id);
  const only = current.length === 1 ? current[0] : '';
  const stacks = (only === LAYER_UNDER && id === LAYER_OVER) || (only === LAYER_OVER && id === LAYER_UNDER);
  return stacks ? [LAYER_UNDER, LAYER_OVER] : [id];
}
