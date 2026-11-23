/** Canvas face/back painter for WebGL textures. */

import { buildCells, contentPad, gridMetrics, scatterFillsInContent } from "./grid";
import { getImage } from "./load-image";
import { BEGINNER_COLOR_FILLS } from "./presets";
import type { AccentCell, GridCell, GridSpec, LevelCardTheme } from "./types";

/** Mosaic bounds in face design units (includes side pads when present). */
function mosaicBounds(cells: GridCell[]) {
  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  for (const cell of cells) {
    left = Math.min(left, cell.x);
    top = Math.min(top, cell.y);
    right = Math.max(right, cell.x + cell.w);
    bottom = Math.max(bottom, cell.y + cell.h);
  }
  return { left, top, w: right - left, h: bottom - top };
}

function drawArtTile(
  ctx: CanvasRenderingContext2D,
  cell: GridCell,
  img: HTMLImageElement,
  bounds: { left: number; top: number; w: number; h: number },
) {
  const scale = Math.max(bounds.w / img.naturalWidth, bounds.h / img.naturalHeight);
  const drawnW = img.naturalWidth * scale;
  const drawnH = img.naturalHeight * scale;
  const ox = bounds.left + (bounds.w - drawnW) / 2;
  const oy = bounds.top + (bounds.h - drawnH) / 2;

  const sx = (cell.x - ox) / scale;
  const sy = (cell.y - oy) / scale;
  const sw = cell.w / scale;
  const sh = cell.h / scale;

  ctx.save();
  roundRect(ctx, cell.x, cell.y, cell.w, cell.h, 6);
  ctx.clip();
  ctx.drawImage(img, sx, sy, sw, sh, cell.x, cell.y, cell.w, cell.h);
  ctx.restore();
}

function strokeEmboss(ctx: CanvasRenderingContext2D, cell: GridCell) {
  roundRect(ctx, cell.x + 1.2, cell.y + 1.2, cell.w - 2.4, cell.h - 2.4, 5);
  ctx.strokeStyle = "rgba(255,255,255,0.28)";
  ctx.lineWidth = 1.6;
  ctx.stroke();
  roundRect(ctx, cell.x + 2.2, cell.y + 2.2, cell.w - 3.2, cell.h - 3.2, 4);
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = 1.4;
  ctx.stroke();
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
  /** Transparent covers over a Ninja art panel (voids = still covered). */
  panelReveal?: boolean;
  /** Override theme voids (Ninja reveal tweens). */
  voidCells?: Array<[number, number]>;
  /** Face art URL (art mosaic tiles). */
  artSrc?: string;
  /** When true, paint art into tiles (or panel-reveal covers). */
  artFace?: boolean;
  /** Mark/logo URL; replaces the default asterisk. */
  markSrc?: string;
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

/** Custom mark image with emboss offsets, or default asterisk. */
function embossMark(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  color: string,
  logo: HTMLImageElement | null,
  asterisk: { len: number; stroke: number },
) {
  if (logo && logo.naturalWidth > 0) {
    const size = asterisk.len * 2;
    const draw = (dx: number, dy: number, alpha: number) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.drawImage(logo, cx - size / 2 + dx, cy - size / 2 + dy, size, size);
      ctx.restore();
    };
    draw(2, 2.5, 0.5);
    draw(-1.5, -2, 0.22);
    draw(0, 0, 1);
    return;
  }
  embossAsterisk(ctx, cx, cy, asterisk.len, asterisk.stroke, color);
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
  opts?: {
    flat?: boolean;
    accentCells?: AccentCell[];
    voidCells?: Array<[number, number]>;
  },
): FacePaintModel {
  const gridSpec0 = opts?.flat ? theme.grid : gltfFaceGrid(theme.grid);
  const { cellW, stepX } = gridMetrics(gridSpec0);
  const { contentCols } = contentPad(gridSpec0);

  let gridSpec = opts?.voidCells
    ? { ...gridSpec0, voidCells: opts.voidCells }
    : gridSpec0;
  if (opts?.accentCells) {
    gridSpec = { ...gridSpec, accentCells: opts.accentCells };
  } else if (level === "Beginner") {
    const accents: AccentCell[] = scatterFillsInContent(
      BEGINNER_COLOR_FILLS,
      gridSpec.voidCells,
      contentCols,
      gridSpec.rows,
    ).map(({ c, r, fill }) => ({ c, r, fill }));
    gridSpec = { ...gridSpec, accentCells: accents };
  }

  const cells = buildCells(gridSpec, theme.primary, theme.accents, {
    includeCarve: false,
  });

  return {
    theme: opts?.voidCells
      ? { ...theme, grid: { ...theme.grid, voidCells: opts.voidCells } }
      : theme,
    title,
    caption,
    level,
    cells,
    textX: gridSpec.originX,
    markX: gridSpec.originX + (gridSpec.cols - 1) * stepX + cellW / 2,
  };
}

/** Mosaic layer (opaque tiles, or transparent panel-reveal covers for Ninja GL). */
export function paintFaceMosaic(
  canvas: HTMLCanvasElement,
  model: FacePaintModel,
  opts?: FacePaintOpts,
) {
  const px = canvas.width;
  const panelReveal = !!opts?.panelReveal;
  // Alpha context is sticky on first getContext — always request it.
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (panelReveal) {
    ctx.clearRect(0, 0, px, px);
  } else {
    ctx.fillStyle = model.theme.background;
    ctx.fillRect(0, 0, px, px);
  }

  const artUrl = opts?.artSrc;
  const art = opts?.artFace && !panelReveal && artUrl ? getImage(artUrl) : null;
  const bounds = art && model.cells.length ? mosaicBounds(model.cells) : null;

  const baseGrid =
    opts?.fit || opts?.mini ? model.theme.grid : gltfFaceGrid(model.theme.grid);
  const gridForPaint = opts?.voidCells
    ? { ...baseGrid, voidCells: opts.voidCells }
    : baseGrid;

  const cells = panelReveal
    ? buildCells(gridForPaint, model.theme.primary, model.theme.accents, {
        includeCarve: true,
      })
    : opts?.voidCells
      ? buildCells(gridForPaint, model.theme.primary, model.theme.accents, {
          includeCarve: false,
        })
      : model.cells;

  const paintModel = panelReveal ? { ...model, cells } : model;
  const layout = faceLayout(paintModel, px, opts);

  withFaceClip(ctx, layout, () => {
    for (const cell of cells) {
      if (panelReveal) {
        if (cell.carve) {
          roundRect(ctx, cell.x, cell.y, cell.w, cell.h, 6);
          ctx.fillStyle = model.theme.background;
          ctx.fill();
          strokeEmboss(ctx, cell);
        } else {
          strokeEmboss(ctx, cell);
        }
        continue;
      }
      if (art && bounds) {
        drawArtTile(ctx, cell, art, bounds);
      } else {
        roundRect(ctx, cell.x, cell.y, cell.w, cell.h, 6);
        ctx.fillStyle = cell.fill;
        ctx.fill();
      }
      strokeEmboss(ctx, cell);
    }
  });
}

function drawEmbossedChrome(
  ctx: CanvasRenderingContext2D,
  model: FacePaintModel,
  layout: FaceLayout,
  markSrc?: string,
) {
  const { theme } = model;
  const markLogo = markSrc ? getImage(markSrc) : null;
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

    embossMark(ctx, model.markX, 1840, theme.markColor, markLogo, { len: 70, stroke: 16 });
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
  drawEmbossedChrome(ctx, model, faceLayout(model, px, opts), opts?.markSrc);
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
  drawEmbossedChrome(ctx, model, faceLayout(model, canvas.width, opts), opts?.markSrc);
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
  /** Mark/logo URL; replaces the default asterisk. */
  markSrc?: string;
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
    const markLogo = opts.markSrc ? getImage(opts.markSrc) : null;
    embossMark(ctx, cx, yMark, theme.markColor, markLogo, { len: 58, stroke: 13 });
  }
}

/** Near-black matte plate — soft grain only (type lives on the chrome layer). */
export function paintBackPlate(canvas: HTMLCanvasElement) {
  const px = canvas.width;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = "#050505";
  ctx.fillRect(0, 0, px, px);

  ctx.save();
  for (let y = 0; y < px; y += 2) {
    const t = ((y * 47) ^ (y * 13)) & 255;
    ctx.globalAlpha = 0.02 + (t / 255) * 0.035;
    ctx.fillStyle = t & 1 ? "#1a1a1c" : "#000000";
    ctx.fillRect(0, y, px, 2);
  }
  ctx.restore();

  const falloff = ctx.createRadialGradient(px * 0.5, px * 0.48, px * 0.2, px * 0.5, px * 0.5, px * 0.78);
  falloff.addColorStop(0, "rgba(255,255,255,0.03)");
  falloff.addColorStop(0.55, "rgba(0,0,0,0)");
  falloff.addColorStop(1, "rgba(0,0,0,0.35)");
  ctx.fillStyle = falloff;
  ctx.fillRect(0, 0, px, px);
}

/** Transparent embossed type — same chrome deck treatment as the front. */
export function paintBackChrome(canvas: HTMLCanvasElement, opts: BackPaintOpts) {
  const px = canvas.width;
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, px, px);
  drawEmbossedBackType(ctx, opts, prepareBackCtx(ctx, px, opts));
}

/** Full back: matte black plate + embossed type (flat / compat). */
export function paintBack(canvas: HTMLCanvasElement, opts: BackPaintOpts) {
  paintBackPlate(canvas);
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return;
  drawEmbossedBackType(ctx, opts, prepareBackCtx(ctx, canvas.width, opts));
}
