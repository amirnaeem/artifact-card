import type { AccentCell, LevelCardPreset, LevelCardTheme } from "./types";
import { NINJA_CARD_ORDER, NINJA_VOIDS, type NinjaCardName } from "./ninja-voids";
import { GRID_BASE } from "./voids";
import {
  BEGINNER_ACCENTS,
  BEGINNER_VOIDS,
  EXPLORER_ACCENTS,
  EXPLORER_VOIDS,
  LEARNER_ACCENTS,
  LEARNER_VOIDS,
  ORACLE_BODY,
  ORACLE_VOIDS,
  SAGE_BODY,
  SAGE_VOIDS,
  SAVANT_ACCENTS,
  SAVANT_VOIDS,
  SCHOLAR_ACCENTS,
  SCHOLAR_VOIDS,
  SEEKER_ACCENTS,
  SEEKER_VOIDS,
  type FillCell,
} from "./svg-fills";

export { NINJA_CARD_ORDER } from "./ninja-voids";
export type { NinjaCardName } from "./ninja-voids";

function toAccents(cells: FillCell[]): AccentCell[] {
  return cells.map(({ c, r, fill }) => ({ c, r, fill }));
}

function grid(
  voidCells: Array<[number, number]>,
  accentCells: AccentCell[],
  extra?: Partial<LevelCardTheme["grid"]>,
): LevelCardTheme["grid"] {
  return { ...GRID_BASE, voidCells, accentCells, ...extra };
}

function preset(
  name: string,
  caption: string,
  theme: Partial<LevelCardTheme>,
): LevelCardPreset {
  return { name, caption, theme };
}

/** Beginner chroma fills (10) — positions randomized at render time. */
export const BEGINNER_COLOR_FILLS = BEGINNER_ACCENTS.map((a) => a.fill);

export const LEVEL_CARD_PRESETS: Record<string, LevelCardPreset> = {
  Beginner: preset("Beginner", "Just Joined", {
    primary: "#323232",
    accents: ["#2A19AD", "#D95DCC", "#55D054", "#B2FFA0"],
    // accents filled dynamically in LevelCardFace (random placement)
    grid: grid(BEGINNER_VOIDS, []),
  }),

  Learner: preset("Learner", "First Read", {
    primary: "#F0E013",
    accents: ["#2A19AD", "#D95DCC", "#55D054", "#B2FFA0"],
    grid: grid(LEARNER_VOIDS, toAccents(LEARNER_ACCENTS)),
  }),

  Seeker: preset("Seeker", "10+ reads", {
    primary: "#9FDDFE",
    accents: ["#2A19AD", "#D95ECC", "#55D054", "#F0DF13"],
    grid: grid(SEEKER_VOIDS, toAccents(SEEKER_ACCENTS)),
  }),

  Explorer: preset("Explorer", "25+ reads", {
    primary: "#55D054",
    accents: ["#B2FFA0", "#D95DCC", "#F0E013", "#2A19AD"],
    grid: grid(EXPLORER_VOIDS, toAccents(EXPLORER_ACCENTS)),
  }),

  Scholar: preset("Scholar", "50+ reads", {
    primary: "#EF4D1C",
    accents: ["#55D054", "#B2FEA0", "#2A19AD", "#D95DCC", "#F0E013"],
    grid: grid(SCHOLAR_VOIDS, toAccents(SCHOLAR_ACCENTS)),
  }),

  Savant: preset("Savant", "100+ reads", {
    primary: "#D95DCC",
    accents: ["#55D054", "#B2FFA0", "#F0DF13", "#2A19AD"],
    grid: grid(SAVANT_VOIDS, toAccents(SAVANT_ACCENTS)),
  }),

  Sage: preset("Sage", "250+ reads", {
    primary: "#999898",
    accents: ["#E4E4E4", "#BCBBBB", "#767676", "#595959", "#333333"],
    grid: grid(SAGE_VOIDS, [], { bodyCells: SAGE_BODY }),
  }),

  Oracle: preset("Oracle", "350+ reads", {
    primary: "#C7B8FB",
    accents: ["#E38B8F", "#EAADAC", "#EEB7A4", "#DEACF6", "#B382F7", "#968FF7"],
    grid: grid(ORACLE_VOIDS, [], { bodyCells: ORACLE_BODY }),
  }),
};

const NINJA_META: Record<NinjaCardName, { caption: string; primary: string }> = {
  "AI Curious": { caption: "0 – 19 XP", primary: "#6B7280" },
  Apprentice: { caption: "20 – 99 XP", primary: "#2563EB" },
  "AI Ninja": { caption: "100 – 299 XP", primary: "#7C3AED" },
  "Sensei Candidate": { caption: "300+ XP — eval pending", primary: "#EAB308" },
  "AI Sensei": { caption: "300+ XP + evaluation", primary: "#D4A017" },
};

for (const name of NINJA_CARD_ORDER) {
  const meta = NINJA_META[name];
  LEVEL_CARD_PRESETS[name] = preset(name, meta.caption, {
    primary: meta.primary,
    accents: [meta.primary],
    titleColor: "#FEFEFE",
    captionColor: "#A1A1AA",
    grid: grid(NINJA_VOIDS[name], []),
  });
}

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
export type LevelCardName = ReadingCardName | NinjaCardName;

export const CARD_CATEGORIES = {
  reading: { label: "Reading", order: LEVEL_CARD_ORDER },
  ninja: { label: "Ninja", order: NINJA_CARD_ORDER },
} as const;

export type CardCategoryId = keyof typeof CARD_CATEGORIES;

export function getPreset(level?: string): LevelCardPreset | undefined {
  if (!level) return undefined;
  return LEVEL_CARD_PRESETS[level];
}
