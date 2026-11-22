import type { AccentCell, GridCell, GridSpec } from "./types";

type BuildOpts = {
  /** When true, void cells are included as carve tiles (filled, then animated out). */
  includeCarve?: boolean;
};

export function gridMetrics(grid: GridSpec) {
  const cellW = grid.cellW ?? grid.cell;
  const cellH = grid.cellH ?? grid.cell;
  const gapX = grid.gapX ?? grid.gap;
  const gapY = grid.gapY ?? grid.gap;
  return {
    cellW,
    cellH,
    gapX,
    gapY,
    stepX: cellW + gapX,
    stepY: cellH + gapY,
  };
}

export function contentPad(grid: GridSpec) {
  const pad = grid.padCols ?? 0;
  const contentCols = grid.contentCols ?? grid.cols - 2 * pad;
  return { pad, contentCols };
}

/** Map content-space voids into full grid coordinates (after side padding). */
export function paddedVoids(grid: GridSpec): Array<[number, number]> {
  const { pad } = contentPad(grid);
  return grid.voidCells.map(([c, r]) => [c + pad, r]);
}

function resolveContentFill(
  contentC: number,
  r: number,
  contentCols: number,
  primary: string,
  accents: string[],
  voidSet: Set<string>,
  bodyMap: Map<string, string>,
  accentMap: Map<string, AccentCell>,
): string | null {
  if (contentC < 0 || contentC >= contentCols) return null;
  const key = `${contentC},${r}`;
  if (voidSet.has(key)) return null;
  const accent = accentMap.get(key);
  if (accent?.fill) return accent.fill;
  if (accent?.colorIndex !== undefined) {
    return accents[accent.colorIndex % Math.max(1, accents.length)] ?? primary;
  }
  return bodyMap.get(key) ?? primary;
}

/** Map a pad column onto a mirrored content column so side tiles reuse content colors. */
function padMirrorContentCol(c: number, pad: number, contentCols: number): number {
  if (c < pad) return Math.min(contentCols - 1, Math.max(0, pad - 1 - c));
  return Math.min(contentCols - 1, Math.max(0, 2 * contentCols + pad - 1 - c));
}

/** Resolve pad fill from mirrored content; walk inward if that cell is void. */
function padFill(
  c: number,
  r: number,
  pad: number,
  contentCols: number,
  primary: string,
  accents: string[],
  voidSet: Set<string>,
  bodyMap: Map<string, string>,
  accentMap: Map<string, AccentCell>,
): string {
  const start = padMirrorContentCol(c, pad, contentCols);
  const fromLeft = c < pad;
  if (fromLeft) {
    for (let cc = start; cc < contentCols; cc++) {
      const fill = resolveContentFill(cc, r, contentCols, primary, accents, voidSet, bodyMap, accentMap);
      if (fill) return fill;
    }
  } else {
    for (let cc = start; cc >= 0; cc--) {
      const fill = resolveContentFill(cc, r, contentCols, primary, accents, voidSet, bodyMap, accentMap);
      if (fill) return fill;
    }
  }
  return primary;
}

/** Expand a grid spec into drawable cells. */
export function buildCells(
  grid: GridSpec,
  primary: string,
  accents: string[],
  opts: BuildOpts = {},
): GridCell[] {
  const { cellW, cellH, stepX, stepY } = gridMetrics(grid);
  const { pad, contentCols } = contentPad(grid);
  const voidSet = new Set(grid.voidCells.map(([c, r]) => `${c},${r}`));
  const bodyMap = new Map<string, string>(
    (grid.bodyCells ?? []).map((b) => [`${b.c},${b.r}`, b.fill]),
  );
  const accentMap = new Map<string, AccentCell>(
    grid.accentCells.map((a) => [`${a.c},${a.r}`, a]),
  );

  const cells: GridCell[] = [];
  let index = 0;
  for (let r = 0; r < grid.rows; r++) {
    for (let c = 0; c < grid.cols; c++) {
      const contentC = c - pad;
      const inContent = contentC >= 0 && contentC < contentCols;
      const contentKey = `${contentC},${r}`;
      const isVoid = inContent && voidSet.has(contentKey);
      if (isVoid && !opts.includeCarve) continue;

      const accent = inContent ? accentMap.get(contentKey) : undefined;
      const isAccent = !!accent && !isVoid;
      let fill = primary;

      if (isVoid) {
        fill = bodyMap.get(contentKey) ?? primary;
      } else if (inContent) {
        fill =
          resolveContentFill(
            contentC,
            r,
            contentCols,
            primary,
            accents,
            voidSet,
            bodyMap,
            accentMap,
          ) ?? primary;
      } else {
        // Side pads: mirror content colors outward (no flat primary strips)
        fill = padFill(c, r, pad, contentCols, primary, accents, voidSet, bodyMap, accentMap);
      }

      cells.push({
        key: `${c},${r}`,
        x: grid.originX + c * stepX,
        y: grid.originY + r * stepY,
        w: cellW,
        h: cellH,
        fill,
        accent: isAccent,
        carve: isVoid,
        index: index++,
        col: c,
        row: r,
      });
    }
  }
  return cells;
}

/** Pick fills onto random non-void cells across the full (padded) grid. */
export function scatterFills(
  fills: string[],
  voidCells: Array<[number, number]>,
  cols: number,
  rows: number,
  rng: () => number = Math.random,
  pad = 0,
): Array<{ c: number; r: number; fill: string }> {
  const voidSet = new Set(voidCells.map(([c, r]) => `${c + pad},${r}`));
  const pool: Array<[number, number]> = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!voidSet.has(`${c},${r}`)) pool.push([c, r]);
    }
  }
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = pool[i]!;
    pool[i] = pool[j]!;
    pool[j] = tmp;
  }
  return fills.slice(0, pool.length).map((fill, i) => {
    const [c, r] = pool[i]!;
    return { c: c - pad, r, fill };
  }).filter((a) => a.c >= 0);
}

/** Scatter accents inside the content columns only. */
export function scatterFillsInContent(
  fills: string[],
  voidCells: Array<[number, number]>,
  contentCols: number,
  rows: number,
  rng: () => number = Math.random,
): Array<{ c: number; r: number; fill: string }> {
  return scatterFills(fills, voidCells, contentCols, rows, rng, 0);
}
