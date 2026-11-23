/** Shared progressive art-mosaic reveal tween (Face + Gl). */

import {
  NINJA_REVEAL_MS,
  ninjaRevealedCount,
  ninjaVoidsForRevealed,
} from "./ninja-voids";

export const ART_REVEAL_MS = NINJA_REVEAL_MS;

export type ArtRevealPrev = { ladder: string; rank: number };

export function canTweenReveal(
  artFace: boolean,
  ladder: string | undefined,
  rank: number,
  prev: ArtRevealPrev | null,
): boolean {
  return (
    artFace &&
    !!ladder &&
    rank >= 0 &&
    !!prev &&
    prev.ladder === ladder &&
    prev.rank >= 0 &&
    prev.rank !== rank
  );
}

/**
 * Animate void fill-in between two ranks on the same ladder.
 * Calls `paint(voidCells)` each frame; omit args for the settled mosaic.
 * Returns a cancel function.
 */
export function startArtRevealTween(opts: {
  fromRank: number;
  toRank: number;
  reduce?: boolean;
  paint: (voidCells?: Array<[number, number]>) => void;
}): () => void {
  const { fromRank, toRank, reduce, paint } = opts;
  const to = ninjaRevealedCount(toRank);
  const from = ninjaRevealedCount(fromRank);
  if (reduce || from === to) {
    paint();
    return () => {};
  }
  let raf = 0;
  let cancelled = false;
  const start = performance.now();
  const tick = (now: number) => {
    if (cancelled) return;
    const u = Math.min(1, (now - start) / ART_REVEAL_MS);
    const eased = 1 - (1 - u) ** 3;
    paint(ninjaVoidsForRevealed(from + (to - from) * eased));
    if (u < 1) raf = requestAnimationFrame(tick);
  };
  paint(ninjaVoidsForRevealed(from));
  raf = requestAnimationFrame(tick);
  return () => {
    cancelled = true;
    if (raf) cancelAnimationFrame(raf);
  };
}
