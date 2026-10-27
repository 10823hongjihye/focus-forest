import type {
  AppData,
  CharacterId,
  CustomCategory,
  CustomTrack,
  DiaryEntry,
  Settings,
  StudySession,
  SubjectId,
  ThemeId,
  TimerMode,
  TimerSnapshot,
  Todo,
} from '../types';
import { normalizeHex } from './color';
import { ACCENT_SWATCHES, BG_SWATCHES, DATA_KEY, HEARTBEAT_KEY, TIMER_KEY, categoryColorFits, defaultSettings, defaultTimer, isCustomCategoryId, isDecorId, isStickerId, nextCategoryTone } from './constants';
import { LAYER_OVER, LAYER_UNDER, isClothId, isItemId, outfitPrice } from './outfits';
import { uid } from './time';

let dataKey = DATA_KEY;
let timerKey = TIMER_KEY;
let heartbeatKey = HEARTBEAT_KEY;

/** 개발자는 기존 저장소를 쓰고, 일반 사용자는 계정마다 기록을 나눕니다. */
export function setStorageScope(scope: 'developer' | string): void {
  if (scope === 'developer') {
    dataKey = DATA_KEY;
    timerKey = TIMER_KEY;
    heartbeatKey = HEARTBEAT_KEY;
    return;
  }
  const safe = scope.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80) || 'user';
  dataKey = `${DATA_KEY}::${safe}`;
  timerKey = `${TIMER_KEY}::${safe}`;
  heartbeatKey = `${HEARTBEAT_KEY}::${safe}`;
}

export function hasStoredData(): boolean {
  return store.get(dataKey) != null;
}

const THEMES: ThemeId[] = ['forest', 'ocean', 'mono', 'vintage'];
const SUBJECTS: SubjectId[] = ['math', 'english', 'korean', 'history'];
const CHARACTERS: CharacterId[] = ['cream', 'brown', 'gray', 'charcoal'];
const MODES: TimerMode[] = ['pomodoro', 'countup'];

const memory = new Map<string, string>();

export const store = {
  get(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return memory.get(key) ?? null;
    }
  },
  set(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      memory.set(key, value);
    }
  },
  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      memory.delete(key);
    }
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isTheme(value: unknown): value is ThemeId {
  return typeof value === 'string' && THEMES.includes(value as ThemeId);
}

function isSubject(value: unknown): value is SubjectId {
  return typeof value === 'string' && SUBJECTS.includes(value as SubjectId);
}

function isStudySubject(value: unknown): value is string {
  return typeof value === 'string' && (isSubject(value) || isCustomCategoryId(value));
}

function isCharacter(value: unknown): value is CharacterId {
  return typeof value === 'string' && CHARACTERS.includes(value as CharacterId);
}

function isMode(value: unknown): value is TimerMode {
  return typeof value === 'string' && MODES.includes(value as TimerMode);
}

function readSettings(value: unknown): Settings {
  const base = defaultSettings();
  if (!isRecord(value)) return base;
  const goals = isRecord(value.subjectGoals) ? value.subjectGoals : {};
  return {
    theme: isTheme(value.theme) ? value.theme : base.theme,
    accent: typeof value.accent === 'string' ? value.accent : base.accent,
    bg: typeof value.bg === 'string' ? value.bg : base.bg,
    character: isCharacter(value.character) ? value.character : base.character,
    displayName: typeof value.displayName === 'string' ? value.displayName.slice(0, 20) : base.displayName,
    dailyGoalMin: clampNumber(value.dailyGoalMin, 30, 720, base.dailyGoalMin),
    timerMode: isMode(value.timerMode) ? value.timerMode : base.timerMode,
    pomodoroMin: clampNumber(value.pomodoroMin, 5, 180, base.pomodoroMin),
    musicEnabled: typeof value.musicEnabled === 'boolean' ? value.musicEnabled : base.musicEnabled,
    musicVolume: clampNumber(value.musicVolume, 0, 1, base.musicVolume),
    notifications: typeof value.notifications === 'boolean' ? value.notifications : base.notifications,
    subjectGoals: {
      math: clampNumber(goals.math, 10, 2400, base.subjectGoals.math),
      english: clampNumber(goals.english, 10, 2400, base.subjectGoals.english),
      korean: clampNumber(goals.korean, 10, 2400, base.subjectGoals.korean),
      history: clampNumber(goals.history, 10, 2400, base.subjectGoals.history),
    },
    customAccents: readHexList(value.customAccents, ACCENT_SWATCHES),
    customBgColors: readHexList(value.customBgColors, BG_SWATCHES),
    bgImage: readImage(value.bgImage),
    savedBgImage: readImage(value.savedBgImage),
    trackId: typeof value.trackId === 'string' && value.trackId.trim() ? value.trackId.slice(0, 80) : base.trackId,
    decor: typeof value.decor === 'string' && isDecorId(value.decor) ? value.decor : base.decor,
    ownedDecor: readDecor(value.ownedDecor),
    spentLeaves: clampNumber(value.spentLeaves, 0, 100000, 0),
    fontScale: clampNumber(value.fontScale, 0.85, 1.3, base.fontScale),
    clothIds: readClothIds(value.clothIds, value.clothId),
    itemIds: readItemIds(value.itemIds),
    ownedOutfitIds: readOwnedOutfits(value.ownedOutfitIds),
  };
}

function readClothIds(list: unknown, legacy: unknown): string[] {
  const raw = Array.isArray(list) ? list : typeof legacy === 'string' && legacy ? [legacy] : [];
  const ids: string[] = [];
  for (const item of raw) {
    if (typeof item !== 'string' || !isClothId(item) || ids.includes(item)) continue;
    ids.push(item);
  }
  if (ids.includes(LAYER_UNDER) && ids.includes(LAYER_OVER) && ids.length === 2) return [LAYER_UNDER, LAYER_OVER];
  return ids.slice(-1);
}

function readItemIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const ids: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string' || !isItemId(item) || ids.includes(item)) continue;
    ids.push(item);
  }
  return ids.slice(-1);
}

function readOwnedOutfits(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const ids: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string' || outfitPrice(item) <= 0 || ids.includes(item)) continue;
    if (!isClothId(item) && !isItemId(item)) continue;
    ids.push(item);
  }
  return ids;
}

function readDecor(value: unknown): Settings['ownedDecor'] {
  const ids = Array.isArray(value) ? value.filter((item): item is Settings['ownedDecor'][number] => typeof item === 'string' && isDecorId(item)) : [];
  return ids.includes('desk') ? [...new Set(ids)] : ['desk', ...new Set(ids)];
}

function readStickers(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const ids: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string' || !isStickerId(item) || ids.includes(item)) continue;
    ids.push(item);
    if (ids.length >= 8) break;
  }
  return ids;
}

function readHexList(value: unknown, presets: string[]): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set(presets.map((hex) => hex.toLowerCase()));
  const colors: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string') continue;
    const hex = normalizeHex(item);
    if (!hex || seen.has(hex.toLowerCase())) continue;
    seen.add(hex.toLowerCase());
    colors.push(hex);
    if (colors.length >= 16) break;
  }
  return colors;
}

function readImage(value: unknown): string {
  if (typeof value !== 'string' || !value.startsWith('data:image/')) return '';
  if (value.length > 1_200_000) return '';
  return value;
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function isTodoCategory(value: unknown): value is string {
  return (typeof value === 'string' && isSubject(value)) || (typeof value === 'string' && isCustomCategoryId(value));
}

function readImportance(value: unknown, important: boolean): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (Number.isFinite(n)) return Math.min(5, Math.max(0, Math.round(n)));
  return important ? 5 : 0;
}

function readTodo(value: unknown): Todo | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== 'string' || typeof value.title !== 'string' || typeof value.date !== 'string') return null;
  if (!isTodoCategory(value.subject)) return null;
  const important = Boolean(value.important);
  const importance = readImportance(value.importance, important);
  return {
    id: value.id,
    title: value.title.slice(0, 80),
    subject: value.subject,
    important: importance >= 4 || important,
    importance,
    done: Boolean(value.done),
    date: value.date,
    createdAt: typeof value.createdAt === 'number' ? value.createdAt : Date.now(),
  };
}

function readCategory(value: unknown): CustomCategory | null {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.name !== 'string') return null;
  if (!isCustomCategoryId(value.id)) return null;
  const name = value.name.trim().replace(/\s+/g, ' ').slice(0, 16);
  if (!name) return null;
  const bg = typeof value.bg === 'string' ? normalizeHex(value.bg) ?? '' : '';
  const fg = typeof value.fg === 'string' ? normalizeHex(value.fg) ?? '' : '';
  return { id: value.id, name, bg, fg };
}

function readDiary(value: unknown): DiaryEntry | null {
  if (!isRecord(value)) return null;
  if (typeof value.date !== 'string' || typeof value.text !== 'string') return null;
  const text = value.text.trim().slice(0, 500);
  const stickers = readStickers(value.stickers);
  if (!text && stickers.length === 0) return null;
  return {
    date: value.date,
    text,
    stickers,
    updatedAt: typeof value.updatedAt === 'number' ? value.updatedAt : Date.now(),
  };
}

function readCustomTracks(value: unknown): CustomTrack[] {
  if (!Array.isArray(value)) return [];
  const tracks: CustomTrack[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    if (!isRecord(item) || typeof item.id !== 'string' || !item.id.startsWith('user-')) continue;
    const id = item.id.slice(0, 80);
    if (seen.has(id)) continue;
    seen.add(id);
    const title = typeof item.title === 'string' ? item.title.trim().replace(/\s+/g, ' ').slice(0, 40) : '';
    tracks.push({ id, title: title || '내 음악' });
    if (tracks.length >= 20) break;
  }
  return tracks;
}

function readSession(value: unknown): StudySession | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== 'string' || typeof value.date !== 'string' || !isStudySubject(value.subject)) return null;
  const durationSec = typeof value.durationSec === 'number' ? value.durationSec : 0;
  const startedAt = typeof value.startedAt === 'number' ? value.startedAt : 0;
  const endedAt = typeof value.endedAt === 'number' ? value.endedAt : startedAt;
  if (durationSec <= 0 || endedAt < startedAt) return null;
  return { id: value.id, date: value.date, subject: value.subject, durationSec, startedAt, endedAt };
}

export function defaultData(): AppData {
  return { settings: defaultSettings(), categories: [], customTracks: [], todos: [], diaries: [], sessions: [], onboarded: false };
}

export function loadData(): AppData {
  const raw = store.get(dataKey);
  if (!raw) return defaultData();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return defaultData();
    const categories = Array.isArray(parsed.categories)
      ? parsed.categories.map(readCategory).filter((item): item is CustomCategory => item !== null)
      : [];
    const known = new Set(categories.map((category) => category.name.toLowerCase()));
    const uniqueCategories = categories.filter((category) => {
      const key = category.name.toLowerCase();
      if (known.has(`used:${key}`)) return false;
      known.add(`used:${key}`);
      return true;
    });
    const paintedCategories: CustomCategory[] = [];
    for (const category of uniqueCategories) {
      if (category.bg && category.fg && categoryColorFits(category.bg, paintedCategories)) {
        paintedCategories.push(category);
      } else {
        paintedCategories.push({ ...category, ...nextCategoryTone(paintedCategories) });
      }
    }
    const todos = Array.isArray(parsed.todos) ? parsed.todos.map(readTodo).filter((item): item is Todo => item !== null) : [];
    const diaries = Array.isArray(parsed.diaries) ? parsed.diaries.map(readDiary).filter((item): item is DiaryEntry => item !== null) : [];
    const sessions = Array.isArray(parsed.sessions)
      ? parsed.sessions.map(readSession).filter((item): item is StudySession => item !== null)
      : [];
    return {
      settings: readSettings(parsed.settings),
      categories: paintedCategories,
      customTracks: readCustomTracks(parsed.customTracks),
      todos,
      diaries,
      sessions,
      onboarded: Boolean(parsed.onboarded),
    };
  } catch {
    return defaultData();
  }
}

export function saveData(data: AppData): void {
  store.set(dataKey, JSON.stringify(data));
}

function readInterval(value: unknown): { start: number; end: number | null } | null {
  if (!isRecord(value) || typeof value.start !== 'number') return null;
  const end = value.end === null || typeof value.end === 'number' ? value.end : null;
  return { start: value.start, end };
}

export function loadTimer(settings: Settings): TimerSnapshot {
  const fallback = defaultTimer(settings.timerMode, settings.pomodoroMin);
  const raw = store.get(timerKey);
  if (!raw) return fallback;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || !isStudySubject(parsed.subject) || !isMode(parsed.mode)) return fallback;
    const status = parsed.status === 'running' || parsed.status === 'paused' || parsed.status === 'idle' ? parsed.status : 'idle';
    const intervals = Array.isArray(parsed.intervals)
      ? parsed.intervals.map(readInterval).filter((item): item is { start: number; end: number | null } => item !== null)
      : [];
    const snapshot: TimerSnapshot = {
      status,
      subject: parsed.subject,
      mode: parsed.mode,
      targetSec: clampNumber(parsed.targetSec, 0, 12 * 3600, fallback.targetSec),
      intervals,
    };
    if (snapshot.status !== 'running') return snapshot;
    const beat = Number(store.get(heartbeatKey) || 0);
    if (!beat || Date.now() - beat > 120_000) {
      const at = beat || Date.now();
      return {
        ...snapshot,
        status: 'paused',
        intervals: snapshot.intervals.map((interval) => (interval.end == null ? { ...interval, end: at } : interval)),
      };
    }
    return snapshot;
  } catch {
    return fallback;
  }
}

export function saveTimer(snapshot: TimerSnapshot): void {
  store.set(timerKey, JSON.stringify(snapshot));
}

export function beatTimer(): void {
  store.set(heartbeatKey, String(Date.now()));
}

export function clearTimerStorage(): void {
  store.remove(timerKey);
  store.remove(heartbeatKey);
}

export function createId(): string {
  return uid();
}
