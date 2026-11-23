/** Award categories — Reading and Ninja today; add more via `defineCategory`. */

import { NINJA_ART_URL } from "./assets";
import { NINJA_CARD_ORDER, REVEAL_LADDERS } from "./ninja-voids";

export const LEVEL_CARD_ORDER = [
  "Beginner",
  "Learner",
  "Seeker",
  "Explorer",
  "Scholar",
  "Savant",
  "Sage",
  "Oracle",
] as const;

export type ReadingCardName = (typeof LEVEL_CARD_ORDER)[number];
export type { NinjaCardName } from "./ninja-voids";
export { NINJA_CARD_ORDER } from "./ninja-voids";

/**
 * One award track (Reading, Ninja, …).
 * Presets inherit `artFace` / `revealLadder` / art defaults from their category.
 *
 * When `artFace` is true, set `defaultArtSrc` so the panel is never empty —
 * without a safe art URL, resolve falls back to a color mosaic.
 */
export type CardCategory = {
  id: string;
  label: string;
  /** Level names in rank order (low → high). Must be unique and each have a preset. */
  order: readonly string[];
  /**
   * Default art-face for levels in this category.
   * Prefer setting `defaultArtSrc` when true so the panel is never empty.
   */
  artFace?: boolean;
  /** Progressive reveal ladder id (usually same as `id`). */
  revealLadder?: string;
  /** Packaged default art when `artFace` and host omits `artSrc`. */
  defaultArtSrc?: string;
};

export const CARD_CATEGORIES: Record<string, CardCategory> = {
  reading: {
    id: "reading",
    label: "Reading",
    order: LEVEL_CARD_ORDER,
  },
  ninja: {
    id: "ninja",
    label: "Ninja",
    order: NINJA_CARD_ORDER,
    artFace: true,
    revealLadder: "ninja",
    defaultArtSrc: NINJA_ART_URL,
  },
};

export type CardCategoryId = keyof typeof CARD_CATEGORIES | (string & {});

function syncRevealLadder(cat: CardCategory) {
  if (cat.revealLadder) {
    REVEAL_LADDERS[cat.revealLadder] = cat.order;
  }
}

for (const cat of Object.values(CARD_CATEGORIES)) syncRevealLadder(cat);

/** Categories in stable UI order. */
export function listCategories(): CardCategory[] {
  return Object.values(CARD_CATEGORIES);
}

export function getCategory(id?: string): CardCategory | undefined {
  if (!id) return undefined;
  return CARD_CATEGORIES[id];
}

/** Which category contains this level name (first match). */
export function categoryForLevel(level?: string): CardCategory | undefined {
  if (!level) return undefined;
  for (const cat of Object.values(CARD_CATEGORIES)) {
    if ((cat.order as readonly string[]).includes(level)) return cat;
  }
  return undefined;
}

/**
 * Register or replace a category structure (no preset map).
 * Prefer `defineCategory` from the package root — it also registers presets and validates.
 */
export function registerCategory(cat: CardCategory): CardCategory {
  if (!cat.id || !cat.order?.length) {
    throw new Error("defineCategory requires id and a non-empty order");
  }
  const seen = new Set<string>();
  for (const name of cat.order) {
    if (seen.has(name)) {
      throw new Error(`defineCategory("${cat.id}"): duplicate level "${name}" in order`);
    }
    seen.add(name);
    const other = categoryForLevel(name);
    if (other && other.id !== cat.id) {
      throw new Error(
        `defineCategory("${cat.id}"): level "${name}" already belongs to "${other.id}"`,
      );
    }
  }
  CARD_CATEGORIES[cat.id] = cat;
  syncRevealLadder(cat);
  return cat;
}

/** @deprecated Use registerCategory / package `defineCategory`. */
export const defineCategory = registerCategory;

/** Remove a category and its reveal ladder entry (tests / host teardown). */
export function unregisterCategory(id: string): void {
  const cat = CARD_CATEGORIES[id];
  if (!cat) return;
  if (cat.revealLadder && REVEAL_LADDERS[cat.revealLadder] === cat.order) {
    delete REVEAL_LADDERS[cat.revealLadder];
  }
  delete CARD_CATEGORIES[id];
}
