import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ListMusic, Pause, Play, Repeat1, Shuffle, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { useAppState } from '../context/AppState';
import { usePlayer } from '../context/Player';
import { DECK_DESIGN } from '../lib/lpDesign';
import { cx } from '../lib/cx';

export function PlayerBar() {
  const player = usePlayer();
  const { data, updateSettings } = useAppState();
  const [open, setOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const anchor = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const volume = data.settings.musicVolume;
  const silent = player.muted || volume === 0;
  const deckStyle = {
    '--deck-gap': `${DECK_DESIGN.trackGap}px`,
    '--deck-transport-offset': `${DECK_DESIGN.transportOffsetX}px`,
    '--deck-volume-offset': `${DECK_DESIGN.volumeOffsetX}px`,
  } as CSSProperties;

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!anchor.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener('pointerdown', close);
    return () => window.removeEventListener('pointerdown', close);
  }, [open]);

  useEffect(() => {
    if (!listOpen) return;
    listRef.current?.querySelector('.is-on')?.scrollIntoView({ block: 'nearest' });
  }, [listOpen, player.trackIndex]);

  return (
    <section className="player deck" aria-label="음악 플레이어">
      <div className="deck-top">
        <button
          type="button"
          className={cx('ctrl', listOpen && 'is-on')}
          aria-label="플레이리스트"
          aria-expanded={listOpen}
          onClick={() => setListOpen((value) => !value)}
        >
          <ListMusic size={16} />
        </button>
        <div className="player-meta">
          <strong>{player.track.title}</strong>
          <span>{player.track.artist}</span>
        </div>
        <button
          type="button"
          className={cx('ctrl', player.order === 'shuffle' && 'is-on')}
          aria-label={player.order === 'one' ? '한 곡 반복' : '셔플 재생'}
          aria-pressed={player.order === 'shuffle'}
          onClick={player.toggleOrder}
        >
          {player.order === 'shuffle' ? <Shuffle size={16} /> : <Repeat1 size={16} />}
        </button>
      </div>
      <div className="deck-controls" style={deckStyle}>
        <div className="deck-transport">
          <button type="button" className="ctrl" onClick={player.prev} aria-label="이전 곡">
            <SkipBack size={16} />
          </button>
          <button type="button" className="play-btn" onClick={player.toggle} aria-label={player.playing ? '일시정지' : '재생'} aria-pressed={player.playing}>
            {player.playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
          </button>
          <button type="button" className="ctrl" onClick={player.next} aria-label="다음 곡">
            <SkipForward size={16} />
          </button>
        </div>
        <div className="vol-anchor" ref={anchor}>
          <button
            type="button"
            className="ctrl"
            aria-label="소리 조절"
            aria-expanded={open}
            aria-pressed={silent}
            onClick={() => setOpen((value) => !value)}
          >
            {silent ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          {open && (
            <div className="vol-pop" role="dialog" aria-label="음량">
              <div className="vol-pop-head">
                <span>음량 {Math.round(volume * 100)}</span>
                <button type="button" className="text-btn" onClick={player.toggleMute} aria-pressed={player.muted}>
                  {player.muted ? '음소거 해제' : '음소거'}
                </button>
              </div>
              <input
                className="vol-range"
                type="range"
                min={0}
                max={100}
                value={Math.round(volume * 100)}
                aria-label="음량 슬라이더"
                onChange={(event) => {
                  const next = Number(event.target.value) / 100;
                  updateSettings({ musicVolume: next });
                  if (next > 0 && player.muted) player.toggleMute();
                }}
              />
              {!data.settings.musicEnabled && <p className="muted">설정에서 음악이 꺼져 있어요.</p>}
            </div>
          )}
        </div>
      </div>
      {listOpen && (
        <ul className="deck-list" ref={listRef} aria-label="플레이리스트">
          {player.tracks.map((song, index) => {
            const on = player.trackIndex === index;
            return (
              <li key={song.id}>
                <button type="button" className={cx('deck-song', on && 'is-on')} aria-pressed={on} onClick={() => player.choose(index)}>
                  <span className="cover-swatch tiny" style={{ background: song.tint }} />
                  <span className="song-copy">
                    <strong>{song.title}</strong>
                    <em>{song.artist}</em>
                  </span>
                  {on && player.playing && <span className="deck-now">재생 중</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
