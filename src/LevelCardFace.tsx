import { forwardRef, useEffect, useRef } from "react";
import {
  canTweenReveal,
  startArtRevealTween,
  type ArtRevealPrev,
} from "./art-reveal";
import { assignRef, bufferPx } from "./lib/canvas";
import { watchImage } from "./load-image";
import { buildFaceModel, paintFaceChrome, paintFaceMosaic } from "./paint";
import type { ResolvedCard } from "./resolve";

type Props = {
  resolved: ResolvedCard;
  level?: string;
  /** Crop to mosaic; hide title / caption / mark. */
  mini?: boolean;
  /** CSS box size in px; buffer uses devicePixelRatio. */
  size?: number;
  className?: string;
};

export const LevelCardFace = forwardRef<HTMLCanvasElement, Props>(function LevelCardFace(
  { resolved, level, mini, size = 320, className },
  ref,
) {
  const mosaicRef = useRef<HTMLCanvasElement>(null);
  const chromeRef = useRef<HTMLCanvasElement>(null);
  const prevReveal = useRef<ArtRevealPrev | null>(null);

  useEffect(() => {
    const mosaic = mosaicRef.current;
    if (!mosaic) return;
    let cancelled = false;
    const { theme, title, caption, artSrc, markSrc, artFace, revealLadder, revealRank } =
      resolved;
    const ladder = revealLadder;
    const rank = revealRank;

    const paintOpts = { mini, fit: !mini, artSrc, artFace, markSrc };
    const chromeModel = mini
      ? null
      : buildFaceModel(theme, title, caption, level, { flat: true });

    const paintMosaic = (voidCells?: Array<[number, number]>) => {
      if (cancelled || !mosaicRef.current) return;
      const px = bufferPx(size);
      mosaicRef.current.width = mosaicRef.current.height = px;
      paintFaceMosaic(
        mosaicRef.current,
        buildFaceModel(theme, title, caption, level, {
          flat: true,
          voidCells,
        }),
        { ...paintOpts, voidCells },
      );
    };

    const paintChrome = () => {
      if (cancelled || !chromeModel || !chromeRef.current) return;
      const px = bufferPx(size);
      chromeRef.current.width = chromeRef.current.height = px;
      paintFaceChrome(chromeRef.current, chromeModel, paintOpts);
    };

    paintChrome();
    void document.fonts.ready.then(paintChrome);

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let cancelTween = () => {};
    const prev = prevReveal.current;
    if (canTweenReveal(artFace, ladder, rank, prev)) {
      prevReveal.current = { ladder: ladder!, rank };
      cancelTween = startArtRevealTween({
        fromRank: prev!.rank,
        toRank: rank,
        reduce,
        paint: paintMosaic,
      });
    } else {
      prevReveal.current =
        artFace && ladder && rank >= 0 ? { ladder, rank } : null;
      paintMosaic();
    }

    const unsubs = [
      watchImage(artSrc, () => paintMosaic()),
      watchImage(markSrc, () => paintChrome()),
    ];

    return () => {
      cancelled = true;
      cancelTween();
      for (const u of unsubs) u();
    };
  }, [resolved, level, mini, size]);

  return (
    <div
      className={["level-card__face-stack", mini ? "level-card__face-stack--mini" : "", className]
        .filter(Boolean)
        .join(" ")}
      role="img"
      aria-label={mini ? resolved.title : `${resolved.title} — ${resolved.caption}`}
    >
      <canvas
        ref={(node) => {
          mosaicRef.current = node;
          assignRef(ref, node);
        }}
        className="level-card__canvas level-card__face-mosaic"
        aria-hidden="true"
      />
      {mini ? null : (
        <canvas
          ref={chromeRef}
          className="level-card__canvas level-card__face-chrome"
          aria-hidden="true"
        />
      )}
    </div>
  );
});
