import { Music, Plus } from 'lucide-react';
import { ArtSlot } from '../components/ArtSlot';
import { PageHeader } from '../components/ui';
import { usePlayer } from '../context/Player';
import { useNav } from '../context/nav';
import { cx } from '../lib/cx';

export function MusicLibraryPage() {
  const { go } = useNav();
  const player = usePlayer();
  return (
    <div className="page">
      <PageHeader title="음악 고르기" onBack={() => go('study', 'focus')} />
      <ul className="song-list">
        {player.tracks.map((song, index) => {
          const on = player.trackIndex === index;
          return (
            <li key={song.id}>
              <button type="button" className={cx('song-row', on && 'is-on')} aria-pressed={on} onClick={() => player.select(index)}>
                <ArtSlot name={`cover-${song.id}`} className="art-cover" >
                  <span className="cover-swatch" style={{ background: song.tint }}>
                    <Music size={18} />
                  </span>
                </ArtSlot>
                <span className="song-copy">
                  <strong>{song.title}</strong>
                  <em>{song.artist}</em>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <button type="button" className="btn-ghost wide" onClick={() => go('study', 'music-add')}>
        <Plus size={16} />
        앨범 표지 자리
      </button>
    </div>
  );
}

export function MusicAddPage() {
  const { go } = useNav();
  const player = usePlayer();
  return (
    <div className="page">
      <PageHeader title="앨범 표지" onBack={() => go('study', 'music')} />
      <ArtSlot name="album-upload" className="art-upload">
        <Music size={28} />
        <p>표지 이미지가 들어올 자리</p>
      </ArtSlot>
      <p className="muted">곡 제목은 넣어 둔 파일 이름을 그대로 쓰고, 표지만 나중에 이미지로 바꾸면 됩니다.</p>
      <ul className="song-list compact">
        {player.tracks.map((song) => (
          <li key={song.id} className="song-plain">
            <span className="cover-swatch tiny" style={{ background: song.tint }} />
            {song.title}
          </li>
        ))}
      </ul>
    </div>
  );
}
