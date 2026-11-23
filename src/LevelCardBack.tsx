import { forwardRef, useEffect, useRef } from "react";
import { assignRef, bufferPx } from "./lib/canvas";
import { loadImage, onImageLoad } from "./load-image";
import { paintBack } from "./paint";
import type { LevelCardTheme } from "./types";

type Props = {
  theme: LevelCardTheme;
  brand: string;
  fullName: string;
  memberSince: string;
  showMark?: boolean;
  markSrc?: string;
  /** CSS box size in px; buffer uses devicePixelRatio. */
  size?: number;
  className?: string;
};

export const LevelCardBack = forwardRef<HTMLCanvasElement, Props>(function LevelCardBack(
  { theme, brand, fullName, memberSince, showMark = true, markSrc, size = 320, className },
  ref,
) {
  const local = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = local.current;
    if (!canvas) return;
    let cancelled = false;
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

    let unsub: (() => void) | undefined;
    if (markSrc) {
      unsub = onImageLoad(markSrc, paint);
      void loadImage(markSrc)
        .then(paint)
        .catch(() => {});
    }

    return () => {
      cancelled = true;
      unsub?.();
    };
  }, [theme, brand, fullName, memberSince, showMark, markSrc, size]);

  return (
    <canvas
      ref={(node) => {
        local.current = node;
        assignRef(ref, node);
      }}
      className={["level-card__canvas", "level-card__back", className].filter(Boolean).join(" ")}
      role="img"
      aria-label={`${brand || "Card"} for ${fullName || "member"}`}
    />
  );
});
