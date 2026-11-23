/** Public API — keep this surface small for consumers. */

export { LevelCard } from "./LevelCard";
export { LevelCardFace } from "./LevelCardFace";
export { LevelCardBack } from "./LevelCardBack";

export { defaultTheme, mergeTheme } from "./theme";
export { resolveCard } from "./resolve";
export type { ResolvedCard } from "./resolve";
export {
  LEVEL_CARD_PRESETS,
  LEVEL_CARD_ORDER,
  NINJA_CARD_ORDER,
  CARD_CATEGORIES,
  getPreset,
  getCategory,
  categoryForLevel,
  listCategories,
  defineCategory,
  undefineCategory,
  definePreset,
  definePresets,
  undefinePresets,
} from "./presets";
export type {
  LevelCardName,
  NinjaCardName,
  ReadingCardName,
  CardCategoryId,
  CardCategory,
  DefineCategoryInput,
} from "./presets";

export { CARD_GLTF_URL, NINJA_ART_URL } from "./assets";
export {
  paintBack,
  paintFace,
  paintFaceMosaic,
  paintFaceChrome,
  compositeFace,
  buildFaceModel,
} from "./paint";

export type {
  LevelCardProps,
  LevelCardTheme,
  LevelCardPreset,
  GridSpec,
  GridCell,
  AccentCell,
} from "./types";
