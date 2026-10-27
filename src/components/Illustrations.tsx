import { useId, type ReactNode } from 'react';
import type { ThemeId } from '../types';
import { cx } from '../lib/cx';

export function ThemeArt({ theme }: { theme: ThemeId }) {
  const uid = useId().replace(/:/g, '');
  if (theme === 'ocean') return <OceanArt uid={uid} />;
  if (theme === 'mono') return <MonoArt uid={uid} />;
  if (theme === 'vintage') return <VintageArt uid={uid} />;
  return <ForestArt uid={uid} />;
}

function ForestArt({ uid }: { uid: string }) {
  return (
    <svg viewBox="0 0 220 120" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d7ebdd" />
          <stop offset="1" stopColor="#f4f7ef" />
        </linearGradient>
      </defs>
      <rect width="220" height="120" fill={`url(#${uid}-sky)`} />
      <circle cx="176" cy="28" r="14" fill="#f6e7b2" />
      <ellipse cx="110" cy="98" rx="120" ry="28" fill="#d5e4c4" />
      <Pine x={48} y={96} scale={1} color="#6e9464" />
      <Pine x={86} y={100} scale={1.15} color="#5d8154" />
      <Pine x={128} y={98} scale={0.92} color="#7ea472" />
      <Pine x={162} y={102} scale={0.72} color="#688b5c" />
      <ellipse cx="70" cy="104" rx="10" ry="6" fill="#f3e2cc" />
      <circle cx="70" cy="96" r="6" fill="#f6e7d6" />
      <circle cx="66" cy="90" r="3.2" fill="#f6e7d6" />
      <circle cx="74" cy="90" r="3.2" fill="#f6e7d6" />
    </svg>
  );
}

function Pine({ x, y, scale, color }: { x: number; y: number; scale: number; color: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <polygon points="0,-52 18,-18 -18,-18" fill={color} />
      <polygon points="0,-36 22,-2 -22,-2" fill={color} opacity="0.92" />
      <polygon points="0,-20 26,16 -26,16" fill={color} opacity="0.84" />
      <rect x="-3" y="14" width="6" height="12" rx="1" fill="#6d5344" />
    </g>
  );
}

function OceanArt({ uid }: { uid: string }) {
  return (
    <svg viewBox="0 0 220 120" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f8e7c1" />
          <stop offset="0.45" stopColor="#d5eef6" />
          <stop offset="1" stopColor="#b7dcea" />
        </linearGradient>
      </defs>
      <rect width="220" height="120" fill={`url(#${uid}-sky)`} />
      <circle cx="46" cy="32" r="12" fill="#ffe7a3" />
      <ellipse cx="150" cy="28" rx="22" ry="8" fill="#fff" opacity="0.8" />
      <ellipse cx="168" cy="30" rx="16" ry="7" fill="#fff" opacity="0.85" />
      <path d="M0 78 Q40 66 70 78 T150 76 T220 82 V120 H0 Z" fill="#8ec3d4" />
      <path d="M0 92 Q50 80 100 94 T220 90 V120 H0 Z" fill="#6eabc2" />
      <path d="M0 104 Q60 96 120 108 T220 102 V120 H0 Z" fill="#f4fbfe" opacity="0.45" />
      <ellipse cx="132" cy="86" rx="28" ry="12" fill="#5d8ea3" />
      <path d="M104 86 q-8 10 2 16 q10-8 6-16" fill="#4e7d92" />
      <circle cx="148" cy="84" r="1.4" fill="#24343a" />
      <path d="M154 74 q6-10 4-2" fill="none" stroke="#eef7fb" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function MonoArt({ uid }: { uid: string }) {
  return (
    <svg viewBox="0 0 220 120" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id={`${uid}-wall`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ececea" />
          <stop offset="1" stopColor="#d7d7d4" />
        </linearGradient>
      </defs>
      <rect width="220" height="120" fill={`url(#${uid}-wall)`} />
      <rect x="18" y="16" width="70" height="52" rx="6" fill="#bfc4c8" />
      <rect x="24" y="22" width="58" height="40" rx="3" fill="#e7eef2" />
      <path d="M24 62 L53 40 L82 62" fill="#d5dde2" />
      <rect x="108" y="58" width="86" height="8" rx="2" fill="#b7b7b4" />
      <rect x="116" y="66" width="70" height="28" rx="4" fill="#c8c8c4" />
      <path d="M148 66 v-26" stroke="#9a9a96" strokeWidth="3" />
      <path d="M148 40 h22 l8 10 h-30 z" fill="#f4f4f2" />
      <path d="M150 50 L168 78" stroke="#f7e7a8" strokeWidth="8" opacity="0.35" />
      <rect x="124" y="72" width="16" height="12" rx="1" fill="#efefed" />
      <rect x="142" y="74" width="12" height="10" rx="1" fill="#e4e4e1" />
    </svg>
  );
}

function VintageArt({ uid }: { uid: string }) {
  return (
    <svg viewBox="0 0 220 120" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id={`${uid}-wall`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6e6cf" />
          <stop offset="1" stopColor="#e7d3b4" />
        </linearGradient>
      </defs>
      <rect width="220" height="120" fill={`url(#${uid}-wall)`} />
      <rect x="16" y="18" width="54" height="40" rx="4" fill="#f8f1e4" />
      <rect x="22" y="24" width="42" height="28" fill="#d9ecf2" />
      <path d="M22 52 L43 34 L64 52" fill="#c5dbe3" />
      <rect x="96" y="48" width="78" height="46" rx="10" fill="#8d5b3c" />
      <circle cx="122" cy="70" r="12" fill="#e7d3b0" />
      <circle cx="122" cy="70" r="5" fill="#6d4632" />
      <rect x="142" y="58" width="22" height="16" rx="3" fill="#f0d7b2" />
      <circle cx="160" cy="78" r="4" fill="#d9b07a" />
      <rect x="128" y="40" width="4" height="12" fill="#6d4632" />
      <circle cx="186" cy="36" r="10" fill="#f6e7b2" />
      <rect x="184" y="46" width="4" height="28" fill="#c2a078" />
      <path d="M176 46 h20 l-2 8 h-16 z" fill="#f7f1e4" />
    </svg>
  );
}

export function StringLights() {
  const bulbs = [28, 78, 128, 178, 228, 278, 328];
  return (
    <svg className="lights" viewBox="0 0 360 64" preserveAspectRatio="none" aria-hidden>
      <path d="M-10 14 C 40 34 70 8 110 18 S 190 34 230 16 300 8 370 20" fill="none" stroke="#d9c7a4" strokeWidth="1.6" />
      {bulbs.map((x, index) => (
        <g key={x} transform={`translate(${x} ${index % 2 === 0 ? 24 : 30})`}>
          <line x1="0" y1="-10" x2="0" y2="0" stroke="#d9c7a4" strokeWidth="1.2" />
          <ellipse cx="0" cy="7" rx="5" ry="7" fill={index % 2 ? '#F7E7A4' : '#F4F0D4'} />
        </g>
      ))}
    </svg>
  );
}

export function HangingPlant({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 90 150" aria-hidden>
      <path d="M45 0 V34" stroke="#cbb892" strokeWidth="1.6" />
      <path d="M45 0 C18 18 20 34 45 34" fill="none" stroke="#cbb892" strokeWidth="1.3" />
      <path d="M45 0 C72 18 70 34 45 34" fill="none" stroke="#cbb892" strokeWidth="1.3" />
      <ellipse cx="45" cy="70" rx="26" ry="14" fill="#7d9a62" />
      <ellipse cx="26" cy="82" rx="16" ry="10" fill="#628454" />
      <ellipse cx="64" cy="84" rx="17" ry="11" fill="#90b074" />
      <ellipse cx="44" cy="92" rx="12" ry="8" fill="#567248" />
      <path d="M30 90 h30 l-4 18 h-22 z" fill="#e0bf96" />
      <path d="M32 96 h26" stroke="#c6a078" strokeWidth="1.4" />
    </svg>
  );
}

export function MusicNote({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 36" width="16" height="24" aria-hidden>
      <path d="M9 28c0 2.4-2.2 4-4.4 4S0 30.4 0 28s2.2-3.2 4.4-3.2c.7 0 1.3.1 1.8.3V6.2L22 3v16.2c0 2.4-2.2 4-4.4 4s-4.4-1.6-4.4-4 2.2-3.2 4.4-3.2c.7 0 1.4.1 2 .4V8.2L9 10.2V28z" fill="currentColor" />
    </svg>
  );
}

export function Flower({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 54 54" width="46" height="46" aria-hidden>
      <path d="M28 50c2-10 1-16-2-22" fill="none" stroke="#7d9a62" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M26 36c6 1 10 0 14-3" fill="none" stroke="#7d9a62" strokeWidth="1.4" strokeLinecap="round" />
      <ellipse cx="34" cy="30" rx="6" ry="3" fill="#8eae74" transform="rotate(-20 34 30)" />
      <circle cx="24" cy="20" r="5" fill="#f2c1be" />
      <circle cx="30" cy="16" r="5" fill="#f6d3cb" />
      <circle cx="18" cy="16" r="5" fill="#f6d3cb" />
      <circle cx="16" cy="22" r="5" fill="#f2c1be" />
      <circle cx="28" cy="24" r="5" fill="#f2c1be" />
      <circle cx="22" cy="20" r="3.2" fill="#f7e7a8" />
    </svg>
  );
}

export function Turntable({ spinning, children }: { spinning: boolean; children?: ReactNode }) {
  return (
    <div className="tt">
      <svg className="tt-base" viewBox="0 0 360 270" aria-hidden>
        <defs>
          <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f3ddc0" />
            <stop offset="1" stopColor="#e4c39a" />
          </linearGradient>
        </defs>
        <ellipse cx="180" cy="228" rx="156" ry="28" fill="url(#wood)" />
        <rect x="78" y="150" width="204" height="90" rx="18" fill="#2c2b2a" />
        <rect x="90" y="162" width="180" height="66" rx="12" fill="#1a1a1a" />
        <circle cx="180" cy="164" r="78" fill="#101010" />
        <circle cx="248" cy="198" r="5" fill="#c4554a" />
        <circle cx="266" cy="198" r="5" fill="#3f6b4e" />
      </svg>
      <div className="vinyl-pos">
        <div className={cx('vinyl', spinning && 'is-on')} />
      </div>
      <div className="tt-bear">{children}</div>
      <svg className="tt-arm" viewBox="0 0 360 270" preserveAspectRatio="none" aria-hidden>
        <circle cx="286" cy="158" r="9" fill="#e6e1d8" />
        <path d="M286 158 C272 154 258 148 246 142" fill="none" stroke="#f4f0e8" strokeWidth="3.2" strokeLinecap="round" />
        <path d="M246 142 l7 8" stroke="#f4f0e8" strokeWidth="3.2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export function AlbumCover({ tint }: { tint: string }) {
  return (
    <svg viewBox="0 0 64 64" width="42" height="42" aria-hidden>
      <rect width="64" height="64" fill={tint} />
      <circle cx="32" cy="34" r="16" fill="#1c1c1c" />
      <circle cx="32" cy="34" r="5" fill="#f6f1e6" />
      <path d="M8 18c8 8 14-2 24 2s14 8 24-2" fill="none" stroke="#fff" strokeOpacity="0.45" strokeWidth="2" />
    </svg>
  );
}

export function SceneDecor({ theme }: { theme: ThemeId }) {
  if (theme === 'ocean') {
    return (
      <div className="scene-decor" aria-hidden>
        <svg className="decor-left" viewBox="0 0 260 520">
          <ellipse cx="40" cy="70" rx="36" ry="36" fill="#fff6d8" opacity="0.8" />
          <path d="M0 360 Q80 320 140 360 T260 350 V520 H0 Z" fill="#9fd0de" />
          <path d="M0 410 Q90 380 160 420 T260 400 V520 H0 Z" fill="#7eb8cb" />
          <ellipse cx="150" cy="390" rx="46" ry="18" fill="#5d92a6" />
          <path d="M104 392 q-16 18 4 26 q18-12 10-26" fill="#4d8296" />
        </svg>
        <svg className="decor-right" viewBox="0 0 240 520">
          <ellipse cx="180" cy="90" rx="28" ry="10" fill="#fff" opacity="0.8" />
          <rect x="150" y="250" width="16" height="120" rx="8" fill="#d7b48a" />
          <ellipse cx="158" cy="250" rx="34" ry="16" fill="#7ea36a" />
          <ellipse cx="132" cy="270" rx="22" ry="12" fill="#6b9460" />
          <ellipse cx="186" cy="274" rx="24" ry="13" fill="#90b47a" />
          <path d="M0 430 Q80 400 140 440 T240 430 V520 H0 Z" fill="#b7dbe6" opacity="0.9" />
        </svg>
      </div>
    );
  }
  return (
    <div className="scene-decor" aria-hidden>
      <svg className="decor-left" viewBox="0 0 280 640">
        <circle cx="64" cy="84" r="36" fill="#fff4cc" opacity="0.7" />
        <ellipse cx="140" cy="560" rx="150" ry="50" fill="#d7e7cf" />
        <Pine x={70} y={540} scale={1.7} color="#6d9462" />
        <Pine x={130} y={555} scale={2.1} color="#5d8454" />
        <Pine x={190} y={548} scale={1.45} color="#7ea472" />
      </svg>
      <svg className="decor-right" viewBox="0 0 260 640">
        <ellipse cx="150" cy="590" rx="120" ry="40" fill="#e7f0df" />
        <rect x="118" y="390" width="28" height="150" rx="10" fill="#e2c39a" />
        <ellipse cx="132" cy="392" rx="48" ry="20" fill="#7d9b68" />
        <ellipse cx="96" cy="420" rx="30" ry="16" fill="#688b58" />
        <ellipse cx="168" cy="424" rx="32" ry="18" fill="#93b67e" />
        <ellipse cx="126" cy="448" rx="22" ry="12" fill="#567448" />
        <Pine x={40} y={560} scale={1.3} color="#6e9464" />
      </svg>
    </div>
  );
}
