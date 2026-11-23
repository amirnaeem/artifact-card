import {
  BACK_CX,
  buildFaceModel,
  faceLayout,
  gltfFaceGrid,
} from "../src/paint";
import { resolveCard } from "../src/resolve";
import { defaultTheme } from "../src/theme";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

const resolved = resolveCard({ level: "Learner", fullName: "Test", memberSince: "2026" });
assert(resolved.brand === "", `default brand should be empty, got ${JSON.stringify(resolved.brand)}`);
assert(resolved.showMark === true, "showMark should default true");

const grid = gltfFaceGrid(resolved.theme.grid);
assert(grid.cols === 14 && (grid.padCols ?? 0) === 0, "gltf grid must be 14 cols, no pads");
const right = grid.originX + grid.cols * grid.cell + (grid.cols - 1) * grid.gap;
assert(right <= 1600, `right edge too far: ${right}`);
const model = buildFaceModel(resolved.theme, resolved.title, resolved.caption, "Learner");
assert(model.cells.length >= 50, `cells ${model.cells.length}`);

assert(BACK_CX === 834, `BACK_CX drift: ${BACK_CX}`);

const branded = resolveCard({ level: "Sage", brand: "ARTIFACT", showMark: false });
assert(branded.brand === "ARTIFACT" && branded.showMark === false, "brand/showMark overrides failed");

{
  const plain = resolveCard({ level: "Learner" });
  assert(plain.artFace === false, "reading is not art face");
  assert(plain.artSrc === undefined && plain.markSrc === undefined, "artSrc/markSrc default undefined");
  assert(plain.revealLadder === undefined && plain.revealRank === -1, "no reveal ladder");

  const ninja = resolveCard({ level: "AI Ninja" });
  assert(ninja.artFace === true, "ninja preset is art face");
  assert(typeof ninja.artSrc === "string" && ninja.artSrc.length > 0, "ninja default artSrc");
  assert(ninja.revealLadder === "ninja" && ninja.revealRank >= 0, "ninja reveal ladder");

  const custom = resolveCard({
    level: "AI Ninja",
    artSrc: "/hero.png",
    markSrc: "/mark.svg",
    showMark: false,
  });
  assert(custom.artSrc === "/hero.png", "artSrc override");
  assert(custom.markSrc === "/mark.svg", "markSrc pass-through");
  assert(custom.showMark === false, "showMark false with markSrc");

  // Unknown level + artSrc → art face without ladder (generic host levels).
  const host = resolveCard({
    level: "Custom Tier",
    title: "Custom Tier",
    caption: "Host-defined",
    artSrc: "/custom.png",
    theme: { primary: "#112233" },
  });
  assert(host.artFace === true, "artSrc alone enables art face");
  assert(host.artSrc === "/custom.png", "host artSrc");
  assert(host.revealLadder === undefined, "unknown level has no ladder");
  assert(host.title === "Custom Tier" && host.theme.primary === "#112233", "unknown level theme/title");

  // Reading + artSrc → art face (opt-in), still no ninja ladder.
  const readingArt = resolveCard({ level: "Learner", artSrc: "/overlay.png" });
  assert(readingArt.artFace === true && readingArt.revealLadder === undefined, "reading+artSrc");
}

assert(defaultTheme.type.brandSize >= 72, "back brand size bumped");
assert(defaultTheme.type.nameSize >= 104, "back name size bumped");
assert(defaultTheme.type.metaSize >= 42, "back meta size bumped");

// Mosaic/type layers must share layout even when chrome text is empty.
{
  const px = 256;
  const layoutA = faceLayout(model, px);
  const emptyChrome = buildFaceModel(resolved.theme, "  ", "", "Learner");
  const layoutB = faceLayout(emptyChrome, px);
  assert(layoutA.scale === layoutB.scale, "layout scale stable without title");
  assert(layoutA.ox === layoutB.ox && layoutA.oy === layoutB.oy, "layout origin stable");

  const fitA = faceLayout(model, px, { fit: true });
  const fitB = faceLayout(emptyChrome, px, { fit: true });
  assert(fitA.scale === fitB.scale && fitA.inset === fitB.inset, "fit layout stable");

  const emptyCells = { ...model, cells: [] };
  const emptyLayout = faceLayout(emptyCells, px);
  assert(Number.isFinite(emptyLayout.scale) && emptyLayout.scale > 0, "empty mosaic layout stays finite");
}

console.log("paint.check ok", { cols: grid.cols, right, cells: model.cells.length, BACK_CX });
