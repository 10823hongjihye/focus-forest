import type { DiaryAlign, DiaryFont } from '../types';

export const DIARY_FONTS: Array<{ id: DiaryFont; name: string; family: string }> = [
  { id: 'sans', name: '고딕', family: 'Pretendard, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif' },
  { id: 'serif', name: '명조', family: '"Nanum Myeongjo", Batang, serif' },
  { id: 'hand', name: '손글씨', family: 'Gaegu, cursive' },
];

export const DIARY_ALIGNS: Array<{ id: DiaryAlign; name: string }> = [
  { id: 'left', name: '왼쪽 정렬' },
  { id: 'center', name: '가운데 정렬' },
  { id: 'right', name: '오른쪽 정렬' },
];

const FONTS = new Set<string>(DIARY_FONTS.map((item) => item.id));
const ALIGNS = new Set<string>(DIARY_ALIGNS.map((item) => item.id));

export function readDiaryFont(value: unknown): DiaryFont {
  return typeof value === 'string' && FONTS.has(value) ? (value as DiaryFont) : 'sans';
}

export function readDiaryAlign(value: unknown): DiaryAlign {
  return typeof value === 'string' && ALIGNS.has(value) ? (value as DiaryAlign) : 'left';
}

export function diaryFontFamily(id: string | undefined) {
  return DIARY_FONTS.find((item) => item.id === id)?.family ?? DIARY_FONTS[0].family;
}
