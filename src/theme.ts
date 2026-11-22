import type { LevelCardTheme } from "./types";

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';

/** Default theme in 2048×2048 user units; fonts inherit Artifact CSS variables when embedded in-app. */
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
    title: "var(--font-head)",
    caption: MONO,
    brand: "var(--font-sans)",
    name: "var(--font-display)",
    meta: MONO,
  },
  type: {
    titleSize: 128,
    titleWeight: 500,
    captionSize: 40,
    captionWeight: 400,
    brandSize: 56,
    brandWeight: 700,
    nameSize: 110,
    nameWeight: 500,
    metaSize: 36,
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
  animation: {
    enabled: true,
    staggerMs: 22,
    accentPulse: false,
    markSpin: true,
    intensity: 1,
  },
};

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

/** Deep-merge theme patches; arrays replace wholesale. */
export function mergeTheme(
  base: LevelCardTheme,
  ...patches: Array<Partial<LevelCardTheme> | undefined>
): LevelCardTheme {
  let out: LevelCardTheme = base;
  for (const patch of patches) {
    if (!patch) continue;
    out = mergeOne(out, patch);
  }
  return out;
}

function mergeOne(base: LevelCardTheme, patch: Partial<LevelCardTheme>): LevelCardTheme {
  const next = { ...base };
  for (const key of Object.keys(patch) as Array<keyof LevelCardTheme>) {
    const pv = patch[key];
    if (pv === undefined) continue;
    const bv = base[key];
    if (Array.isArray(pv)) {
      (next as Record<string, unknown>)[key] = pv.slice();
    } else if (isPlainObject(pv) && isPlainObject(bv)) {
      (next as Record<string, unknown>)[key] = { ...bv, ...pv };
    } else {
      (next as Record<string, unknown>)[key] = pv;
    }
  }
  // Nested grid / fonts / type / animation need one more level when only partial keys passed
  if (patch.fonts) next.fonts = { ...base.fonts, ...patch.fonts };
  if (patch.type) next.type = { ...base.type, ...patch.type };
  if (patch.grid) next.grid = { ...base.grid, ...patch.grid };
  if (patch.animation) next.animation = { ...base.animation, ...patch.animation };
  return next;
}
