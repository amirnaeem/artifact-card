/**
 * Runnable self-check for grid + resolve. Run:
 *   npx tsx src/components/level-card/grid.check.ts
 * from the web/ package.
 */
import { buildCells, contentPad, gridMetrics, scatterFillsInContent } from "../src/grid";
import { BEGINNER_COLOR_FILLS, LEVEL_CARD_ORDER, LEVEL_CARD_PRESETS } from "../src/presets";
import { resolveCard } from "../src/resolve";
import {
  EXPLORER_ACCENTS,
  LEARNER_ACCENTS,
  ORACLE_BODY,
  SAGE_BODY,
  SAVANT_ACCENTS,
} from "../src/svg-fills";
import { defaultTheme, mergeTheme } from "../src/theme";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

const learner = resolveCard({ level: "Learner" });
assert(learner.theme.grid.cols === 18, "18 cols with side pads");
assert((learner.theme.grid.padCols ?? 0) === 2, "2 pad cols each side");
assert(learner.theme.grid.voidCells.length === 26, "Learner puzzle voids");
assert(learner.theme.grid.accentCells.length === LEARNER_ACCENTS.length, "Learner accent count");
assert(LEARNER_ACCENTS.length === 10, "Learner has 10 color boxes");

{
  const g = learner.theme.grid;
  const { cellW, cellH, stepX, stepY } = gridMetrics(g);
  const right = 2048 - (g.originX + (g.cols - 1) * stepX + cellW);
  const bottom = g.originY + (g.rows - 1) * stepY + cellH;
  assert(cellW === cellH, `tiles must be square, got ${cellW}x${cellH}`);
  assert(Math.abs(g.originX - right) < 2, `L/R match, L=${g.originX} R=${right}`);
  assert(g.originX < 120, `side inset should be near top (~118), got ${g.originX}`);
  assert(bottom < 1750, `grid clears label band, bottom=${bottom}`);
}

const carved = buildCells(learner.theme.grid, learner.theme.primary, learner.theme.accents, {
  includeCarve: true,
});
assert(carved.length === 18 * 15, "full padded grid including carve tiles");
assert(carved.filter((c) => c.carve).length === 26, "26 carve holes");
assert(carved.filter((c) => !c.carve).length === 18 * 15 - 26, "permanent tiles");
assert(
  carved.filter((c) => (c.col < 2 || c.col > 15) && c.carve).length === 0,
  "pad columns should not carve",
);

// Pad colors extend the content edge (not a flat primary strip) for body-mapped levels
const oracle = resolveCard({ level: "Oracle" });
const oracleCells = buildCells(oracle.theme.grid, oracle.theme.primary, oracle.theme.accents);
// pad col 0 mirrors content col 1 → grid col 3
const oPad = oracleCells.find((c) => c.col === 0 && c.row === 2);
const oMirror = oracleCells.find((c) => c.col === 3 && c.row === 2);
assert(oPad && oMirror, "oracle pad/mirror cells exist");
assert(oPad!.fill === oMirror!.fill, `oracle pad should mirror SVG color ${oMirror!.fill}, got ${oPad!.fill}`);
assert(oPad!.fill.toUpperCase() !== "#000000", "oracle pad should be mosaic colored");

const explorer = resolveCard({ level: "Explorer" });
assert(explorer.theme.grid.accentCells.length === EXPLORER_ACCENTS.length, "Explorer accents");

const savant = resolveCard({ level: "Savant" });
assert(savant.theme.grid.accentCells.length === SAVANT_ACCENTS.length, "Savant accents");

const sage = resolveCard({ level: "Sage" });
assert((sage.theme.grid.bodyCells?.length ?? 0) === SAGE_BODY.length, "Sage shade map");

assert((oracle.theme.grid.bodyCells?.length ?? 0) === ORACLE_BODY.length, "Oracle color map");

const { contentCols } = contentPad(learner.theme.grid);
assert(BEGINNER_COLOR_FILLS.length === 10, "Beginner has 10 chroma fills");
const scattered = scatterFillsInContent(
  BEGINNER_COLOR_FILLS,
  learner.theme.grid.voidCells,
  contentCols,
  15,
  () => 0.5,
);
assert(scattered.length === 10, "Beginner scatter places 10");

assert(learner.theme.animation.accentPulse === false, "no accent blink by default");

for (const name of LEVEL_CARD_ORDER) {
  assert(LEVEL_CARD_PRESETS[name], `missing preset ${name}`);
  const r = resolveCard({ level: name });
  assert(r.theme.grid.cols === 18, `${name} padded cols`);
}

const overridden = resolveCard({ level: "Learner", theme: { primary: "#abcdef" } });
assert(overridden.theme.primary === "#abcdef", "theme override must win");

const merged = mergeTheme(defaultTheme, {
  fonts: {
    title: "Comic Sans",
    caption: defaultTheme.fonts.caption,
    brand: defaultTheme.fonts.brand,
    name: defaultTheme.fonts.name,
    meta: defaultTheme.fonts.meta,
  },
});
assert(merged.fonts.title === "Comic Sans", "fonts merge");

console.log("level-card grid.check: ok");
