/**
 * Self-check: size / theme.grid caps reject hostile unbounded input.
 * Run: npx tsx checks/security.check.ts
 */
import assert from "node:assert/strict";
import { bufferPx, clampCardSize, MAX_CARD_SIZE_PX } from "../src/lib/canvas";
import { defaultTheme, mergeTheme, sanitizeGrid } from "../src/theme";

assert.equal(clampCardSize(1e9), MAX_CARD_SIZE_PX);
assert.equal(clampCardSize(NaN, 320), 320);
assert.ok(bufferPx(1e9) <= MAX_CARD_SIZE_PX * 2);

const polluted = JSON.parse(
  '{"__proto__":{"polluted":true},"grid":{"cols":1000000,"rows":1000000,"voidCells":[]}}',
) as Partial<typeof defaultTheme>;
const hostile = mergeTheme(defaultTheme, {
  ...polluted,
  grid: {
    ...defaultTheme.grid,
    cols: 1e6,
    rows: 1e6,
    voidCells: Array.from({ length: 50_000 }, () => [0, 0] as [number, number]),
  },
});

assert.ok(hostile.grid.cols <= 64);
assert.ok(hostile.grid.rows <= 64);
assert.ok(hostile.grid.voidCells.length <= 4096);
assert.equal(
  Object.prototype.hasOwnProperty.call(Object.prototype, "polluted"),
  false,
);

const g = sanitizeGrid({
  ...defaultTheme.grid,
  cols: -3,
  rows: 999,
  cell: Number.POSITIVE_INFINITY,
});
assert.equal(g.cols, 1);
assert.equal(g.rows, 64);
assert.ok(Number.isFinite(g.cell));

console.log("security.check ok", {
  maxSize: MAX_CARD_SIZE_PX,
  cols: hostile.grid.cols,
  voids: hostile.grid.voidCells.length,
});
