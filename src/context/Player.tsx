import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { SONG_TINTS, TRACKS, type Track } from '../lib/constants';
import { loadTrackBlob } from '../lib/customMusic';
import { useAppState } from './AppState';

type PlayerValue = {
  tracks: Track[];
  trackIndex: number;
  playing: boolean;
  muted: boolean;
  order: 'one' | 'shuffle';
  track: Track;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  select: (index: number) => void;
  choose: (index: number) => void;
  playSelected: () => void;
  toggleOrder: () => void;
  toggleMute: () => void;
  stop: () => void;
};

const PlayerContext = createContext<PlayerValue | null>(null);

function wrapIndex(index: number, length: number): number {
  if (length === 0) return 0;
  return ((index % length) + length) % length;
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const { data, updateSettings, showToast } = useAppState();
  const [sources, setSources] = useState<Record<string, string>>({});
  const sourceUrls = useRef<Record<string, string>>({});
  const tracks = useMemo<Track[]>(
    () => [
      ...TRACKS,
      ...data.customTracks.map((song, index) => ({
        id: song.id,
        title: song.title,
        artist: '내 음악',
        notes: [261.63, 329.63, 392],
        tint: SONG_TINTS[(TRACKS.length + index) % SONG_TINTS.length],
        src: sources[song.id] ?? '',
      })),
    ],
    [data.customTracks, sources],
  );
  const tracksRef = useRef(tracks);
  tracksRef.current = tracks;
  const initialIndex = Math.max(0, tracks.findIndex((song) => song.id === data.settings.trackId));
  const [trackIndex, setTrackIndex] = useState(initialIndex === -1 ? 0 : initialIndex);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [order, setOrder] = useState<'one' | 'shuffle'>('one');
  const audio = useRef<HTMLAudioElement | null>(null);
  const indexRef = useRef(trackIndex);
  const playingRef = useRef(playing);
  const mutedRef = useRef(muted);
  const orderRef = useRef(order);
  const volumeRef = useRef(data.settings.musicVolume);
  const enabledRef = useRef(data.settings.musicEnabled);
  indexRef.current = trackIndex;
  playingRef.current = playing;
  mutedRef.current = muted;
  orderRef.current = order;
  volumeRef.current = data.settings.musicVolume;
  enabledRef.current = data.settings.musicEnabled;
  const track = tracks[trackIndex] ?? tracks[0];

  useEffect(() => {
    let cancelled = false;
    const ids = data.customTracks.map((song) => song.id);
    void (async () => {
      const next = { ...sourceUrls.current };
      const keep = new Set(ids);
      for (const [id, url] of Object.entries(next)) {
        if (keep.has(id)) continue;
        URL.revokeObjectURL(url);
        delete next[id];
      }
      for (const id of ids) {
        if (next[id]) continue;
        try {
          const blob = await loadTrackBlob(id);
          if (cancelled || !blob) continue;
          next[id] = URL.createObjectURL(blob);
        } catch {
          /* 저장소를 열지 못하면 그 곡은 목록에만 남고 재생은 나중에 다시 시도한다 */
        }
      }
      if (cancelled) return;
      sourceUrls.current = next;
      setSources({ ...next });
    })();
    return () => {
      cancelled = true;
    };
  }, [data.customTracks]);

  useEffect(() => {
    return () => {
      for (const url of Object.values(sourceUrls.current)) URL.revokeObjectURL(url);
    };
  }, []);

  useEffect(() => {
    if (tracks.length === 0) return;
    const found = tracks.findIndex((song) => song.id === data.settings.trackId);
    const next = found >= 0 ? found : 0;
    if (next === indexRef.current) return;
    indexRef.current = next;
    setTrackIndex(next);
  }, [tracks, data.settings.trackId]);

  const ensure = () => {
    if (!audio.current) {
      const element = new Audio();
      element.preload = 'auto';
      element.loop = true;
      audio.current = element;
    }
    return audio.current;
  };

  const remember = (index: number) => {
    const list = tracksRef.current;
    const safe = wrapIndex(index, list.length);
    const song = list[safe];
    setTrackIndex(safe);
    indexRef.current = safe;
    if (song && data.settings.trackId !== song.id) updateSettings({ trackId: song.id });
    return song;
  };

  const startFile = (song: Track | undefined, restart: boolean) => {
    if (!song?.src) {
      showToast('이 곡 파일을 찾지 못했어요.');
      setPlaying(false);
      return;
    }
    if (!enabledRef.current) {
      showToast('설정에서 음악이 꺼져 있어요. 타이머는 그대로 진행돼요.');
      setPlaying(false);
      return;
    }
    const file = ensure();
    const resolved = new URL(song.src, window.location.href).href;
    if (restart || file.src !== resolved) file.src = song.src;
    file.loop = orderRef.current === 'one';
    file.volume = mutedRef.current ? 0 : volumeRef.current;
    if (volumeRef.current <= 0) showToast('음량이 0이라 소리가 나지 않아요. 소리 조절에서 올려 주세요.');
    void file.play().catch(() => {
      setPlaying(false);
      playingRef.current = false;
      showToast('브라우저가 재생을 막았어요. 재생 버튼을 한 번 더 눌러 주세요.');
    });
  };

  const startFileRef = useRef(startFile);
  const rememberRef = useRef(remember);
  startFileRef.current = startFile;
  rememberRef.current = remember;

  useEffect(() => {
    const file = ensure();
    const onEnded = () => {
      if (orderRef.current !== 'shuffle' || tracksRef.current.length === 0) return;
      let next = Math.floor(Math.random() * tracksRef.current.length);
      if (tracksRef.current.length > 1 && next === indexRef.current) next = (next + 1) % tracksRef.current.length;
      const song = rememberRef.current(next);
      setPlaying(true);
      playingRef.current = true;
      startFileRef.current(song, true);
    };
    file.addEventListener('ended', onEnded);
    return () => {
      file.removeEventListener('ended', onEnded);
      file.pause();
    };
  }, []);

  useEffect(() => {
    const file = audio.current;
    if (!file) return;
    file.loop = order === 'one';
    file.volume = muted || !data.settings.musicEnabled ? 0 : data.settings.musicVolume;
    if (!playing) file.pause();
  }, [playing, muted, order, data.settings.musicEnabled, data.settings.musicVolume]);

  const value = useMemo<PlayerValue>(
    () => ({
      tracks,
      trackIndex,
      playing,
      muted,
      order,
      track,
      toggle: () => {
        if (playingRef.current) {
          setPlaying(false);
          playingRef.current = false;
          audio.current?.pause();
          return;
        }
        setPlaying(true);
        playingRef.current = true;
        startFile(tracksRef.current[indexRef.current], false);
      },
      next: () => {
        const song = remember(indexRef.current + 1);
        if (!playingRef.current) return;
        startFile(song, true);
      },
      prev: () => {
        const song = remember(indexRef.current - 1);
        if (!playingRef.current) return;
        startFile(song, true);
      },
      select: (index: number) => {
        remember(index);
      },
      choose: (index: number) => {
        const song = tracksRef.current[wrapIndex(index, tracksRef.current.length)];
        const file = audio.current;
        const resolved = song?.src ? new URL(song.src, window.location.href).href : '';
        const same = Boolean(file && resolved && file.src === resolved && playingRef.current && !file.paused);
        remember(index);
        if (same) return;
        if (mutedRef.current) {
          mutedRef.current = false;
          setMuted(false);
        }
        setPlaying(true);
        playingRef.current = true;
        startFile(song, true);
      },
      playSelected: () => {
        const song = tracksRef.current[indexRef.current];
        const file = audio.current;
        const resolved = song?.src ? new URL(song.src, window.location.href).href : '';
        const same = Boolean(file && resolved && file.src === resolved && playingRef.current && !file.paused && !mutedRef.current);
        if (mutedRef.current) {
          mutedRef.current = false;
          setMuted(false);
        }
        if (same) return;
        setPlaying(true);
        playingRef.current = true;
        startFile(song, false);
      },
      toggleOrder: () => setOrder((mode) => (mode === 'one' ? 'shuffle' : 'one')),
      toggleMute: () => {
        setMuted((value) => {
          const next = !value;
          mutedRef.current = next;
          const file = audio.current;
          if (file) file.volume = next ? 0 : volumeRef.current;
          if (!next && playingRef.current) void file?.play().catch(() => undefined);
          if (next) file?.pause();
          return next;
        });
      },
      stop: () => {
        setPlaying(false);
        playingRef.current = false;
        audio.current?.pause();
      },
    }),
    [tracks, trackIndex, playing, muted, order, track, data.settings.trackId, data.settings.musicEnabled, showToast, updateSettings],
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer(): PlayerValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('PlayerProvider가 필요합니다.');
  return ctx;
}
