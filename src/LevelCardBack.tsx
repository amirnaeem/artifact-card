import { forwardRef, useEffect, useRef } from "react";
import { assignRef, bufferPx } from "./lib/canvas";
import { watchImage } from "./load-image";
import { paintBack } from "./paint";
import type { ResolvedCard } from "./resolve";

type Props = {
  resolved: ResolvedCard;
  /** CSS box size in px; buffer uses devicePixelRatio. */
  size?: number;
  className?: string;
};

export const LevelCardBack = forwardRef<HTMLCanvasElement, Props>(function LevelCardBack(
  { resolved, size = 320, className },
  ref,
) {
  const local = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = local.current;
    if (!canvas) return;
    let cancelled = false;
    const { theme, brand, fullName, memberSince, showMark, markSrc } = resolved;
    const paint = () => {
      if (cancelled || !local.current) return;
      const px = bufferPx(size);
      local.current.width = local.current.height = px;
      paintBack(local.current, {
        theme,
        brand,
        fullName,
        memberSince,
        showMark,
        markSrc,
        mirror: false,
      });
    };
    paint();
    void document.fonts.ready.then(paint);
    const unsub = watchImage(markSrc, paint);

    return () => {
      cancelled = true;
      unsub();
    };
  }, [resolved, size]);

  return (
    <canvas
      ref={(node) => {
        local.current = node;
        assignRef(ref, node);
      }}
      className={["level-card__canvas", "level-card__back", className].filter(Boolean).join(" ")}
      role="img"
      aria-label={`${resolved.brand || "Card"} for ${resolved.fullName || "member"}`}
    />
  );
});
