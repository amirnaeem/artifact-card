import { BACK_CX, buildFaceModel, gltfFaceGrid } from "../src/paint";
import { resolveCard } from "../src/resolve";

const resolved = resolveCard({ level: "Learner", fullName: "Test", memberSince: "2026" });
if (resolved.brand !== "") throw new Error(`default brand should be empty, got ${JSON.stringify(resolved.brand)}`);
if (resolved.showMark !== true) throw new Error("showMark should default true");

const grid = gltfFaceGrid(resolved.theme.grid);
if (grid.cols !== 14 || (grid.padCols ?? 0) !== 0) throw new Error("gltf grid must be 14 cols, no pads");
const right = grid.originX + grid.cols * grid.cell + (grid.cols - 1) * grid.gap;
if (right > 1600) throw new Error(`right edge too far: ${right}`);
const model = buildFaceModel(resolved.theme, resolved.title, resolved.caption, "Learner");
if (model.cells.length < 50) throw new Error(`cells ${model.cells.length}`);

if (BACK_CX !== 834) throw new Error(`BACK_CX drift: ${BACK_CX}`);

const branded = resolveCard({ level: "Sage", brand: "ARTIFACT", showMark: false });
if (branded.brand !== "ARTIFACT" || branded.showMark !== false) {
  throw new Error("brand/showMark overrides failed");
}

console.log("paint.check ok", { cols: grid.cols, right, cells: model.cells.length, BACK_CX });
