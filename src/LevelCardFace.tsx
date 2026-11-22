import { forwardRef, useEffect, useRef } from "react";
import { assignRef, bufferPx } from "./lib/canvas";
import { buildFaceModel, paintFace } from "./paint";
import type { LevelCardTheme } from "./types";

type Props = {
  theme: LevelCardTheme;
  title: string;
  caption: string;
  level?: string;
  /** Crop to mosaic; hide title / caption / mark. */
  mini?: boolean;
  /** CSS box size in px; buffer uses devicePixelRatio. */
  size?: number;
  className?: string;
};

export const LevelCardFace = forwardRef<HTMLCanvasElement, Props>(function LevelCardFace(
  { theme, title, caption, level, mini, size = 320, className },
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
      paintFace(local.current, buildFaceModel(theme, title, caption, level, { flat: true }), {
        mini,
        fit: !mini,
      });
    };
    paint();
    void document.fonts.ready.then(paint);
    return () => {
      cancelled = true;
    };
  }, [theme, title, caption, level, mini, size]);

  return (
    <canvas
      ref={(node) => {
        local.current = node;
        assignRef(ref, node);
      }}
      className={["level-card__canvas", "level-card__face", mini ? "level-card__face--mini" : "", className]
        .filter(Boolean)
        .join(" ")}
      role="img"
      aria-label={mini ? title : `${title} — ${caption}`}
    />
  );
});
