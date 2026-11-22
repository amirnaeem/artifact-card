/**
 * Square tiles. Puzzle art is 14 content columns; +2 pad columns each side
 * (18 total) so left/right insets match the top (~118) without stretching tiles.
 * 18×92 + 17×11.5 = 1851.5 → originX ≈ 98.
 *
 * Level void shapes live in `svg-fills.ts` (used by presets).
 */
export const GRID_BASE = {
  cols: 18,
  rows: 15,
  originX: 98.25,
  originY: 118,
  cell: 92,
  gap: 11.5,
  padCols: 2,
  contentCols: 14,
} as const;
