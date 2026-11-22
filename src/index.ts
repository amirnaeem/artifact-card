/** Public API — keep this surface small for consumers. */

export { LevelCard } from "./LevelCard";
export { LevelCardFace } from "./LevelCardFace";
export { LevelCardBack } from "./LevelCardBack";

export { defaultTheme, mergeTheme } from "./theme";
export { resolveCard } from "./resolve";
export {
  LEVEL_CARD_PRESETS,
  LEVEL_CARD_ORDER,
  getPreset,
} from "./presets";
export type { LevelCardName } from "./presets";

export { CARD_GLTF_URL } from "./assets";
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
