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
};

/** Resolve preset + prop overrides into a concrete render model. */
export function resolveCard(props: LevelCardProps): ResolvedCard {
  const preset = getPreset(props.level);
  const theme = mergeTheme(defaultTheme, preset?.theme, props.theme);
  return {
    theme,
    title: props.title ?? preset?.name ?? props.level ?? "Learner",
    caption: props.caption ?? preset?.caption ?? "",
    brand: props.brand ?? "",
    fullName: props.fullName ?? "",
    memberSince: props.memberSince ?? "",
    showMark: props.showMark !== false,
  };
}
