export function parseHex(hex: string): [number, number, number] | null {
  const raw = hex.trim().replace('#', '');
  const full = raw.length === 3 ? raw.split('').map((char) => char + char).join('') : raw;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  const value = Number.parseInt(full, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

export function toHex(r: number, g: number, b: number): string {
  const channel = (n: number) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0');
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

export function mixHex(a: string, b: string, amount: number): string {
  const left = parseHex(a) ?? [111, 139, 98];
  const right = parseHex(b) ?? [255, 255, 255];
  const t = Math.min(1, Math.max(0, amount));
  return toHex(
    left[0] + (right[0] - left[0]) * t,
    left[1] + (right[1] - left[1]) * t,
    left[2] + (right[2] - left[2]) * t,
  );
}

export function isDark(hex: string): boolean {
  const rgb = parseHex(hex);
  if (!rgb) return true;
  const luminance = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
  return luminance < 0.64;
}

export function normalizeHex(input: string): string | null {
  const rgb = parseHex(input);
  if (!rgb) return null;
  return toHex(rgb[0], rgb[1], rgb[2]);
}

export function buildCssVars(accent: string, bg: string, bgImage = ''): Record<string, string> {
  return {
    '--bg': bg,
    '--bg-image': bgImage ? `url("${bgImage.replace(/"/g, '')}")` : 'none',
    '--accent': accent,
    '--accent-deep': mixHex(accent, '#1c2a1c', 0.4),
    '--accent-soft': mixHex(accent, '#ffffff', 0.82),
    '--card': mixHex(bg, '#ffffff', 0.62),
    '--track': mixHex(bg, '#e4dccf', 0.55),
    '--on-accent': isDark(accent) ? '#ffffff' : '#243028',
  };
}
