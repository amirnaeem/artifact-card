/**
 * Puzzle voids for the 14×15 content grid (tetris cut-outs per level).
 */

/** Shared lower-mid puzzle (Beginner / Learner / Seeker). */
export const VOID_PUZZLE_BR: Array<[number, number]> = [
  [7, 7],
  [6, 8], [7, 8], [8, 8], [9, 8], [10, 8], [11, 8],
  [6, 9], [7, 9], [8, 9], [9, 9], [10, 9], [11, 9],
  [8, 10], [9, 10], [10, 10], [11, 10],
  [8, 11], [9, 11], [10, 11], [11, 11], [12, 11],
  [8, 12], [9, 12], [10, 12], [11, 12],
];

/** Explorer — left-side bite. */
export const VOID_EXPLORER: Array<[number, number]> = [
  [2, 2], [3, 2], [4, 2], [5, 2],
  [1, 3], [2, 3], [3, 3], [4, 3], [5, 3],
  [2, 4], [3, 4], [4, 4], [5, 4],
  [2, 5], [3, 5], [4, 5], [5, 5], [6, 5], [7, 5],
  [2, 6], [3, 6], [4, 6], [5, 6], [6, 6], [7, 6],
  [6, 7],
];

/** Scholar — right-side bite. */
export const VOID_SCHOLAR: Array<[number, number]> = [
  [8, 2], [9, 2], [10, 2], [11, 2],
  [8, 3], [9, 3], [10, 3], [11, 3], [12, 3],
  [8, 4], [9, 4], [10, 4], [11, 4],
  [6, 5], [7, 5], [8, 5], [9, 5], [10, 5], [11, 5],
  [6, 6], [7, 6], [8, 6], [9, 6], [10, 6], [11, 6],
  [7, 7],
];

/** Savant — left-lower bite. */
export const VOID_SAVANT: Array<[number, number]> = [
  [6, 7],
  [2, 8], [3, 8], [4, 8], [5, 8], [6, 8], [7, 8],
  [2, 9], [3, 9], [4, 9], [5, 9], [6, 9], [7, 9],
  [2, 10], [3, 10], [4, 10], [5, 10],
  [1, 11], [2, 11], [3, 11], [4, 11], [5, 11],
  [2, 12], [3, 12], [4, 12], [5, 12],
];

/** Prefer fills module for Sage / Oracle voids. */
export { SAGE_VOIDS as VOID_SAGE, ORACLE_VOIDS as VOID_ORACLE } from "./svg-fills";

/**
 * Square tiles. Puzzle art is 14 content columns; +2 pad columns each side
 * (18 total) so left/right insets match the top (~118) without stretching tiles.
 * 18×92 + 17×11.5 = 1851.5 → originX ≈ 98.
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
