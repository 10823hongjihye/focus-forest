export type ThemeId = 'forest' | 'ocean' | 'mono' | 'vintage';
export type SubjectId = 'math' | 'english' | 'korean' | 'history';
export type CharacterId = 'cream' | 'brown' | 'gray' | 'charcoal';
export type TimerMode = 'pomodoro' | 'countup';
export type PageId = 'home' | 'todo' | 'study' | 'calendar' | 'settings';
export type StudyView = 'focus' | 'subjects' | 'stats' | 'music' | 'music-add' | 'complete' | 'pie' | 'pattern' | 'streak' | 'shop';
export type DecorId = 'desk' | 'lamp' | 'plant' | 'rug' | 'shelf' | 'cushion';
export type StatsRange = 'day' | 'week' | 'month' | 'year';
export type TodoFilter = 'all' | 'open' | 'done';
export type SettingsTab = 'theme' | 'music' | 'timer' | 'alert' | 'account';

export type CustomTrack = {
  id: string;
  title: string;
};

export type CustomCategory = {
  id: string;
  name: string;
  bg: string;
  fg: string;
};

export type Todo = {
  id: string;
  title: string;
  subject: string;
  important: boolean;
  importance: number;
  done: boolean;
  date: string;
  createdAt: number;
};

export type PaperStyle = 'lines' | 'dots' | 'grid';
export type DiaryFont = 'sans' | 'serif' | 'hand';
export type DiaryAlign = 'left' | 'center' | 'right';

export type PlacedSticker = {
  id: string;
  stickerId: string;
  x: number;
  y: number;
  size: number;
  rotation: number;
};

export type DiaryEntry = {
  date: string;
  text: string;
  stickers: PlacedSticker[];
  paper: PaperStyle;
  textX: number;
  textY: number;
  textSize: number;
  textWidth: number;
  textRotation: number;
  textFont: DiaryFont;
  textAlign: DiaryAlign;
  updatedAt: number;
};

export type StudySession = {
  id: string;
  date: string;
  subject: string;
  durationSec: number;
  startedAt: number;
  endedAt: number;
};

export type Settings = {
  theme: ThemeId;
  accent: string;
  bg: string;
  character: CharacterId;
  displayName: string;
  dailyGoalMin: number;
  timerMode: TimerMode;
  pomodoroMin: number;
  musicEnabled: boolean;
  musicVolume: number;
  notifications: boolean;
  subjectGoals: Record<SubjectId, number>;
  customAccents: string[];
  customBgColors: string[];
  bgImage: string;
  savedBgImage: string;
  trackId: string;
  decor: DecorId;
  ownedDecor: DecorId[];
  spentLeaves: number;
  fontScale: number;
  /** 입고 있는 옷. 한 벌, 또는 옷 7 아래 + 옷 8 겉옷. */
  clothIds: string[];
  /** 착용 중인 아이템. 하나만. */
  itemIds: string[];
  /** 잎으로 산 옷과 아이템. 앞의 두 칸은 여기 없어도 입을 수 있다. */
  ownedOutfitIds: string[];
};

export type CustomSticker = {
  id: string;
  name: string;
};

export type AppData = {
  settings: Settings;
  categories: CustomCategory[];
  customTracks: CustomTrack[];
  customStickers: CustomSticker[];
  todos: Todo[];
  diaries: DiaryEntry[];
  sessions: StudySession[];
  onboarded: boolean;
};

export type TimeInterval = {
  start: number;
  end: number | null;
};

export type TimerSnapshot = {
  status: 'idle' | 'running' | 'paused';
  subject: string;
  mode: TimerMode;
  targetSec: number;
  intervals: TimeInterval[];
};
