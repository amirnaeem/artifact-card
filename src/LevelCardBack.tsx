
import { forwardRef } from "react";
import { Asterisk } from "./Asterisk";
import { BACK_CX } from "./paint";
import type { LevelCardTheme } from "./types";

type Props = {
  theme: LevelCardTheme;
  brand: string;
  fullName: string;
  memberSince: string;
  className?: string;
};

export const LevelCardBack = forwardRef<SVGSVGElement, Props>(function LevelCardBack(
  { theme, brand, fullName, memberSince, className },
  ref,
) {
  const meta = memberSince.trim()
    ? `MEMBER SINCE ${memberSince.trim().toUpperCase()}`
    : "MEMBER SINCE —";
  const spin =
    theme.animation.enabled && theme.animation.markSpin && theme.animation.intensity > 0;

  return (
    <svg
      ref={ref}
      className={["level-card__svg", "level-card__back", className].filter(Boolean).join(" ")}
      viewBox="0 0 2048 2048"
      role="img"
      aria-label={`${brand} card for ${fullName || "member"}`}
    >
      <rect width="2048" height="2048" fill={theme.background} />

      <text
        x={BACK_CX}
        y="620"
        textAnchor="middle"
        fill={theme.brandColor}
        fontFamily={theme.fonts.brand}
        fontSize={theme.type.brandSize}
        fontWeight={theme.type.brandWeight}
        letterSpacing="0.28em"
      >
        {brand.toUpperCase()}
      </text>

      <text
        x={BACK_CX}
        y="1080"
        textAnchor="middle"
        fill={theme.nameColor}
        fontFamily={theme.fonts.name}
        fontSize={theme.type.nameSize}
        fontWeight={theme.type.nameWeight}
        letterSpacing="-0.01em"
      >
        {fullName || "Your Name"}
      </text>

      <text
        x={BACK_CX}
        y="1180"
        textAnchor="middle"
        fill={theme.metaColor}
        fontFamily={theme.fonts.meta}
        fontSize={theme.type.metaSize}
        fontWeight={theme.type.metaWeight}
        letterSpacing="0.18em"
      >
        {meta}
      </text>

      <Asterisk
        className={spin ? "level-card__mark level-card__mark--spin" : "level-card__mark"}
        cx={BACK_CX}
        cy={1680}
        len={64}
        stroke={14}
        color={theme.markColor}
      />
    </svg>
  );
});
