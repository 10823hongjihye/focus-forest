import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { PageId, StudyView } from './types';
import { buildCssVars } from './lib/color';
import { moodForTrack } from './lib/songMood';
import { cx } from './lib/cx';
import { AppStateProvider, useAppState } from './context/AppState';
import { AuthProvider, useAuth } from './context/Auth';
import { NavContext } from './context/nav';
import { PlayerProvider, usePlayer } from './context/Player';
import { TimerProvider, useTimer } from './context/Timer';
import { BottomNav } from './components/BottomNav';
import { SceneDecor } from './components/Illustrations';
import { ShellContext } from './components/shell';
import { CalendarPage } from './pages/CalendarPage';
import { FocusPage } from './pages/FocusPage';
import { HomePage } from './pages/HomePage';
import { MusicAddPage, MusicLibraryPage } from './pages/MusicLibraryPage';
import { OnboardPage } from './pages/OnboardPage';
import { AuthPage } from './pages/AuthPage';
import { SettingsPage } from './pages/SettingsPage';
import { PatternPage, ShopPage, StreakPage, StudyCompletePage, SubjectPiePage } from './pages/StudyBoards';
import { StatsPage } from './pages/StatsPage';
import { SubjectsPage } from './pages/SubjectsPage';
import { TodoPage } from './pages/TodoPage';
import { setStorageScope } from './lib/storage';

export function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}

function Gate() {
  const { session } = useAuth();
  if (!session) {
    return (
      <div className="scene theme-forest">
        <div className="shell">
          <div className="screen-scroll is-theme">
            <AuthPage />
          </div>
        </div>
      </div>
    );
  }
  const scope = session.role === 'developer' ? 'developer' : session.userId;
  setStorageScope(scope);
  return (
    <AppStateProvider key={scope} nickname={session.role === 'user' ? session.nickname : undefined}>
      <TimerProvider>
        <PlayerProvider>
          <Shell />
        </PlayerProvider>
      </TimerProvider>
    </AppStateProvider>
  );
}

function useIntroLink() {
  const [open, setOpen] = useState(() => new URLSearchParams(window.location.search).has('intro'));
  useEffect(() => {
    const sync = () => setOpen(new URLSearchParams(window.location.search).has('intro'));
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);
  return open;
}

function Shell() {
  const { data, toast } = useAppState();
  const player = usePlayer();
  const { recap } = useTimer();
  const [page, setPage] = useState<PageId>('home');
  const [study, setStudy] = useState<StudyView>('focus');
  const introLink = useIntroLink();
  const [shellEl, setShellEl] = useState<HTMLDivElement | null>(null);
  const seenRecap = useRef<number | null>(null);
  const mood = moodForTrack(player.track);
  const style = {
    ...buildCssVars(data.settings.accent, mood?.bg ?? data.settings.bg, mood ? '' : data.settings.bgImage),
    ...(mood ? { '--focus-top': mood.top, '--focus-mid': mood.mid, '--focus-floor': mood.floor } : {}),
    '--font-scale': String(data.settings.fontScale),
  } as CSSProperties;

  const go = useCallback((next: PageId, nextStudy?: StudyView) => {
    setPage(next);
    if (next === 'study') setStudy(nextStudy ?? 'focus');
    else if (nextStudy) setStudy(nextStudy);
  }, []);

  useEffect(() => {
    if (!recap || seenRecap.current === recap.at) return;
    seenRecap.current = recap.at;
    go('study', 'complete');
  }, [recap, go]);

  const nav = useMemo(() => ({ page, study, go }), [page, study, go]);

  const showIntro = !data.onboarded || introLink;
  let screen = <HomePage />;
  if (showIntro) screen = <OnboardPage />;
  else if (page === 'todo') screen = <TodoPage />;
  else if (page === 'study' && study === 'subjects') screen = <SubjectsPage />;
  else if (page === 'study' && study === 'stats') screen = <StatsPage />;
  else if (page === 'study' && study === 'music') screen = <MusicLibraryPage />;
  else if (page === 'study' && study === 'music-add') screen = <MusicAddPage />;
  else if (page === 'study' && study === 'complete') screen = <StudyCompletePage />;
  else if (page === 'study' && study === 'pie') screen = <SubjectPiePage />;
  else if (page === 'study' && study === 'pattern') screen = <PatternPage />;
  else if (page === 'study' && study === 'streak') screen = <StreakPage />;
  else if (page === 'study' && study === 'shop') screen = <ShopPage />;
  else if (page === 'study') screen = <FocusPage />;
  else if (page === 'calendar') screen = <CalendarPage />;
  else if (page === 'settings') screen = <SettingsPage />;

  return (
    <ShellContext.Provider value={shellEl}>
      <NavContext.Provider value={nav}>
        <div className={cx('scene', `theme-${data.settings.theme}`)} style={style}>
          <SceneDecor theme={data.settings.theme} />
          <div className="shell" ref={setShellEl}>
            <div className={cx('screen-scroll', showIntro && 'is-theme')}>{screen}</div>
            {!showIntro && <BottomNav />}
            {toast && <div className="toast">{toast}</div>}
          </div>
        </div>
      </NavContext.Provider>
    </ShellContext.Provider>
  );
}
