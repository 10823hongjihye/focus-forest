import { Check, Leaf } from 'lucide-react';
import { THEME_ORDER, THEME_PRESETS } from '../lib/constants';
import { cx } from '../lib/cx';
import { useAppState } from '../context/AppState';
import { ThemeArt } from '../components/Illustrations';

export function ThemePage() {
  const { data, applyTheme, completeOnboarding } = useAppState();
  return (
    <div className="theme-screen">
      <header className="theme-head">
        <span className="leaf-badge">
          <Leaf size={18} />
        </span>
        <h1>테마 선택</h1>
        <p>나만의 공간을 꾸며보세요</p>
      </header>
      <div className="theme-list">
        {THEME_ORDER.map((id) => {
          const theme = THEME_PRESETS[id];
          const selected = data.settings.theme === id;
          return (
            <button key={id} type="button" className={cx('theme-card', selected && 'is-on')} onClick={() => applyTheme(id)} aria-pressed={selected}>
              <span className="theme-copy">
                <h2>{theme.name}</h2>
                <p>{theme.desc}</p>
              </span>
              <span className="theme-thumb">
                <ThemeArt theme={id} />
              </span>
              {selected && (
                <span className="theme-check">
                  <Check size={14} strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="theme-start">
        <button type="button" className="btn-primary" onClick={completeOnboarding}>
          <Leaf size={18} />
          선택한 테마로 시작하기
        </button>
      </div>
    </div>
  );
}
