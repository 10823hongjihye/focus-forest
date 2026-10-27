import { BookOpen, Calendar, Home, ListTodo, Settings } from 'lucide-react';
import type { PageId } from '../types';
import { cx } from '../lib/cx';
import { useTimer } from '../context/Timer';
import { useNav } from '../context/nav';

const ITEMS: Array<{ id: PageId; label: string; icon: typeof Home }> = [
  { id: 'home', label: '홈', icon: Home },
  { id: 'todo', label: '투두', icon: ListTodo },
  { id: 'study', label: '공부', icon: BookOpen },
  { id: 'calendar', label: '캘린더', icon: Calendar },
  { id: 'settings', label: '설정', icon: Settings },
];

export function BottomNav() {
  const { page, go } = useNav();
  const { snapshot } = useTimer();
  return (
    <nav className="nav" aria-label="주요 메뉴">
      {ITEMS.map((item) => {
        const Icon = item.icon;
        const active = page === item.id;
        return (
          <button
            key={item.id}
            type="button"
            className={cx('nav-btn', active && 'is-active')}
            aria-current={active ? 'page' : undefined}
            onClick={() => go(item.id, item.id === 'study' ? 'focus' : undefined)}
          >
            <span className="nav-ico">
              <Icon size={22} strokeWidth={active ? 2.3 : 1.8} />
              {item.id === 'study' && snapshot.status !== 'idle' && <span className="nav-dot" />}
            </span>
            <span className="nav-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
