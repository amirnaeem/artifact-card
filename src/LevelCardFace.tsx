
import { forwardRef, useMemo } from "react";
import { Asterisk } from "./Asterisk";
import { buildCells, contentPad, gridMetrics, scatterFillsInContent } from "./grid";
import { BEGINNER_COLOR_FILLS } from "./presets";
import type { AccentCell, LevelCardTheme } from "./types";

type Props = {
  theme: LevelCardTheme;
  title: string;
  caption: string;
  level?: string;
  /** Crop to mosaic; hide title / caption / mark. */
  mini?: boolean;
  className?: string;
};

export const LevelCardFace = forwardRef<SVGSVGElement, Props>(function LevelCardFace(
  { theme, title, caption, level, mini, className },
  ref,
) {
  const anim = theme.animation;
  const live = anim.enabled && anim.intensity > 0;
  const stagger = live ? anim.staggerMs : 0;
  const spin = live && anim.markSpin && !mini;
  const { cellW, cellH, stepX, stepY } = gridMetrics(theme.grid);
  const textX = theme.grid.originX;
  const markX = theme.grid.originX + (theme.grid.cols - 1) * stepX + cellW / 2;
  const { contentCols } = contentPad(theme.grid);
  const gridW = (theme.grid.cols - 1) * stepX + cellW;
  const gridH = (theme.grid.rows - 1) * stepY + cellH;
  const pad = 12;
  const viewBox = mini
    ? `${theme.grid.originX - pad} ${theme.grid.originY - pad} ${gridW + pad * 2} ${gridH + pad * 2}`
    : "0 0 2048 2048";

  const accentOverride = useMemo((): AccentCell[] | null => {
    if (level !== "Beginner") return null;
    return scatterFillsInContent(
      BEGINNER_COLOR_FILLS,
      theme.grid.voidCells,
      contentCols,
      theme.grid.rows,
    ).map(({ c, r, fill }) => ({ c, r, fill }));
  }, [level, theme.grid.voidCells, contentCols, theme.grid.rows]);

  const gridSpec = accentOverride
    ? { ...theme.grid, accentCells: accentOverride }
    : theme.grid;

  const cells = buildCells(gridSpec, theme.primary, theme.accents, {
    includeCarve: live,
  });

  const carveBaseDelay = live
    ? (theme.grid.cols + theme.grid.rows) * stagger + 280
    : 0;

  return (
    <svg
      ref={ref}
      className={[
        "level-card__svg",
        "level-card__face",
        mini ? "level-card__face--mini" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      viewBox={viewBox}
      preserveAspectRatio={mini ? "xMidYMid slice" : "xMidYMid meet"}
      role="img"
      aria-label={mini ? title : `${title} — ${caption}`}
    >
      <rect
        x={mini ? theme.grid.originX - pad : 0}
        y={mini ? theme.grid.originY - pad : 0}
        width={mini ? gridW + pad * 2 : 2048}
        height={mini ? gridH + pad * 2 : 2048}
        fill={theme.background}
      />

      <g className="level-card__grid">
        {cells.map((cell) => {
          const wave = (cell.col + cell.row) * stagger * (anim.intensity === 2 ? 0.65 : 1);
          const wobble = ((cell.col * 17 + cell.row * 31) % 5) - 2;
          const carveDelay = carveBaseDelay + (cell.col + cell.row) * (stagger * 0.55);
          return (
            <rect
              key={cell.key}
              className={[
                "level-card__tile",
                live ? "level-card__tile--fun" : "",
                cell.carve ? "level-card__tile--carve" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              x={cell.x}
              y={cell.y}
              width={cell.w}
              height={cell.h}
              rx={6}
              fill={cell.fill}
              style={
                live
                  ? {
                      ["--tile-delay" as string]: `${wave}ms`,
                      ["--tile-wobble" as string]: `${wobble * 8}deg`,
                      ["--carve-delay" as string]: `${carveDelay}ms`,
                    }
                  : undefined
              }
            />
          );
        })}
      </g>

      {!mini ? (
        <>
          <text
            x={textX}
            y={1820}
            fill={theme.titleColor}
            fontFamily={theme.fonts.title}
            fontSize={theme.type.titleSize}
            fontWeight={theme.type.titleWeight}
            letterSpacing="-0.02em"
          >
            {title}
          </text>
          <text
            x={textX + 4}
            y={1900}
            fill={theme.captionColor}
            fontFamily={theme.fonts.caption}
            fontSize={theme.type.captionSize}
            fontWeight={theme.type.captionWeight}
            letterSpacing="0.06em"
          >
            {caption.toUpperCase()}
          </text>
          <Asterisk
            className={spin ? "level-card__mark level-card__mark--spin" : "level-card__mark"}
            cx={markX}
            cy={1840}
            len={70}
            stroke={16}
            color={theme.markColor}
          />
        </>
      ) : null}
    </svg>
  );
});
