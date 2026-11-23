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
  /** Art mosaic / panel face (requires a safe effective art URL). */
  artFace: boolean;
  /** Progressive reveal ladder id, if any. */
  revealLadder?: string;
  /** Index in `revealLadder` order, or -1. */
  revealRank: number;
};

/**
 * Pick an art URL, or fall back to a color mosaic when none is usable.
 * Host `artSrc` must pass the URL safety gate; category `defaultArtSrc` is trusted
 * (packaged `import.meta.url` assets may be `file://` under Node).
 */
function resolveArt(
  wanted: boolean,
  artSrc: string | undefined,
  defaultArtSrc: string | undefined,
): { artFace: boolean; artSrc?: string } {
  if (!wanted) return { artFace: false };
  if (artSrc) {
    if (isSafeAssetUrl(artSrc)) return { artFace: true, artSrc };
    if (defaultArtSrc) return { artFace: true, artSrc: defaultArtSrc };
    return { artFace: false };
  }
  if (defaultArtSrc) return { artFace: true, artSrc: defaultArtSrc };
  return { artFace: false };
}

/** Resolve preset + category + prop overrides into a concrete render model. */
export function resolveCard(props: LevelCardProps): ResolvedCard {
  const level = props.level;
  const preset =
    (level && props.presets?.[level]) || getPreset(level) || undefined;
  const category =
    getCategory(props.category) ?? categoryForLevel(level) ?? undefined;
  const theme = mergeTheme(defaultTheme, preset?.theme, props.theme);
  const wantedArt =
    !!(preset?.artFace ?? category?.artFace) || !!props.artSrc;
  const { artFace, artSrc } = resolveArt(
    wantedArt,
    props.artSrc,
    category?.defaultArtSrc,
  );
  const revealLadder = preset?.revealLadder ?? category?.revealLadder;
  return {
    theme,
    title: props.title ?? preset?.name ?? level ?? "Award",
    caption: props.caption ?? preset?.caption ?? "",
    brand: props.brand ?? "",
    fullName: props.fullName ?? "",
    memberSince: props.memberSince ?? "",
    showMark: props.showMark !== false,
    categoryId: category?.id,
    artSrc,
    markSrc: props.markSrc,
    artFace,
    revealLadder,
    revealRank: revealLadder ? revealRank(revealLadder, level) : -1,
  };
}
