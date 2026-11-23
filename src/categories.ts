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
 */
export type CardCategory = {
  id: string;
  label: string;
  /** Level names in rank order (low → high). */
  order: readonly string[];
  /** Chromatic mosaics may flicker in host UIs. */
  flicker?: boolean;
  /** Default art-face for levels in this category. */
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
    flicker: true,
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
 * Register or replace a category (for host apps / future packs).
 * Syncs `revealLadder` → `REVEAL_LADDERS` when set.
 */
export function defineCategory(cat: CardCategory): CardCategory {
  if (!cat.id || !cat.order?.length) {
    throw new Error("defineCategory requires id and a non-empty order");
  }
  CARD_CATEGORIES[cat.id] = cat;
  syncRevealLadder(cat);
  return cat;
}
