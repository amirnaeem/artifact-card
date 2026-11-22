import type { Ref, MutableRefObject } from "react";

/** Device-pixel buffer size for crisp flat canvases. */
export function bufferPx(size: number): number {
  const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;
  return Math.max(1, Math.round(size * dpr));
}

/** Assign a callback or object ref. */
export function assignRef<T>(ref: Ref<T> | undefined, node: T | null) {
  if (typeof ref === "function") ref(node);
  else if (ref) (ref as MutableRefObject<T | null>).current = node;
}
