import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { AppData, CustomCategory, CustomTrack, DecorId, DiaryEntry, Settings, StudySession, ThemeId, Todo } from '../types';
import { SHOP_ITEMS, SUBJECTS, THEME_PRESETS, isCustomCategoryId, nextCategoryTone } from '../lib/constants';
import { isStickerId } from '../lib/stickers';
import { MAX_CUSTOM_TRACKS, MAX_TRACK_BYTES, clearTrackBlobs, deleteTrackBlob, isMp3File, saveTrackBlob, titleFromFile } from '../lib/customMusic';
import { CUSTOM_STICKER_PREFIX, MAX_CUSTOM_STICKERS, MAX_STICKER_BYTES, clearStickerBlobs, deleteStickerBlob, hasPngSignature, isCustomStickerId, isPngFile, saveStickerBlob, stickerNameFromFile } from '../lib/customStickers';
import { earnedLeaves, isClothId, isItemId, nextClothIds, outfitPrice, spentOutfitLeaves } from '../lib/outfits';
import { createId, defaultData, hasStoredData, loadData, saveData } from '../lib/storage';
import { uid } from '../lib/time';

type AppStateValue = {
  data: AppData;
  toast: string | null;
  showToast: (message: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  applyTheme: (theme: ThemeId) => void;
  completeOnboarding: () => void;
  replayIntro: () => void;
  saveDiaryDecor: (date: string, patch: Partial<Pick<DiaryEntry, 'text' | 'stickers' | 'paper' | 'textX' | 'textY' | 'textSize' | 'textWidth' | 'textRotation' | 'textFont' | 'textAlign'>>) => void;
  buyDecor: (id: DecorId) => 'ok' | 'owned' | 'poor' | 'unknown';
  placeDecor: (id: DecorId) => void;
  addCategory: (name: string) => 'empty' | 'duplicate' | 'limit' | CustomCategory;
  removeCategory: (id: string) => void;
  addTodo: (todo: Omit<Todo, 'id' | 'createdAt' | 'done' | 'important'> & { done?: boolean }) => void;
  updateTodo: (id: string, patch: Partial<Pick<Todo, 'title' | 'subject' | 'importance' | 'done'>>) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  saveDiary: (date: string, text: string) => void;
  deleteDiary: (date: string) => void;
  addSessions: (items: Array<Omit<StudySession, 'id'>>) => void;
  deleteSession: (id: string) => void;
  addCustomTracks: (files: FileList | File[] | null) => Promise<void>;
  removeCustomTrack: (id: string) => void;
  addCustomSticker: (file: File | null) => Promise<void>;
  removeCustomSticker: (id: string) => void;
  wearCloth: (id: string) => void;
  toggleItem: (id: string) => void;
  buyOutfit: (id: string, liveSec: number) => 'ok' | 'owned' | 'poor' | 'unknown';
  resetAll: () => void;
  diaryFor: (date: string) => DiaryEntry | undefined;
};

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children, nickname }: { children: ReactNode; nickname?: string }) {
  const [data, setData] = useState<AppData>(() => {
    const exists = hasStoredData();
    const loaded = loadData();
    if (!exists && nickname) {
      return { ...loaded, settings: { ...loaded.settings, displayName: nickname.slice(0, 20) } };
    }
    return loaded;
  });
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef(0);

  useEffect(() => {
    saveData(data);
  }, [data]);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setData((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        ...patch,
        displayName: patch.displayName !== undefined ? patch.displayName.slice(0, 20) : prev.settings.displayName,
        fontScale:
          patch.fontScale !== undefined
            ? Math.min(1.3, Math.max(0.85, patch.fontScale))
            : prev.settings.fontScale,
      },
    }));
  }, []);

  const applyTheme = useCallback((theme: ThemeId) => {
    const preset = THEME_PRESETS[theme];
    setData((prev) => ({
      ...prev,
      settings: { ...prev.settings, theme, accent: preset.accent, bg: preset.bg, bgImage: '' },
    }));
  }, []);

  const completeOnboarding = useCallback(() => {
    setData((prev) => ({ ...prev, onboarded: true }));
    const url = new URL(window.location.href);
    if (!url.searchParams.has('intro')) return;
    url.searchParams.delete('intro');
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, []);

  const replayIntro = useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('intro', '1');
    window.history.pushState({}, '', `${url.pathname}${url.search}${url.hash}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, []);

  const addCategory = useCallback((raw: string): 'empty' | 'duplicate' | 'limit' | CustomCategory => {
    const name = raw.trim().replace(/\s+/g, ' ').slice(0, 16);
    if (!name) return 'empty';
    const taken = [...SUBJECTS.map((subject) => subject.name), ...data.categories.map((category) => category.name)];
    if (taken.some((item) => item.toLowerCase() === name.toLowerCase())) return 'duplicate';
    if (data.categories.length >= 20) return 'limit';
    const next = { id: `custom-${createId()}`, name, ...nextCategoryTone(data.categories) };
    setData((prev) => {
      const names = [...SUBJECTS.map((subject) => subject.name), ...prev.categories.map((category) => category.name)];
      if (names.some((item) => item.toLowerCase() === name.toLowerCase()) || prev.categories.length >= 20) return prev;
      return { ...prev, categories: [...prev.categories, { ...next, ...nextCategoryTone(prev.categories) }] };
    });
    return next;
  }, [data.categories]);

  const removeCategory = useCallback((id: string) => {
    if (!isCustomCategoryId(id)) return;
    let removed = false;
    setData((prev) => {
      if (!prev.categories.some((category) => category.id === id)) return prev;
      removed = true;
      return { ...prev, categories: prev.categories.filter((category) => category.id !== id) };
    });
    if (removed) showToast('카테고리를 지웠어요.');
  }, [showToast]);

  const addTodo = useCallback((todo: Omit<Todo, 'id' | 'createdAt' | 'done' | 'important'> & { done?: boolean }) => {
    const title = todo.title.trim();
    if (!title) return;
    const importance = clampImportance(todo.importance);
    const next: Todo = {
      id: createId(),
      title: title.slice(0, 80),
      subject: todo.subject,
      important: importance >= 4,
      importance,
      done: Boolean(todo.done),
      date: todo.date,
      createdAt: Date.now(),
    };
    setData((prev) => {
      if (!knownCategory(next.subject, prev.categories)) return prev;
      return { ...prev, todos: [next, ...prev.todos] };
    });
  }, []);

  const updateTodo = useCallback((id: string, patch: Partial<Pick<Todo, 'title' | 'subject' | 'importance' | 'done'>>) => {
    setData((prev) => ({
      ...prev,
      todos: prev.todos.map((todo) => {
        if (todo.id !== id) return todo;
        const title = patch.title !== undefined ? patch.title.trim().slice(0, 80) : todo.title;
        if (!title) return todo;
        const subject = patch.subject !== undefined && knownCategory(patch.subject, prev.categories) ? patch.subject : todo.subject;
        const importance = patch.importance !== undefined ? clampImportance(patch.importance) : todo.importance;
        return {
          ...todo,
          ...patch,
          title,
          subject,
          importance,
          important: importance >= 4,
        };
      }),
    }));
  }, []);

  const toggleTodo = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      todos: prev.todos.map((todo) => (todo.id === id ? { ...todo, done: !todo.done } : todo)),
    }));
  }, []);

  const deleteTodo = useCallback((id: string) => {
    setData((prev) => ({ ...prev, todos: prev.todos.filter((todo) => todo.id !== id) }));
  }, []);

  const saveDiary = useCallback((date: string, text: string) => {
    const trimmed = text.trim().slice(0, 500);
    setData((prev) => {
      const current = prev.diaries.find((entry) => entry.date === date);
      const rest = prev.diaries.filter((entry) => entry.date !== date);
      const stickers = current?.stickers ?? [];
      if (!trimmed && stickers.length === 0) return { ...prev, diaries: rest };
      return {
        ...prev,
        diaries: [...rest, {
          date,
          text: trimmed,
          stickers,
          paper: current?.paper ?? 'lines',
          textX: current?.textX ?? 8,
          textY: current?.textY ?? 12,
          textSize: current?.textSize ?? 16,
          textWidth: current?.textWidth ?? 70,
          textRotation: current?.textRotation ?? 0,
          textFont: current?.textFont ?? 'sans',
          textAlign: current?.textAlign ?? 'left',
          updatedAt: Date.now(),
        }],
      };
    });
  }, []);

  const saveDiaryDecor = useCallback((date: string, patch: Partial<Pick<DiaryEntry, 'text' | 'stickers' | 'paper' | 'textX' | 'textY' | 'textSize' | 'textWidth' | 'textRotation' | 'textFont' | 'textAlign'>>) => {
    setData((prev) => {
      const current = prev.diaries.find((entry) => entry.date === date);
      const rest = prev.diaries.filter((entry) => entry.date !== date);
      const text = (patch.text !== undefined ? patch.text : current?.text ?? '').trim().slice(0, 500);
      const stickers = (patch.stickers ?? current?.stickers ?? [])
        .filter((item) => isStickerId(item.stickerId))
        .slice(0, 20);
      if (!text && stickers.length === 0) return { ...prev, diaries: rest };
      return {
        ...prev,
        diaries: [...rest, {
          date,
          text,
          stickers,
          paper: patch.paper ?? current?.paper ?? 'lines',
          textX: patch.textX ?? current?.textX ?? 8,
          textY: patch.textY ?? current?.textY ?? 12,
          textSize: patch.textSize ?? current?.textSize ?? 16,
          textWidth: patch.textWidth ?? current?.textWidth ?? 70,
          textRotation: patch.textRotation ?? current?.textRotation ?? 0,
          textFont: patch.textFont ?? current?.textFont ?? 'sans',
          textAlign: patch.textAlign ?? current?.textAlign ?? 'left',
          updatedAt: Date.now(),
        }],
      };
    });
  }, []);

  const buyDecor = useCallback((id: DecorId): 'ok' | 'owned' | 'poor' | 'unknown' => {
    const item = SHOP_ITEMS.find((entry) => entry.id === id);
    if (!item) return 'unknown';
    let result: 'ok' | 'owned' | 'poor' = 'ok';
    setData((prev) => {
      if (prev.settings.ownedDecor.includes(id)) {
        result = 'owned';
        return prev;
      }
      const earned = Math.floor(prev.sessions.reduce((sum, session) => sum + session.durationSec, 0) / 300);
      const balance = Math.max(0, earned - prev.settings.spentLeaves);
      if (balance < item.price) {
        result = 'poor';
        return prev;
      }
      return {
        ...prev,
        settings: {
          ...prev.settings,
          ownedDecor: [...prev.settings.ownedDecor, id],
          spentLeaves: prev.settings.spentLeaves + item.price,
          decor: id,
        },
      };
    });
    return result;
  }, []);

  const placeDecor = useCallback((id: DecorId) => {
    setData((prev) => {
      if (!prev.settings.ownedDecor.includes(id)) return prev;
      return { ...prev, settings: { ...prev.settings, decor: id } };
    });
  }, []);

  const deleteDiary = useCallback((date: string) => {
    setData((prev) => ({ ...prev, diaries: prev.diaries.filter((entry) => entry.date !== date) }));
  }, []);

  const addSessions = useCallback((items: Array<Omit<StudySession, 'id'>>) => {
    if (items.length === 0) return;
    setData((prev) => ({
      ...prev,
      sessions: [...prev.sessions, ...items.map((item) => ({ ...item, id: createId() }))],
    }));
  }, []);

  const deleteSession = useCallback((id: string) => {
    setData((prev) => ({ ...prev, sessions: prev.sessions.filter((session) => session.id !== id) }));
  }, []);

  const addCustomTracks = useCallback(async (list: FileList | File[] | null) => {
    const files = list ? Array.from(list) : [];
    if (files.length === 0) return;
    const mp3 = files.filter(isMp3File);
    if (mp3.length === 0) {
      showToast('mp3 파일만 넣을 수 있어요.');
      return;
    }
    const sized = mp3.filter((file) => file.size > 0 && file.size <= MAX_TRACK_BYTES);
    if (sized.length === 0) {
      showToast('파일이 너무 커요. 20MB 이하만 넣을 수 있어요.');
      return;
    }
    const room = MAX_CUSTOM_TRACKS - data.customTracks.length;
    if (room <= 0) {
      showToast('음악은 20곡까지 넣을 수 있어요.');
      return;
    }
    const accepted = sized.slice(0, room);
    const records: Array<CustomTrack & { file: File }> = accepted.map((file) => ({
      id: `user-${createId()}`,
      title: titleFromFile(file.name),
      file,
    }));
    try {
      for (const record of records) await saveTrackBlob(record.id, record.file);
    } catch {
      showToast('음악을 저장하지 못했어요. 저장 공간을 확인해 주세요.');
      return;
    }
    setData((prev) => {
      const existing = new Set(prev.customTracks.map((track) => track.id));
      const next = [...prev.customTracks];
      for (const record of records) {
        if (existing.has(record.id) || next.length >= MAX_CUSTOM_TRACKS) continue;
        next.push({ id: record.id, title: record.title });
      }
      return { ...prev, customTracks: next };
    });
    const skipped = files.length !== accepted.length;
    showToast(skipped ? '일부 파일은 빼고 mp3를 추가했어요.' : '음악을 추가했어요.');
  }, [data.customTracks.length, showToast]);

  const removeCustomTrack = useCallback((id: string) => {
    if (!id.startsWith('user-')) return;
    let removed = false;
    setData((prev) => {
      if (!prev.customTracks.some((track) => track.id === id)) return prev;
      removed = true;
      return {
        ...prev,
        customTracks: prev.customTracks.filter((track) => track.id !== id),
        settings: prev.settings.trackId === id ? { ...prev.settings, trackId: 'nature-forest' } : prev.settings,
      };
    });
    if (!removed) return;
    void deleteTrackBlob(id).catch(() => undefined);
    showToast('음악을 지웠어요.');
  }, [showToast]);

  const addCustomSticker = useCallback(async (file: File | null) => {
    if (!file) return;
    if (!isPngFile(file) || !(await hasPngSignature(file))) {
      showToast('투명한 PNG 파일만 올릴 수 있어요.');
      return;
    }
    if (file.size > MAX_STICKER_BYTES) {
      showToast('스티커는 2MB 이하만 올릴 수 있어요.');
      return;
    }
    if (data.customStickers.length >= MAX_CUSTOM_STICKERS) {
      showToast('내 스티커는 20개까지 올릴 수 있어요.');
      return;
    }
    const id = `${CUSTOM_STICKER_PREFIX}${uid()}`;
    try {
      await saveStickerBlob(id, file);
    } catch {
      showToast('스티커를 저장하지 못했어요.');
      return;
    }
    setData((prev) => {
      if (prev.customStickers.some((item) => item.id === id) || prev.customStickers.length >= MAX_CUSTOM_STICKERS) return prev;
      return { ...prev, customStickers: [...prev.customStickers, { id, name: stickerNameFromFile(file.name) }] };
    });
  }, [data.customStickers.length, showToast]);

  const removeCustomSticker = useCallback((id: string) => {
    if (!isCustomStickerId(id)) return;
    let removed = false;
    setData((prev) => {
      if (!prev.customStickers.some((item) => item.id === id)) return prev;
      removed = true;
      return {
        ...prev,
        customStickers: prev.customStickers.filter((item) => item.id !== id),
        diaries: prev.diaries
          .map((entry) => ({ ...entry, stickers: entry.stickers.filter((item) => item.stickerId !== id) }))
          .filter((entry) => entry.text || entry.stickers.length > 0),
      };
    });
    if (!removed) return;
    void deleteStickerBlob(id).catch(() => undefined);
  }, []);

  const wearCloth = useCallback((id: string) => {
    if (!isClothId(id)) return;
    setData((current) => ({
      ...current,
      settings: { ...current.settings, clothIds: nextClothIds(current.settings.clothIds, id) },
    }));
  }, []);

  const toggleItem = useCallback((id: string) => {
    if (!isItemId(id)) return;
    setData((current) => ({
      ...current,
      settings: {
        ...current.settings,
        itemIds: current.settings.itemIds.includes(id) ? [] : [id],
      },
    }));
  }, []);

  const buyOutfit = useCallback((id: string, liveSec: number): 'ok' | 'owned' | 'poor' | 'unknown' => {
    const price = outfitPrice(id);
    if (price <= 0) return 'unknown';
    let result: 'ok' | 'owned' | 'poor' = 'ok';
    setData((current) => {
      if (current.settings.ownedOutfitIds.includes(id)) {
        result = 'owned';
        return current;
      }
      const studied = current.sessions.reduce((sum, session) => sum + session.durationSec, 0) + Math.max(0, liveSec);
      const balance = earnedLeaves(studied) - spentOutfitLeaves(current.settings.ownedOutfitIds);
      if (balance < price) {
        result = 'poor';
        return current;
      }
      return {
        ...current,
        settings: { ...current.settings, ownedOutfitIds: [...current.settings.ownedOutfitIds, id] },
      };
    });
    return result;
  }, []);

  const resetAll = useCallback(() => {
    setData(defaultData());
    void clearTrackBlobs().catch(() => undefined);
    void clearStickerBlobs().catch(() => undefined);
  }, []);

  const diaryFor = useCallback((date: string) => data.diaries.find((entry) => entry.date === date), [data.diaries]);

  const value = useMemo<AppStateValue>(
    () => ({
      data,
      toast,
      showToast,
      updateSettings,
      applyTheme,
      completeOnboarding,
      replayIntro,
      saveDiaryDecor,
      buyDecor,
      placeDecor,
      addCategory,
      removeCategory,
      addTodo,
      updateTodo,
      toggleTodo,
      deleteTodo,
      saveDiary,
      deleteDiary,
      addSessions,
      deleteSession,
      addCustomTracks,
      removeCustomTrack,
      addCustomSticker,
      removeCustomSticker,
      wearCloth,
      toggleItem,
      buyOutfit,
      resetAll,
      diaryFor,
    }),
    [
      data,
      toast,
      showToast,
      updateSettings,
      applyTheme,
      completeOnboarding,
      replayIntro,
      saveDiaryDecor,
      buyDecor,
      placeDecor,
      addCategory,
      removeCategory,
      addTodo,
      updateTodo,
      toggleTodo,
      deleteTodo,
      saveDiary,
      deleteDiary,
      addSessions,
      deleteSession,
      addCustomTracks,
      removeCustomTrack,
      addCustomSticker,
      removeCustomSticker,
      wearCloth,
      toggleItem,
      buyOutfit,
      resetAll,
      diaryFor,
    ],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('AppStateProvider가 필요합니다.');
  return ctx;
}

function knownCategory(id: string, categories: CustomCategory[]): boolean {
  return SUBJECTS.some((subject) => subject.id === id) || categories.some((category) => category.id === id);
}

function clampImportance(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(5, Math.max(1, Math.round(value)));
}
