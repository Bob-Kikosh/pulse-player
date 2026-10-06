export interface Hsl {
  h: number;
  s: number;
  l: number;
}

export const DEFAULT_COLOR: Hsl = { h: 265, s: 70, l: 62 };

// Hues that look good on the dark background
const HUES = [12, 32, 150, 172, 196, 218, 265, 290, 322, 345];

// Every track gets its own stable color, derived from its id
export function getTrackColor(id: string): Hsl {
  let hash = 0;

  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }

  const index = Math.abs(hash);

  return {
    h: HUES[index % HUES.length],
    s: 68 + (index % 3) * 6,
    l: 60 + (index % 2) * 4,
  };
}

export function toCss({ h, s, l }: Hsl, alpha = 1) {
  return `hsl(${h} ${s}% ${l}% / ${alpha})`;
}
