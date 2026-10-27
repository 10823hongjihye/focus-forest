import type {
  CharacterId,
  CustomCategory,
  DecorId,
  Settings,
  SubjectId,
  ThemeId,
  TimerMode,
  TimerSnapshot,
} from '../types';
import { parseHex } from './color';
import natureForest from '../../forest-sound effect/nature forest.mp3';
import bossaNova from '../../forest-sound effect/bossa-nova.mp3';
import bossaNovaRestaurant from '../../forest-sound effect/bossa-nova-restaurant.mp3';
import christmasJazz from '../../forest-sound effect/christmas jazz.mp3';
import cozyJazz from '../../forest-sound effect/cozzy-jazz.mp3';
import lofiCozy from '../../forest-sound effect/lofi-cozzymood.mp3';
import lofiJazz from '../../forest-sound effect/lofi-jazz.mp3';
import pianoPop from '../../forest-sound effect/piano-pop.mp3';
import retroJazz from '../../forest-sound effect/retro-jazz.mp3';
import slowJazz from '../../forest-sound effect/slow-jazz.mp3';
import spookyMusic from '../../forest-sound effect/spooky-music.mp3';

export const DATA_KEY = 'focus-forest-v1';
export const TIMER_KEY = 'focus-forest-timer-v1';
export const HEARTBEAT_KEY = 'focus-forest-heartbeat-v1';

export const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;

export const THEME_PRESETS: Record<
  ThemeId,
  { id: ThemeId; name: string; desc: string; accent: string; bg: string }
> = {
  forest: {
    id: 'forest',
    name: '숲속 테마',
    desc: '초록빛 숲속에서 공부에 집중해요',
    accent: '#6F8B62',
    bg: '#F6F1E6',
  },
  ocean: {
    id: 'ocean',
    name: '바다 테마',
    desc: '잔잔한 바다와 함께 마음의 안정',
    accent: '#6E95A6',
    bg: '#F4F7F6',
  },
  mono: {
    id: 'mono',
    name: '흑백 테마',
    desc: '심플하고 깔끔한 집중 모드',
    accent: '#6A6A68',
    bg: '#F3F3F1',
  },
  vintage: {
    id: 'vintage',
    name: '빈티지 테마',
    desc: '따뜻한 감성의 빈티지 무드',
    accent: '#A07D55',
    bg: '#F7F1E6',
  },
};

export const THEME_ORDER: ThemeId[] = ['forest', 'ocean', 'mono', 'vintage'];

export const ACCENT_SWATCHES = ['#6F8B62', '#7EA184', '#5F8F86', '#6E95A6', '#A07D55', '#6A6A68'];
export const BG_SWATCHES = ['#F6F1E6', '#F3EEE4', '#EFE6D6', '#E7EFE8', '#F7F5F1', '#E6E4E0'];

export const CHARACTERS: Array<{ id: CharacterId; name: string; fur: string }> = [
  { id: 'cream', name: '크림', fur: '#F6E7D6' },
  { id: 'brown', name: '브라운', fur: '#C6A36E' },
  { id: 'gray', name: '그레이', fur: '#D4D0C8' },
  { id: 'charcoal', name: '차콜', fur: '#8E8984' },
];

export const SUBJECTS: Array<{ id: SubjectId; name: string }> = [
  { id: 'math', name: '수학' },
  { id: 'english', name: '영어' },
  { id: 'korean', name: '국어' },
  { id: 'history', name: '한국사' },
];

export const SUBJECT_COLORS: Record<SubjectId, { bg: string; fg: string }> = {
  math: { bg: '#E5F0E2', fg: '#5B7A52' },
  english: { bg: '#E3F0F4', fg: '#4E7C8C' },
  korean: { bg: '#F8EFE2', fg: '#8A6840' },
  history: { bg: '#F8EBE4', fg: '#8E5E42' },
};

export type Track = {
  id: string;
  title: string;
  artist: string;
  notes: number[];
  tint: string;
  src?: string;
};

const SONGS: Array<[string, string]> = [
  ['nature forest', natureForest],
  ['bossa nova', bossaNova],
  ['bossa nova restaurant', bossaNovaRestaurant],
  ['christmas jazz', christmasJazz],
  ['cozzy jazz', cozyJazz],
  ['lofi cozzymood', lofiCozy],
  ['lofi jazz', lofiJazz],
  ['piano pop', pianoPop],
  ['retro jazz', retroJazz],
  ['slow jazz', slowJazz],
  ['spooky music', spookyMusic],
];

export const SONG_TINTS = ['#8EAE78', '#C4A27A', '#8EB4A0', '#A7B0C4', '#C4A0B0', '#B7C48E', '#8EAEB4', '#C4B07A', '#A08EB4', '#7EA38A', '#C48E8E'];

export const TRACKS: Track[] = SONGS.map(([title, src], index) => ({
  id: title.replace(/\s+/g, '-'),
  title,
  artist: 'forest sound',
  notes: [261.63, 329.63, 392],
  tint: SONG_TINTS[index % SONG_TINTS.length],
  src,
}));

export const POMODORO_OPTIONS = [25, 50, 90] as const;

export function defaultSettings(): Settings {
  const theme = THEME_PRESETS.forest;
  return {
    theme: theme.id,
    accent: theme.accent,
    bg: theme.bg,
    character: 'cream',
    displayName: '지혜',
    dailyGoalMin: 360,
    timerMode: 'pomodoro',
    pomodoroMin: 50,
    musicEnabled: true,
    musicVolume: 0.6,
    notifications: false,
    subjectGoals: { math: 180, english: 180, korean: 150, history: 120 },
    customAccents: [],
    customBgColors: [],
    bgImage: '',
    savedBgImage: '',
    trackId: 'nature-forest',
    decor: 'desk',
    ownedDecor: ['desk'],
    spentLeaves: 0,
    fontScale: 1,
    clothIds: [],
    itemIds: [],
    ownedOutfitIds: [],
  };
}

export const GOAL_CHOICES = [
  { min: 60, label: '1시간' },
  { min: 120, label: '2시간' },
  { min: 180, label: '3시간' },
  { min: 240, label: '4시간' },
  { min: 360, label: '6시간' },
] as const;

export const SHOP_ITEMS: Array<{ id: DecorId; name: string; price: number }> = [
  { id: 'desk', name: '나무 책상', price: 0 },
  { id: 'lamp', name: '따뜻한 램프', price: 12 },
  { id: 'plant', name: '작은 화분', price: 8 },
  { id: 'cushion', name: '방석', price: 6 },
  { id: 'rug', name: '체크 러그', price: 16 },
  { id: 'shelf', name: '책장', price: 20 },
];

export const STICKERS = [
  { id: 'leaf', name: '잎' },
  { id: 'star', name: '별' },
  { id: 'bear', name: '곰' },
  { id: 'note', name: '음표' },
  { id: 'flower', name: '꽃' },
  { id: 'cup', name: '컵' },
] as const;

export function isDecorId(value: string): value is DecorId {
  return SHOP_ITEMS.some((item) => item.id === value);
}

export function isStickerId(value: string): boolean {
  return STICKERS.some((item) => item.id === value);
}

export function defaultTimer(mode: TimerMode = 'pomodoro', minutes = 50): TimerSnapshot {
  return {
    status: 'idle',
    subject: 'math',
    mode,
    targetSec: mode === 'pomodoro' ? minutes * 60 : 0,
    intervals: [],
  };
}

export function furOf(id: CharacterId): string {
  return CHARACTERS.find((character) => character.id === id)?.fur ?? '#F6E7D6';
}

export function subjectName(id: SubjectId): string {
  return SUBJECTS.find((subject) => subject.id === id)?.name ?? '공부';
}

export const CUSTOM_CATEGORY_TONES = [
  { bg: '#D4B8F2', fg: '#5A3A86' },
  { bg: '#F2B8D4', fg: '#8A3060' },
  { bg: '#F2E28A', fg: '#6A5208' },
  { bg: '#A8E4D8', fg: '#0E5C52' },
  { bg: '#E89090', fg: '#7A2828' },
  { bg: '#9BB0E8', fg: '#2A3E78' },
  { bg: '#B07BE0', fg: '#F7F4FF' },
  { bg: '#E07BB8', fg: '#6A2048' },
  { bg: '#D2B44A', fg: '#4A3A08' },
  { bg: '#5EBEAE', fg: '#083830' },
  { bg: '#D06060', fg: '#FFF6F4' },
  { bg: '#5A74C4', fg: '#F4F7FF' },
];

function colorDistance(a: string, b: string): number {
  const left = parseHex(a);
  const right = parseHex(b);
  if (!left || !right) return 0;
  return Math.hypot(left[0] - right[0], left[1] - right[1], left[2] - right[2]);
}

export function categoryColorFits(bg: string, used: Array<{ bg: string }>): boolean {
  const blocked = [...Object.values(SUBJECT_COLORS).map((tone) => tone.bg), ...used.map((tone) => tone.bg)];
  return blocked.every((color) => colorDistance(bg, color) >= 40);
}

export function nextCategoryTone(used: Array<{ bg: string }>): { bg: string; fg: string } {
  return (
    CUSTOM_CATEGORY_TONES.find((tone) => categoryColorFits(tone.bg, used)) ??
    CUSTOM_CATEGORY_TONES[used.length % CUSTOM_CATEGORY_TONES.length]
  );
}

export function isCustomCategoryId(id: string): boolean {
  return /^custom-[a-zA-Z0-9-]{8,80}$/.test(id);
}

export function categoryLabel(id: string, categories: CustomCategory[]): string {
  return SUBJECTS.find((subject) => subject.id === id)?.name ?? categories.find((category) => category.id === id)?.name ?? '기타';
}

export function categoryTone(id: string, categories: CustomCategory[] = []): { bg: string; fg: string } {
  if (id in SUBJECT_COLORS) return SUBJECT_COLORS[id as SubjectId];
  const custom = categories.find((category) => category.id === id);
  if (custom?.bg && custom?.fg) return { bg: custom.bg, fg: custom.fg };
  return nextCategoryTone(categories);
}
