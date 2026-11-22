/** Canvas face/back painter for WebGL textures. */

import { buildCells, contentPad, gridMetrics, scatterFillsInContent } from "./grid";
import { BEGINNER_COLOR_FILLS } from "./presets";
import type { AccentCell, GridSpec, LevelCardTheme } from "./types";

export type FacePaintModel = {
  theme: LevelCardTheme;
  title: string;
  caption: string;
  level?: string;
  cells: ReturnType<typeof buildCells>;
  textX: number;
  markX: number;
};

/** Shipping image-back.svg content axis — GLTF UVs are authored to this, not texture mid (1024). */
export const BACK_CX = 834;
const BACK_MAX_W = 1100;

const fontCache = new Map<string, string>();

function resolveCssFont(fontFamily: string): string {
  if (typeof document === "undefined") return fontFamily;
  const hit = fontCache.get(fontFamily);
  if (hit) return hit;
  if (!fontFamily.includes("var(")) {
    fontCache.set(fontFamily, fontFamily);
    return fontFamily;
  }
  const probe = document.createElement("span");
  probe.style.fontFamily = fontFamily;
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  document.body.appendChild(probe);
  const resolved = getComputedStyle(probe).fontFamily || fontFamily;
  probe.remove();
  fontCache.set(fontFamily, resolved);
  return resolved;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawAsterisk(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  len: number,
  stroke: number,
  color: string,
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = color;
  ctx.lineWidth = stroke;
  ctx.lineCap = "butt";
  for (const deg of [0, 45, 90, 135]) {
    ctx.save();
    ctx.rotate((deg * Math.PI) / 180);
    ctx.beginPath();
    ctx.moveTo(0, -len);
    ctx.lineTo(0, len);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

/** Badge SVGs use 14 content cols from ~119 — not the 18-col padded CSS grid. */
export function gltfFaceGrid(grid: GridSpec): GridSpec {
  const contentCols = grid.contentCols ?? 14;
  return {
    ...grid,
    cols: contentCols,
    padCols: 0,
    contentCols,
    originX: 119.2,
    originY: grid.originY,
  };
}

export function buildFaceModel(
  theme: LevelCardTheme,
  title: string,
  caption: string,
  level: string | undefined,
): FacePaintModel {
  const gridSpec0 = gltfFaceGrid(theme.grid);
  const { cellW, stepX } = gridMetrics(gridSpec0);
  const { contentCols } = contentPad(gridSpec0);

  let gridSpec = gridSpec0;
  if (level === "Beginner") {
    const accents: AccentCell[] = scatterFillsInContent(
      BEGINNER_COLOR_FILLS,
      gridSpec0.voidCells,
      contentCols,
      gridSpec0.rows,
    ).map(({ c, r, fill }) => ({ c, r, fill }));
    gridSpec = { ...gridSpec0, accentCells: accents };
  }

  const cells = buildCells(gridSpec, theme.primary, theme.accents, {
    includeCarve: false,
  });

  return {
    theme,
    title,
    caption,
    level,
    cells,
    textX: gridSpec.originX,
    markX: gridSpec.originX + (gridSpec.cols - 1) * stepX + cellW / 2,
  };
}

export function paintFace(canvas: HTMLCanvasElement, model: FacePaintModel) {
  const px = canvas.width;
  const scale = px / 2048;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return;
  const { theme } = model;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = theme.background;
  ctx.fillRect(0, 0, px, px);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);

  for (const cell of model.cells) {
    roundRect(ctx, cell.x, cell.y, cell.w, cell.h, 6);
    ctx.fillStyle = cell.fill;
    ctx.fill();
  }

  ctx.fillStyle = theme.titleColor;
  ctx.font = `${theme.type.titleWeight} ${theme.type.titleSize}px ${resolveCssFont(theme.fonts.title)}`;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.fillText(model.title, model.textX, 1820);

  ctx.fillStyle = theme.captionColor;
  ctx.font = `${theme.type.captionWeight} ${theme.type.captionSize}px ${resolveCssFont(theme.fonts.caption)}`;
  ctx.fillText(model.caption.toUpperCase(), model.textX + 4, 1900);

  drawAsterisk(ctx, model.markX, 1840, 70, 16, theme.markColor);
}

function setFont(
  ctx: CanvasRenderingContext2D,
  text: string,
  weight: number,
  size: number,
  family: string,
  maxW: number,
) {
  let s = size;
  const font = resolveCssFont(family);
  while (s >= 28) {
    ctx.font = `${weight} ${s}px ${font}`;
    if (ctx.measureText(text).width <= maxW) return;
    s -= 4;
  }
  ctx.font = `${weight} ${s}px ${font}`;
}

/** Back texture: centered stack on BACK_CX, mirrored for back-mesh UVs. */
export function paintBack(
  canvas: HTMLCanvasElement,
  opts: {
    theme: LevelCardTheme;
    brand: string;
    fullName: string;
    memberSince: string;
  },
) {
  const px = canvas.width;
  const scale = px / 2048;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return;
  const { theme } = opts;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = theme.background;
  ctx.fillRect(0, 0, px, px);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);

  const name = opts.fullName || "Your Name";
  const meta = opts.memberSince.trim()
    ? `MEMBER SINCE ${opts.memberSince.trim().toUpperCase()}`
    : "MEMBER SINCE —";

  ctx.translate(BACK_CX, 0);
  ctx.scale(-1, 1);
  ctx.translate(-BACK_CX, 0);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.direction = "ltr";

  setFont(ctx, opts.brand.toUpperCase(), theme.type.brandWeight, 64, theme.fonts.brand, BACK_MAX_W);
  ctx.fillStyle = theme.brandColor;
  ctx.letterSpacing = "0.28em";
  ctx.fillText(opts.brand.toUpperCase(), BACK_CX, 720);

  drawAsterisk(ctx, BACK_CX, 920, 52, 12, theme.markColor);

  setFont(ctx, name, theme.type.nameWeight, 92, theme.fonts.name, BACK_MAX_W);
  ctx.fillStyle = theme.nameColor;
  ctx.letterSpacing = "-0.01em";
  ctx.fillText(name, BACK_CX, 1180);

  setFont(ctx, meta, theme.type.metaWeight, 36, theme.fonts.meta, BACK_MAX_W);
  ctx.fillStyle = theme.metaColor;
  ctx.letterSpacing = "0.18em";
  ctx.fillText(meta, BACK_CX, 1280);

  drawAsterisk(ctx, BACK_CX, 1580, 52, 12, theme.markColor);
}
