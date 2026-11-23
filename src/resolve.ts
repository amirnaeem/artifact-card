import { NINJA_ART_URL } from "./assets";
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
  /** Effective face art URL when `artFace` (safe URL only). */
  artSrc?: string;
  markSrc?: string;
  /** Art mosaic / panel face (preset flag or host `artSrc`). */
  artFace: boolean;
  /** Progressive reveal ladder id, if any. */
  revealLadder?: string;
  /** Index in `revealLadder` order, or -1. */
  revealRank: number;
};

function effectiveArtSrc(artFace: boolean, artSrc?: string): string | undefined {
  if (!artFace) return undefined;
  const url = artSrc ?? NINJA_ART_URL;
  if (isSafeAssetUrl(url)) return url;
  return artSrc ? undefined : NINJA_ART_URL;
}

/** Resolve preset + prop overrides into a concrete render model. */
export function resolveCard(props: LevelCardProps): ResolvedCard {
  const preset = getPreset(props.level);
  const theme = mergeTheme(defaultTheme, preset?.theme, props.theme);
  const artFace = !!(preset?.artFace || props.artSrc);
  const revealLadder = preset?.revealLadder;
  return {
    theme,
    title: props.title ?? preset?.name ?? props.level ?? "Learner",
    caption: props.caption ?? preset?.caption ?? "",
    brand: props.brand ?? "",
    fullName: props.fullName ?? "",
    memberSince: props.memberSince ?? "",
    showMark: props.showMark !== false,
    artSrc: effectiveArtSrc(artFace, props.artSrc),
    markSrc: props.markSrc,
    artFace,
    revealLadder,
    revealRank: revealLadder ? revealRank(revealLadder, props.level) : -1,
  };
}
