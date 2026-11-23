/** Seeded random progressive voids for Ninja art mosaic ranks. */

import { GRID_BASE } from "./voids";

export const NINJA_CARD_ORDER = [
  "AI Curious",
  "Apprentice",
  "AI Ninja",
  "Sensei Candidate",
  "AI Sensei",
] as const;

export type NinjaCardName = (typeof NINJA_CARD_ORDER)[number];

/** Fixed seed so demos/builds share the same scattered gaps. */
export const NINJA_VOID_SEED = 0x4e4a4e41; // "NJNA"

/** Rank-to-rank mosaic reveal duration (ms). */
export const NINJA_REVEAL_MS = 720;

/** Reveal fraction of content cells per rank (Sensei = full). */
export const NINJA_REVEAL_FRACTIONS = [0.2, 0.4, 0.6, 0.8, 1] as const;

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function allContentCells(cols: number, rows: number): Array<[number, number]> {
  const cells: Array<[number, number]> = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) cells.push([c, r]);
  }
  return cells;
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/** Reveal order for content cells (seeded). Exported for checks. */
export function ninjaRevealOrder(
  seed = NINJA_VOID_SEED,
  contentCols = GRID_BASE.contentCols,
  rows = GRID_BASE.rows,
): Array<[number, number]> {
  return shuffle(allContentCells(contentCols, rows), mulberry32(seed));
}

/** Ladder id → ordered level names for progressive art reveal. */
export const REVEAL_LADDERS: Record<string, readonly string[]> = {
  ninja: NINJA_CARD_ORDER,
};

export function revealRank(ladderId: string, level?: string): number {
  if (!level) return -1;
  const order = REVEAL_LADDERS[ladderId];
  if (!order) return -1;
  return (order as readonly string[]).indexOf(level);
}

export function ninjaRankIndex(level: string): number {
  return revealRank("ninja", level);
}

export function ninjaRevealedCount(
  rankIndex: number,
  seed = NINJA_VOID_SEED,
): number {
  if (rankIndex < 0) return 0;
  const order = ninjaRevealOrder(seed);
  const frac =
    NINJA_REVEAL_FRACTIONS[Math.min(rankIndex, NINJA_REVEAL_FRACTIONS.length - 1)] ?? 1;
  return Math.round(order.length * frac);
}

/** Voids when exactly `revealed` content cells are shown (rest are gaps). */
export function ninjaVoidsForRevealed(
  revealed: number,
  seed = NINJA_VOID_SEED,
): Array<[number, number]> {
  const order = ninjaRevealOrder(seed);
  const n = Math.max(0, Math.min(order.length, Math.round(revealed)));
  return order.slice(n);
}

/** Voids = cells not yet revealed at this rank index (0 = Curious). */
export function ninjaVoidsForRank(
  rankIndex: number,
  seed = NINJA_VOID_SEED,
): Array<[number, number]> {
  return ninjaVoidsForRevealed(ninjaRevealedCount(rankIndex, seed), seed);
}

export function isNinjaLevel(level?: string): level is NinjaCardName {
  return revealRank("ninja", level) >= 0;
}

/** Ladder id shared by both levels, if they are on the same progressive reveal ladder. */
export function sharedRevealLadder(a?: string, b?: string): string | undefined {
  if (!a || !b) return undefined;
  for (const [id, order] of Object.entries(REVEAL_LADDERS)) {
    const list = order as readonly string[];
    if (list.includes(a) && list.includes(b)) return id;
  }
  return undefined;
}

/** Precomputed void masks per Ninja rank name. */
export const NINJA_VOIDS: Record<NinjaCardName, Array<[number, number]>> = {
  "AI Curious": ninjaVoidsForRank(0),
  Apprentice: ninjaVoidsForRank(1),
  "AI Ninja": ninjaVoidsForRank(2),
  "Sensei Candidate": ninjaVoidsForRank(3),
  "AI Sensei": ninjaVoidsForRank(4),
};
