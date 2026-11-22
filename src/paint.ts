/** Canvas face/back painter for WebGL textures. */

import { buildCells, contentPad, gridMetrics, scatterFillsInContent } from "./grid";
import { BEGINNER_COLOR_FILLS } from "./presets";
import type { AccentCell, GridSpec, LevelCardTheme } from "./types";

/** Chromatic levels only — Sage/Oracle body maps stay static. */
export function flickerFillsFor(
  theme: LevelCardTheme,
  level?: string,
): string[] | null {
  if (theme.grid.bodyCells?.length) return null;
  if (level === "Beginner") return BEGINNER_COLOR_FILLS;
  const fills = theme.grid.accentCells
    .map((a) => a.fill ?? theme.accents[a.colorIndex ?? -1])
    .filter((f): f is string => typeof f === "string");
  return fills.length > 0 ? fills : null;
}

export type FacePaintModel = {
  theme: LevelCardTheme;
  title: string;
  caption: string;
  level?: string;
  cells: ReturnType<typeof buildCells>;
  textX: number;
  markX: number;
};

export type FacePaintOpts = {
  mini?: boolean;
  /** Crop/scale art to fill the canvas (lab faces). */
  fit?: boolean;
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

/** Dark carve + light lip + fill — engraved metal stamp. */
function embossAsterisk(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  len: number,
  stroke: number,
  color: string,
) {
  drawAsterisk(ctx, cx + 2, cy + 2.5, len, stroke + 2, "rgba(0,0,0,0.5)");
  drawAsterisk(ctx, cx - 1.5, cy - 2, len, stroke - 2, "rgba(255,255,255,0.2)");
  drawAsterisk(ctx, cx, cy, len, stroke, color);
}

type FaceLayout = {
  scale: number;
  ox: number;
  oy: number;
  framed: boolean;
  inset: number;
  inner: number;
};

/** Shared mosaic/type transform so layers stay aligned. */
export function faceLayout(
  model: FacePaintModel,
  px: number,
  opts?: FacePaintOpts,
): FaceLayout {
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
  if (!Number.isFinite(minX)) {
    minX = 0;
    minY = 0;
    maxX = 2048;
    maxY = 1940;
  }

  if (opts?.mini) {
    const contentW = Math.max(1, maxX - minX);
    const contentH = Math.max(1, maxY - minY);
    const scale = Math.max(px / contentW, px / contentH);
    return {
      scale,
      ox: (px - contentW * scale) / 2 - minX * scale,
      oy: (px - contentH * scale) / 2 - minY * scale,
      framed: false,
      inset: 0,
      inner: px,
    };
  }

  if (opts?.fit) {
    maxY = Math.max(maxY, 1940);
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
    return {
      scale,
      ox: inset + (inner - contentW * scale) / 2 - minX * scale,
      oy: inset + (inner - contentH * scale) / 2 - minY * scale,
      framed: true,
      inset,
      inner,
    };
  }

  const scale = px / 2048;
  return { scale, ox: 0, oy: 0, framed: false, inset: 0, inner: px };
}

function applyLayout(ctx: CanvasRenderingContext2D, layout: FaceLayout) {
  ctx.setTransform(layout.scale, 0, 0, layout.scale, layout.ox, layout.oy);
}

function withFaceClip(
  ctx: CanvasRenderingContext2D,
  layout: FaceLayout,
  draw: () => void,
) {
  if (layout.framed) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(layout.inset, layout.inset, layout.inner, layout.inner);
    ctx.clip();
  }
  applyLayout(ctx, layout);
  draw();
  if (layout.framed) ctx.restore();
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
  opts?: { flat?: boolean; accentCells?: AccentCell[] },
): FacePaintModel {
  const gridSpec0 = opts?.flat ? theme.grid : gltfFaceGrid(theme.grid);
  const { cellW, stepX } = gridMetrics(gridSpec0);
  const { contentCols } = contentPad(gridSpec0);

  let gridSpec = gridSpec0;
  if (opts?.accentCells) {
    gridSpec = { ...gridSpec0, accentCells: opts.accentCells };
  } else if (level === "Beginner") {
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

/** Opaque mosaic layer (background + embossed tiles). */
export function paintFaceMosaic(
  canvas: HTMLCanvasElement,
  model: FacePaintModel,
  opts?: FacePaintOpts,
) {
  const px = canvas.width;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return;
  const layout = faceLayout(model, px, opts);

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = model.theme.background;
  ctx.fillRect(0, 0, px, px);

  withFaceClip(ctx, layout, () => {
    for (const cell of model.cells) {
      roundRect(ctx, cell.x, cell.y, cell.w, cell.h, 6);
      ctx.fillStyle = cell.fill;
      ctx.fill();
      roundRect(ctx, cell.x + 1.2, cell.y + 1.2, cell.w - 2.4, cell.h - 2.4, 5);
      ctx.strokeStyle = "rgba(255,255,255,0.28)";
      ctx.lineWidth = 1.6;
      ctx.stroke();
      roundRect(ctx, cell.x + 2.2, cell.y + 2.2, cell.w - 3.2, cell.h - 3.2, 4);
      ctx.strokeStyle = "rgba(0,0,0,0.35)";
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }
  });
}

function drawEmbossedChrome(
  ctx: CanvasRenderingContext2D,
  model: FacePaintModel,
  layout: FaceLayout,
) {
  const { theme } = model;
  withFaceClip(ctx, layout, () => {
    const embossText = (text: string, x: number, y: number, fill: string, font: string) => {
      ctx.font = font;
      ctx.textBaseline = "alphabetic";
      ctx.textAlign = "left";
      ctx.letterSpacing = "0px";
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillText(text, x + 2.5, y + 3.5);
      ctx.fillStyle = "rgba(255,255,255,0.22)";
      ctx.fillText(text, x - 1.5, y - 2);
      ctx.fillStyle = fill;
      ctx.fillText(text, x, y);
    };

    const title = model.title.trim();
    if (title) {
      embossText(
        title,
        model.textX,
        1820,
        theme.titleColor,
        `${theme.type.titleWeight} ${theme.type.titleSize}px ${resolveCssFont(theme.fonts.title)}`,
      );
    }

    const caption = model.caption.trim();
    if (caption) {
      embossText(
        caption.toUpperCase(),
        model.textX + 4,
        1900,
        theme.captionColor,
        `${theme.type.captionWeight} ${theme.type.captionSize}px ${resolveCssFont(theme.fonts.caption)}`,
      );
    }

    embossAsterisk(ctx, model.markX, 1840, 70, 16, theme.markColor);
  });
}

/** Transparent type layer (title / caption / mark). Mini → clear only. */
export function paintFaceChrome(
  canvas: HTMLCanvasElement,
  model: FacePaintModel,
  opts?: FacePaintOpts,
) {
  const px = canvas.width;
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, px, px);
  if (opts?.mini) return;
  drawEmbossedChrome(ctx, model, faceLayout(model, px, opts));
}

/** Stamp mosaic then chrome onto an opaque destination (compat path). */
export function compositeFace(
  dest: HTMLCanvasElement,
  mosaic: HTMLCanvasElement,
  chrome: HTMLCanvasElement,
) {
  const ctx = dest.getContext("2d", { alpha: false });
  if (!ctx) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(mosaic, 0, 0);
  ctx.drawImage(chrome, 0, 0);
}

/** Full face: mosaic + chrome on one canvas (compat / non-layered callers). */
export function paintFace(
  canvas: HTMLCanvasElement,
  model: FacePaintModel,
  opts?: FacePaintOpts,
) {
  paintFaceMosaic(canvas, model, opts);
  if (opts?.mini) return;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return;
  drawEmbossedChrome(ctx, model, faceLayout(model, canvas.width, opts));
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

export type BackPaintOpts = {
  theme: LevelCardTheme;
  brand: string;
  fullName: string;
  memberSince: string;
  showMark?: boolean;
  /** Flat/lab faces are not UV-mirrored. */
  mirror?: boolean;
};

type BackLayout = {
  cx: number;
  yBrand: number;
  yName: number;
  yMeta: number;
  yMark: number;
  brand: string;
  name: string;
  since: string;
  showMark: boolean;
  brandSize: number;
  nameSize: number;
  metaSize: number;
};

function prepareBackCtx(
  ctx: CanvasRenderingContext2D,
  px: number,
  opts: BackPaintOpts,
): BackLayout {
  const { theme } = opts;
  const brand = opts.brand.trim();
  const name = opts.fullName.trim();
  const since = opts.memberSince.trim();
  const showMark = opts.showMark !== false;
  const mirror = opts.mirror !== false;
  const cx = mirror ? BACK_CX : 1024;
  const brandSize = theme.type.brandSize;
  const nameSize = theme.type.nameSize;
  const metaSize = theme.type.metaSize;

  ctx.setTransform(px / 2048, 0, 0, px / 2048, 0, 0);
  if (mirror) {
    ctx.translate(cx, 0);
    ctx.scale(-1, 1);
    ctx.translate(-cx, 0);
  }

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.direction = "ltr";

  let yBrand = 720;
  let yName = 1180;
  let yMeta = 1280;
  let yMark = 1580;
  if (!mirror) {
    const lines: number[] = [];
    if (brand) lines.push(Math.round(brandSize * 1.15));
    if (name) lines.push(Math.round(nameSize * 1.15));
    if (since) lines.push(Math.round(metaSize * 1.35));
    if (showMark) lines.push(116);
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

  return {
    cx,
    yBrand,
    yName,
    yMeta,
    yMark,
    brand,
    name,
    since,
    showMark,
    brandSize,
    nameSize,
    metaSize,
  };
}

function drawEmbossedBackType(
  ctx: CanvasRenderingContext2D,
  opts: BackPaintOpts,
  layout: BackLayout,
) {
  const { theme } = opts;
  const { cx, yBrand, yName, yMeta, yMark, brand, name, since, showMark, brandSize, nameSize, metaSize } =
    layout;

  const embossCentered = (text: string, y: number, fill: string, tracking: string) => {
    ctx.letterSpacing = tracking;
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillText(text, cx + 2.5, y + 3.5);
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.fillText(text, cx - 1.5, y - 2);
    ctx.fillStyle = fill;
    ctx.fillText(text, cx, y);
    ctx.letterSpacing = "0px";
  };

  if (brand) {
    setFont(ctx, brand.toUpperCase(), theme.type.brandWeight, brandSize, theme.fonts.brand, BACK_MAX_W);
    embossCentered(brand.toUpperCase(), yBrand, theme.brandColor, "0.28em");
  }
  if (name) {
    setFont(ctx, name, theme.type.nameWeight, nameSize, theme.fonts.name, BACK_MAX_W);
    embossCentered(name, yName, theme.nameColor, "-0.01em");
  }
  if (since) {
    const meta = `MEMBER SINCE ${since.toUpperCase()}`;
    setFont(ctx, meta, theme.type.metaWeight, metaSize, theme.fonts.meta, BACK_MAX_W);
    embossCentered(meta, yMeta, theme.metaColor, "0.18em");
  }
  if (showMark) {
    embossAsterisk(ctx, cx, yMark, 58, 13, theme.markColor);
  }
}

/** Full back: plate + embossed type. */
export function paintBack(canvas: HTMLCanvasElement, opts: BackPaintOpts) {
  const px = canvas.width;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = opts.theme.background;
  ctx.fillRect(0, 0, px, px);
  drawEmbossedBackType(ctx, opts, prepareBackCtx(ctx, px, opts));
}
