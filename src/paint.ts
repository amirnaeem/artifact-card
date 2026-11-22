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

/** Back content axis — GLTF UVs are authored to this, not texture mid (1024). */
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

/** GLTF face uses 14 content cols from ~119 — not the 18-col padded lab grid. */
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
  /** Lab/flat faces use the padded grid so the mosaic fills the square. */
  opts?: { flat?: boolean },
): FacePaintModel {
  const gridSpec0 = opts?.flat ? theme.grid : gltfFaceGrid(theme.grid);
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

export function paintFace(
  canvas: HTMLCanvasElement,
  model: FacePaintModel,
  opts?: { mini?: boolean; /** Crop/scale art to fill the canvas (lab faces). */ fit?: boolean },
) {
  const px = canvas.width;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return;
  const { theme } = model;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = theme.background;
  ctx.fillRect(0, 0, px, px);

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const cell of model.cells) {
    minX = Math.min(minX, cell.x);
    minY = Math.min(minY, cell.y);
    maxX = Math.max(maxX, cell.x + cell.w);
    maxY = Math.max(maxY, cell.y + cell.h);
  }

  let framed = false;
  if (opts?.mini) {
    // Tiles only — cover the square, no letterbox.
    const contentW = Math.max(1, maxX - minX);
    const contentH = Math.max(1, maxY - minY);
    const scale = Math.max(px / contentW, px / contentH);
    const ox = (px - contentW * scale) / 2 - minX * scale;
    const oy = (px - contentH * scale) / 2 - minY * scale;
    ctx.setTransform(scale, 0, 0, scale, ox, oy);
  } else if (opts?.fit) {
    maxY = Math.max(maxY, 1940);
    // Keep mosaic centered if the mark sticks past the right edge.
    const markRight = model.markX + 80;
    if (markRight > maxX) {
      const extra = markRight - maxX;
      maxX = markRight;
      minX -= extra;
    }
    const contentW = Math.max(1, maxX - minX);
    const contentH = Math.max(1, maxY - minY);
    const inset = Math.round(px * 0.08);
    const inner = px - inset * 2;
    const scale = Math.min(inner / contentW, inner / contentH);
    const ox = inset + (inner - contentW * scale) / 2 - minX * scale;
    const oy = inset + (inner - contentH * scale) / 2 - minY * scale;
    ctx.save();
    ctx.beginPath();
    ctx.rect(inset, inset, inner, inner);
    ctx.clip();
    ctx.setTransform(scale, 0, 0, scale, ox, oy);
    framed = true;
  } else {
    const scale = px / 2048;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
  }

  for (const cell of model.cells) {
    roundRect(ctx, cell.x, cell.y, cell.w, cell.h, 6);
    ctx.fillStyle = cell.fill;
    ctx.fill();
  }

  if (opts?.mini) {
    if (framed) ctx.restore();
    return;
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
  if (framed) ctx.restore();
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
    showMark?: boolean;
    /** Flat/lab faces are not UV-mirrored. */
    mirror?: boolean;
  },
) {
  const px = canvas.width;
  const scale = px / 2048;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return;
  const { theme } = opts;
  const brand = opts.brand.trim();
  const name = opts.fullName.trim();
  const since = opts.memberSince.trim();
  const showMark = opts.showMark !== false;
  const mirror = opts.mirror !== false;
  const cx = mirror ? BACK_CX : 1024;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = theme.background;
  ctx.fillRect(0, 0, px, px);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);

  if (mirror) {
    ctx.translate(cx, 0);
    ctx.scale(-1, 1);
    ctx.translate(-cx, 0);
  }

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.direction = "ltr";

  // GLTF: authored Y. Flat lab: pack + scale the stack so it fills the square.
  let yBrand = 720;
  let yName = 1180;
  let yMeta = 1280;
  let yMark = 1580;
  if (!mirror) {
    const lines: number[] = [];
    if (brand) lines.push(80);
    if (name) lines.push(110);
    if (since) lines.push(48);
    if (showMark) lines.push(104);
    const gap = 36;
    const total = lines.reduce((s, h) => s + h, 0) + gap * Math.max(0, lines.length - 1);
    let y = 1024 - total / 2;
    const next = (h: number) => {
      const mid = y + h / 2;
      y += h + gap;
      return mid;
    };
    let i = 0;
    if (brand) yBrand = next(lines[i++]);
    if (name) yName = next(lines[i++]);
    if (since) yMeta = next(lines[i++]);
    if (showMark) yMark = next(lines[i++]);
    ctx.translate(cx, 1024);
    ctx.scale(1.55, 1.55);
    ctx.translate(-cx, -1024);
  }

  if (brand) {
    setFont(ctx, brand.toUpperCase(), theme.type.brandWeight, 64, theme.fonts.brand, BACK_MAX_W);
    ctx.fillStyle = theme.brandColor;
    ctx.letterSpacing = "0.28em";
    ctx.fillText(brand.toUpperCase(), cx, yBrand);
  }

  if (name) {
    setFont(ctx, name, theme.type.nameWeight, 92, theme.fonts.name, BACK_MAX_W);
    ctx.fillStyle = theme.nameColor;
    ctx.letterSpacing = "-0.01em";
    ctx.fillText(name, cx, yName);
  }

  if (since) {
    const meta = `MEMBER SINCE ${since.toUpperCase()}`;
    setFont(ctx, meta, theme.type.metaWeight, 36, theme.fonts.meta, BACK_MAX_W);
    ctx.fillStyle = theme.metaColor;
    ctx.letterSpacing = "0.18em";
    ctx.fillText(meta, cx, yMeta);
  }

  if (showMark) {
    drawAsterisk(ctx, cx, yMark, 52, 12, theme.markColor);
  }
}
