import { BACK_CX, buildFaceModel, gltfFaceGrid } from "../src/paint";
import { resolveCard } from "../src/resolve";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const resolved = resolveCard({ level: "Learner", fullName: "Test", memberSince: "2026" });
const grid = gltfFaceGrid(resolved.theme.grid);
if (grid.cols !== 14 || (grid.padCols ?? 0) !== 0) throw new Error("gltf grid must be 14 cols, no pads");
const right = grid.originX + grid.cols * grid.cell + (grid.cols - 1) * grid.gap;
if (right > 1600) throw new Error(`right edge too far: ${right}`);
const model = buildFaceModel(resolved.theme, resolved.title, resolved.caption, "Learner");
if (model.cells.length < 50) throw new Error(`cells ${model.cells.length}`);

const backSvg = readFileSync(resolve("src/assets/badges/image-back.svg"), "utf8");
const xs = [...backSvg.matchAll(/d="([^"]+)"[^>]*fill="#(?!000000)([0-9A-Fa-f]{6})"/gi)]
  .flatMap(([, d]) => [...d.matchAll(/(-?\d+\.?\d*)/g)].map((m) => +m[1]).filter((_, i) => i % 2 === 0));
const artCx = (Math.min(...xs) + Math.max(...xs)) / 2;
if (Math.abs(artCx - BACK_CX) > 2) throw new Error(`BACK_CX ${BACK_CX} != art ${artCx}`);

console.log("paint.check ok", { cols: grid.cols, right, cells: model.cells.length, BACK_CX, artCx });
