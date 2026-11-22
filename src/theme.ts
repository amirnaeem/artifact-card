import type { GridSpec, LevelCardTheme } from "./types";

const SANS = 'var(--font-sans, "DM Sans", "Segoe UI", sans-serif)';
const HEAD = 'var(--font-head, "Syne", "DM Sans", sans-serif)';
const DISPLAY = 'var(--font-display, "Syne", "DM Sans", sans-serif)';
const MONO = 'var(--font-mono, "IBM Plex Mono", ui-monospace, monospace)';

/** Reject prototype-pollution keys when merging untrusted theme JSON. */
const BLOCKED_KEYS = new Set(["__proto__", "constructor", "prototype"]);

/** Caps for theme.grid so a hostile patch cannot allocate unbounded mosaics. */
const MAX_GRID_DIM = 64;
const MAX_GRID_CELLS = 4096;

/** Default theme in 2048×2048 user units. Host apps can override via CSS vars. */
export const defaultTheme: LevelCardTheme = {
  background: "#000000",
  primary: "#F0E013",
  accents: ["#2A19AD", "#D95DCC", "#55D054", "#B2FFA0"],
  titleColor: "#FEFEFE",
  captionColor: "#8F8E92",
  markColor: "#FEFEFE",
  brandColor: "#FEFEFE",
  nameColor: "#FEFEFE",
  metaColor: "#8F8E92",
  fonts: {
    title: HEAD,
    caption: MONO,
    brand: SANS,
    name: DISPLAY,
    meta: MONO,
  },
  type: {
    titleSize: 128,
    titleWeight: 500,
    captionSize: 40,
    captionWeight: 400,
    brandSize: 72,
    brandWeight: 700,
    nameSize: 104,
    nameWeight: 500,
    metaSize: 42,
    metaWeight: 400,
  },
  grid: {
    cols: 14,
    rows: 15,
    originX: 98.25,
    originY: 118,
    cell: 92,
    gap: 11.5,
    padCols: 2,
    contentCols: 14,
    voidCells: [],
    accentCells: [],
  },
};

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function safeEntries(obj: object): Array<[string, unknown]> {
  return Object.entries(obj).filter(([k]) => !BLOCKED_KEYS.has(k));
}

function clampDim(n: unknown, fallback: number): number {
  if (typeof n !== "number" || !Number.isFinite(n)) return fallback;
  return Math.min(MAX_GRID_DIM, Math.max(1, Math.round(n)));
}

function clampNum(n: unknown, fallback: number, lo: number, hi: number): number {
  if (typeof n !== "number" || !Number.isFinite(n)) return fallback;
  return Math.min(hi, Math.max(lo, n));
}

/** Bound grid dimensions and cell lists after merge. */
export function sanitizeGrid(grid: GridSpec): GridSpec {
  const cols = clampDim(grid.cols, 14);
  const rows = clampDim(grid.rows, 15);
  const padCols = Math.min(
    Math.floor(cols / 2),
    Math.max(0, Math.round(clampNum(grid.padCols ?? 0, 0, 0, MAX_GRID_DIM))),
  );
  const contentCols = clampDim(
    grid.contentCols ?? cols - 2 * padCols,
    Math.max(1, cols - 2 * padCols),
  );
  const voidCells = Array.isArray(grid.voidCells)
    ? grid.voidCells.slice(0, MAX_GRID_CELLS)
    : [];
  const accentCells = Array.isArray(grid.accentCells)
    ? grid.accentCells.slice(0, MAX_GRID_CELLS)
    : [];
  const bodyCells = Array.isArray(grid.bodyCells)
    ? grid.bodyCells.slice(0, MAX_GRID_CELLS)
    : undefined;

  return {
    ...grid,
    cols,
    rows,
    padCols,
    contentCols,
    originX: clampNum(grid.originX, 98.25, -1e6, 1e6),
    originY: clampNum(grid.originY, 118, -1e6, 1e6),
    cell: clampNum(grid.cell, 92, 1, 4096),
    gap: clampNum(grid.gap, 11.5, 0, 4096),
    cellW: grid.cellW === undefined ? undefined : clampNum(grid.cellW, grid.cell, 1, 4096),
    cellH: grid.cellH === undefined ? undefined : clampNum(grid.cellH, grid.cell, 1, 4096),
    gapX: grid.gapX === undefined ? undefined : clampNum(grid.gapX, grid.gap, 0, 4096),
    gapY: grid.gapY === undefined ? undefined : clampNum(grid.gapY, grid.gap, 0, 4096),
    voidCells,
    accentCells,
    bodyCells,
  };
}

/** Deep-merge theme patches; arrays replace wholesale. Prototype keys skipped. */
export function mergeTheme(
  base: LevelCardTheme,
  ...patches: Array<Partial<LevelCardTheme> | undefined>
): LevelCardTheme {
  let out: LevelCardTheme = base;
  for (const patch of patches) {
    if (!patch) continue;
    out = mergeOne(out, patch);
  }
  return { ...out, grid: sanitizeGrid(out.grid) };
}

function mergeOne(base: LevelCardTheme, patch: Partial<LevelCardTheme>): LevelCardTheme {
  const next: Record<string, unknown> = { ...base };
  for (const [key, pv] of safeEntries(patch)) {
    if (pv === undefined) continue;
    const bv = next[key];
    if (Array.isArray(pv)) {
      next[key] = pv.slice();
    } else if (isPlainObject(pv) && isPlainObject(bv)) {
      const nested: Record<string, unknown> = { ...bv };
      for (const [nk, nv] of safeEntries(pv)) nested[nk] = nv;
      next[key] = nested;
    } else {
      next[key] = pv;
    }
  }
  return next as unknown as LevelCardTheme;
}
