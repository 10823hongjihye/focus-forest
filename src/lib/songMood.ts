/**
 * 곡 분위기에 맞춘 배경.
 * bg 는 앱 전체 배경, top / mid / floor 는 공부 화면의 위·가운데·아래색이다.
 * 기본 곡은 id 로 찾고, 직접 넣은 곡은 제목에 아래 단어가 있으면 그 분위기를 쓴다.
 */
export type SongMood = {
  bg: string;
  top: string;
  mid: string;
  floor: string;
};

export const SONG_MOODS: Record<string, SongMood> = {
  'nature-forest': { bg: '#E7F0DF', top: '#E8F3E0', mid: '#C5DCB8', floor: '#E3D0B0' },
  'bossa-nova': { bg: '#F8EBD4', top: '#F8EDD8', mid: '#F0D2A8', floor: '#E4C08C' },
  'bossa-nova-restaurant': { bg: '#F6E2D2', top: '#F7E6D6', mid: '#E8C4A4', floor: '#D9A882' },
  'christmas-jazz': { bg: '#E6EEF2', top: '#E8F1F4', mid: '#D2E3EA', floor: '#F0D4D4' },
  'cozzy-jazz': { bg: '#F6EFE3', top: '#F7F1E6', mid: '#E6D4BE', floor: '#D4BEA2' },
  'lofi-cozzymood': { bg: '#F3E4D2', top: '#F4E7D6', mid: '#E2C8AA', floor: '#C9AE94' },
  'lofi-jazz': { bg: '#E3E7F2', top: '#E6EAF4', mid: '#C8D0E4', floor: '#B4BED4' },
  'piano-pop': { bg: '#F7F4EC', top: '#F8F6EF', mid: '#E4EFE6', floor: '#F0E2C4' },
  'retro-jazz': { bg: '#F3E4CC', top: '#F4E7D0', mid: '#E2C69E', floor: '#C9A67C' },
  'slow-jazz': { bg: '#E6E3F0', top: '#E8E5F2', mid: '#D0CAE0', floor: '#C0B4CC' },
  'spooky-music': { bg: '#E3DEEE', top: '#E6E1F0', mid: '#C6BED8', floor: '#B4A6C6' },
};

const KEYWORD_MOODS: Array<{ words: string[]; mood: SongMood }> = [
  { words: ['spooky', 'horror', 'ghost', 'scary'], mood: SONG_MOODS['spooky-music'] },
  { words: ['christmas', 'xmas', 'holiday', 'carol'], mood: SONG_MOODS['christmas-jazz'] },
  { words: ['lofi', 'cozy', 'cozzy', 'cozz'], mood: SONG_MOODS['lofi-cozzymood'] },
  { words: ['bossa'], mood: SONG_MOODS['bossa-nova'] },
  { words: ['nature', 'forest', 'rain'], mood: SONG_MOODS['nature-forest'] },
  { words: ['piano'], mood: SONG_MOODS['piano-pop'] },
  { words: ['retro', 'vintage'], mood: SONG_MOODS['retro-jazz'] },
  { words: ['jazz'], mood: SONG_MOODS['slow-jazz'] },
];

export function moodForTrack(track: { id: string; title: string } | undefined): SongMood | null {
  if (!track) return null;
  const known = SONG_MOODS[track.id];
  if (known) return known;
  const title = track.title.toLowerCase();
  const matched = KEYWORD_MOODS.find((item) => item.words.some((word) => title.includes(word)));
  return matched?.mood ?? null;
}
