import { NINJA_ART_URL } from "./assets";
import { categoryForLevel, getCategory } from "./categories";
import { isSafeAssetUrl } from "./load-image";
import { revealRank } from "./ninja-voids";
import { getPreset } from "./presets";
import { defaultTheme, mergeTheme } from "./theme";
import type { LevelCardProps, LevelCardTheme } from "./types";

export type ResolvedCard = {
  theme: LevelCardTheme;
  title: string;
  caption: string;
  brand: string;
  fullName: string;
  memberSince: string;
  showMark: boolean;
  /** Resolved category id when known. */
  categoryId?: string;
  /** Effective face art URL when `artFace` (safe URL only). */
  artSrc?: string;
  markSrc?: string;
  /** Art mosaic / panel face (category/preset flag or host `artSrc`). */
  artFace: boolean;
  /** Progressive reveal ladder id, if any. */
  revealLadder?: string;
  /** Index in `revealLadder` order, or -1. */
  revealRank: number;
  /** Category allows chromatic flicker. */
  flickerAllowed: boolean;
};

function effectiveArtSrc(
  artFace: boolean,
  artSrc: string | undefined,
  defaultArtSrc: string | undefined,
): string | undefined {
  if (!artFace) return undefined;
  const url = artSrc ?? defaultArtSrc ?? NINJA_ART_URL;
  if (isSafeAssetUrl(url)) return url;
  return artSrc ? undefined : defaultArtSrc ?? NINJA_ART_URL;
}

/** Resolve preset + category + prop overrides into a concrete render model. */
export function resolveCard(props: LevelCardProps): ResolvedCard {
  const preset = getPreset(props.level);
  const category =
    getCategory(props.category) ?? categoryForLevel(props.level) ?? undefined;
  const theme = mergeTheme(defaultTheme, preset?.theme, props.theme);
  const artFace = !!(preset?.artFace ?? category?.artFace) || !!props.artSrc;
  const revealLadder = preset?.revealLadder ?? category?.revealLadder;
  return {
    theme,
    title: props.title ?? preset?.name ?? props.level ?? "Learner",
    caption: props.caption ?? preset?.caption ?? "",
    brand: props.brand ?? "",
    fullName: props.fullName ?? "",
    memberSince: props.memberSince ?? "",
    showMark: props.showMark !== false,
    categoryId: category?.id,
    artSrc: effectiveArtSrc(artFace, props.artSrc, category?.defaultArtSrc),
    markSrc: props.markSrc,
    artFace,
    revealLadder,
    revealRank: revealLadder ? revealRank(revealLadder, props.level) : -1,
    flickerAllowed: !!category?.flicker && !artFace,
  };
}
