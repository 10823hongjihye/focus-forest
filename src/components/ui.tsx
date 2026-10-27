import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronLeft, X } from 'lucide-react';
import { cx } from '../lib/cx';
import { useShellEl } from './shell';

export function ProgressRing({ value, size = 74, label }: { value: number; size?: number; label?: string }) {
  const stroke = 7;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const clamped = Math.min(1, Math.max(0, value));
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--accent-soft)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - clamped)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="ring-label">{label ?? `${Math.round(clamped * 100)}%`}</span>
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: Array<{ id: T; label: string }>;
  onChange: (id: T) => void;
  label: string;
}) {
  return (
    <div className="segmented" role="tablist" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          role="tab"
          aria-selected={value === option.id}
          className={cx('segmented-btn', value === option.id && 'is-on')}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function PageHeader({ title, onBack, right }: { title: string; onBack?: () => void; right?: ReactNode }) {
  return (
    <header className="page-head">
      {onBack ? (
        <button type="button" className="icon-btn plain" onClick={onBack} aria-label="뒤로">
          <ChevronLeft size={22} />
        </button>
      ) : (
        <span className="icon-spacer" />
      )}
      <h1>{title}</h1>
      {right ?? <span className="icon-spacer" />}
    </header>
  );
}

export function Switch({ on, label, onChange }: { on: boolean; label: string; onChange: (value: boolean) => void }) {
  return (
    <button type="button" className={cx('switch', on && 'is-on')} role="switch" aria-checked={on} onClick={() => onChange(!on)}>
      <span>{label}</span>
      <span className="switch-ui" aria-hidden />
    </button>
  );
}

export function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const el = useShellEl();
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open || !el) return null;
  return createPortal(
    <div className="overlay" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="overlay-bg" aria-label="닫기" onClick={onClose} />
      <div className="sheet">
        <div className="row-between">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="닫기">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    el,
  );
}

export function CheckButton({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button type="button" className={cx('check', on && 'is-on')} aria-label={label} aria-pressed={on} onClick={onClick}>
      {on && <Check size={12} strokeWidth={3} />}
    </button>
  );
}
