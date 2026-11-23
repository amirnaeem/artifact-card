import { forwardRef, useEffect, useRef } from "react";
import { ACCENT_FLICKER_MS, contentPad, stepAccentCells } from "./grid";
import { assignRef, bufferPx } from "./lib/canvas";
import { loadImage, onImageLoad } from "./load-image";
import {
  NINJA_REVEAL_MS,
  ninjaRevealedCount,
  ninjaVoidsForRevealed,
  revealRank,
} from "./ninja-voids";
import {
  buildFaceModel,
  flickerFillsFor,
  paintFaceChrome,
  paintFaceMosaic,
} from "./paint";
import { getPreset } from "./presets";
import type { AccentCell, LevelCardTheme } from "./types";

type Props = {
  theme: LevelCardTheme;
  title: string;
  caption: string;
  level?: string;
  /** Effective art URL when this is an art face. */
  artSrc?: string;
  markSrc?: string;
  /** Crop to mosaic; hide title / caption / mark. */
  mini?: boolean;
  /** Step-animate accent tiles. Default off. */
  flicker?: boolean;
  /** CSS box size in px; buffer uses devicePixelRatio. */
  size?: number;
  className?: string;
};

export const LevelCardFace = forwardRef<HTMLCanvasElement, Props>(function LevelCardFace(
  { theme, title, caption, level, artSrc, markSrc, mini, flicker = false, size = 320, className },
  ref,
) {
  const mosaicRef = useRef<HTMLCanvasElement>(null);
  const chromeRef = useRef<HTMLCanvasElement>(null);
  const prevReveal = useRef<{ ladder?: string; rank: number } | null>(null);

  useEffect(() => {
    const mosaic = mosaicRef.current;
    if (!mosaic) return;
    let cancelled = false;
    const artFace = !!artSrc;
    const ladder = getPreset(level)?.revealLadder;
    const rank = ladder ? revealRank(ladder, level) : -1;
    const fills = flicker && !artFace ? flickerFillsFor(theme, level) : null;
    const { contentCols } = contentPad(theme.grid);
    let accents: AccentCell[] | undefined = fills
      ? stepAccentCells(fills, theme.grid.voidCells, contentCols, theme.grid.rows)
      : undefined;

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
          accentCells: accents,
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

    let raf = 0;
    const prev = prevReveal.current;
    const canTween =
      artFace &&
      !!ladder &&
      rank >= 0 &&
      !!prev &&
      prev.ladder === ladder &&
      prev.rank >= 0 &&
      prev.rank !== rank &&
      !reduce;

    if (canTween) {
      const to = ninjaRevealedCount(rank);
      const from = ninjaRevealedCount(prev!.rank);
      prevReveal.current = { ladder, rank };
      if (from === to) {
        paintMosaic();
      } else {
        const start = performance.now();
        const tick = (now: number) => {
          if (cancelled) return;
          const u = Math.min(1, (now - start) / NINJA_REVEAL_MS);
          const eased = 1 - (1 - u) ** 3;
          paintMosaic(ninjaVoidsForRevealed(from + (to - from) * eased));
          if (u < 1) raf = requestAnimationFrame(tick);
        };
        paintMosaic(ninjaVoidsForRevealed(from));
        raf = requestAnimationFrame(tick);
      }
    } else {
      prevReveal.current = artFace && ladder && rank >= 0 ? { ladder, rank } : null;
      paintMosaic();
    }

    const unsubs: Array<() => void> = [];
    if (artSrc) {
      unsubs.push(onImageLoad(artSrc, () => paintMosaic()));
      void loadImage(artSrc)
        .then(() => paintMosaic())
        .catch(() => {});
    }
    if (markSrc) {
      unsubs.push(onImageLoad(markSrc, () => paintChrome()));
      void loadImage(markSrc)
        .then(() => paintChrome())
        .catch(() => {});
    }

    let timer = 0;
    if (fills && !reduce) {
      timer = window.setInterval(() => {
        accents = stepAccentCells(fills, theme.grid.voidCells, contentCols, theme.grid.rows);
        paintMosaic();
      }, ACCENT_FLICKER_MS);
    }

    return () => {
      cancelled = true;
      for (const u of unsubs) u();
      if (timer) window.clearInterval(timer);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [theme, title, caption, level, artSrc, markSrc, mini, flicker, size]);

  return (
    <div
      className={["level-card__face-stack", mini ? "level-card__face-stack--mini" : "", className]
        .filter(Boolean)
        .join(" ")}
      role="img"
      aria-label={mini ? title : `${title} — ${caption}`}
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
