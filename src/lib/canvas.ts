import type { Ref, MutableRefObject } from "react";

/** Hard ceiling for flat/mini CSS + buffer size (DoS guard). */
export const MAX_CARD_SIZE_PX = 1024;

/** Clamp a caller-provided card size into a safe paint range. */
export function clampCardSize(size: number, fallback = 320): number {
  if (!Number.isFinite(size) || size <= 0) return fallback;
  return Math.min(MAX_CARD_SIZE_PX, Math.max(1, Math.round(size)));
}

/** Device-pixel buffer size for crisp flat canvases. */
export function bufferPx(size: number): number {
  const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;
  return Math.max(1, Math.round(clampCardSize(size) * dpr));
}

/** Assign a callback or object ref. */
export function assignRef<T>(ref: Ref<T> | undefined, node: T | null) {
  if (typeof ref === "function") ref(node);
  else if (ref) (ref as MutableRefObject<T | null>).current = node;
}
