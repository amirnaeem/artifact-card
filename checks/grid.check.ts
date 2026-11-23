/** Runnable self-check for grid + ninja voids + resolve. */
import {
  buildCells,
  contentPad,
  gridMetrics,
  scatterFillsInContent,
} from "../src/grid";
import {
  BEGINNER_COLOR_FILLS,
  CARD_CATEGORIES,
  categoryForLevel,
  defineCategory,
  definePresets,
  getCategory,
  getPreset,
  listCategories,
  LEVEL_CARD_ORDER,
  LEVEL_CARD_PRESETS,
  NINJA_CARD_ORDER,
  undefineCategory,
  undefinePresets,
} from "../src/presets";
import {
  NINJA_VOID_SEED,
  NINJA_VOIDS,
  ninjaRevealOrder,
  ninjaRevealedCount,
  ninjaVoidsForRank,
  ninjaVoidsForRevealed,
} from "../src/ninja-voids";
import { NINJA_ART_URL } from "../src/assets";
import { resolveCard } from "../src/resolve";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
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

{
  const voidSet = new Set(savant.theme.grid.voidCells.map(([c, r]) => `${c},${r}`));
  let seq = 0;
  const rngA = () => {
    seq += 0.17;
    return seq % 1;
  };
  seq = 0.3;
  const rngB = () => {
    seq += 0.41;
    return seq % 1;
  };
  const fills = SAVANT_ACCENTS.map((a) => a.fill);
  const a = scatterFillsInContent(fills, savant.theme.grid.voidCells, contentCols, 15, rngA);
  const b = scatterFillsInContent(fills, savant.theme.grid.voidCells, contentCols, 15, rngB);
  assert(a.length === fills.length, "scatter keeps accent count");
  assert(
    a.every((cell) => !voidSet.has(`${cell.c},${cell.r}`)),
    "scatter accents never land on voids",
  );
  assert(
    a.some((cell, i) => cell.c !== b[i]?.c || cell.r !== b[i]?.r || cell.fill !== b[i]?.fill),
    "two scatters can differ",
  );
}

for (const name of LEVEL_CARD_ORDER) {
  assert(LEVEL_CARD_PRESETS[name], `missing preset ${name}`);
  const r = resolveCard({ level: name });
  assert(r.theme.grid.cols === 18, `${name} padded cols`);
}

assert(CARD_CATEGORIES.reading.order === LEVEL_CARD_ORDER, "reading category order");
assert(CARD_CATEGORIES.ninja.order === NINJA_CARD_ORDER, "ninja category order");

for (const name of NINJA_CARD_ORDER) {
  assert(LEVEL_CARD_PRESETS[name], `missing ninja preset ${name}`);
  const r = resolveCard({ level: name });
  assert(r.theme.grid.cols === 18, `${name} padded cols`);
}

{
  assert(NINJA_VOIDS["AI Sensei"].length === 0, "Sensei has no voids");
  assert(
    ninjaVoidsForRevealed(ninjaRevealedCount(0)).length === NINJA_VOIDS["AI Curious"].length,
    "revealed-count voids match Curious",
  );
  const a = ninjaVoidsForRank(0, NINJA_VOID_SEED);
  const b = ninjaVoidsForRank(0, NINJA_VOID_SEED);
  assert(
    a.length === b.length && a.every((cell, i) => cell[0] === b[i]![0] && cell[1] === b[i]![1]),
    "same seed → same Curious voids",
  );
  const order = ninjaRevealOrder(NINJA_VOID_SEED);
  let prevRevealed = 0;
  for (let i = 0; i < NINJA_CARD_ORDER.length; i++) {
    const voids = NINJA_VOIDS[NINJA_CARD_ORDER[i]!];
    const revealed = order.length - voids.length;
    assert(revealed >= prevRevealed, `${NINJA_CARD_ORDER[i]} must reveal ≥ previous`);
    prevRevealed = revealed;
    const voidSet = new Set(voids.map(([c, r]) => `${c},${r}`));
    for (let j = 0; j < revealed; j++) {
      const [c, r] = order[j]!;
      assert(!voidSet.has(`${c},${r}`), `revealed cell ${c},${r} must not be void at rank ${i}`);
    }
  }

  assert(existsSync(resolve("src/assets/ninja/ninja.png")), "ninja.png missing");
  assert(existsSync(resolve("src/assets/card/card.gltf")), "card.gltf missing");
  assert(existsSync(resolve("src/assets/card/buffer-1.bin")), "card buffer missing");
}

{
  assert(CARD_CATEGORIES.reading && CARD_CATEGORIES.ninja, "categories reading+ninja");
  assert(listCategories().length >= 2, "listCategories");
  assert(getCategory("ninja")?.artFace === true, "ninja artFace default");
  assert(getCategory("ninja")?.defaultArtSrc === NINJA_ART_URL, "ninja defaultArtSrc");
  assert(categoryForLevel("Learner")?.id === "reading", "Learner → reading");
  assert(categoryForLevel("AI Sensei")?.id === "ninja", "Sensei → ninja");
  for (const cat of listCategories()) {
    for (const name of cat.order) {
      assert(LEVEL_CARD_PRESETS[name], `preset missing for ${name}`);
      const r = resolveCard({ level: name, category: cat.id });
      assert(r.categoryId === cat.id, `${name} categoryId`);
      if (cat.artFace) assert(r.artFace === true, `${name} inherits artFace`);
    }
  }
  for (const name of NINJA_CARD_ORDER) {
    assert(LEVEL_CARD_PRESETS[name]?.artFace === true, `${name} artFace`);
    assert(LEVEL_CARD_PRESETS[name]?.revealLadder === "ninja", `${name} revealLadder`);
  }
  for (const name of LEVEL_CARD_ORDER) {
    assert(!LEVEL_CARD_PRESETS[name]?.artFace, `${name} is color mosaic`);
  }
  assert(typeof NINJA_ART_URL === "string" && NINJA_ART_URL.length > 0, "NINJA_ART_URL export");
}

{
  // Ephemeral host category + presets (hermetic cleanup).
  defineCategory({
    id: "__test_guild__",
    label: "Test Guild",
    order: ["Test Novice", "Test Elder"],
    presets: {
      "Test Novice": {
        name: "Test Novice",
        caption: "Start",
        theme: { primary: "#111111", accents: ["#222222"] },
      },
      "Test Elder": {
        name: "Test Elder",
        caption: "Top",
        theme: { primary: "#333333", accents: ["#444444"] },
      },
    },
  });
  assert(getCategory("__test_guild__")?.label === "Test Guild", "defineCategory registers");
  assert(getPreset("Test Novice")?.caption === "Start", "defineCategory presets");
  const scoped = resolveCard({
    level: "Test Novice",
    category: "__test_guild__",
    presets: {
      "Test Novice": {
        name: "Test Novice",
        caption: "Scoped",
        theme: { primary: "#abcdef", accents: ["#000000"] },
      },
    },
  });
  assert(scoped.caption === "Scoped" && scoped.theme.primary === "#abcdef", "scoped presets win");
  assert(getPreset("Test Novice")?.caption === "Start", "scoped does not mutate global");

  let threw = false;
  try {
    defineCategory({
      id: "__collide__",
      label: "Collide",
      order: ["Learner"],
    });
  } catch {
    threw = true;
  }
  assert(threw, "defineCategory rejects cross-category level collision");
  assert(getPreset("Learner")?.caption === "First Read", "collision must not mutate Learner");

  // Art-face category without defaultArtSrc / artSrc → color mosaic (no empty panel).
  defineCategory({
    id: "__art_no_src__",
    label: "Art No Src",
    order: ["Art Ghost"],
    artFace: true,
    presets: {
      "Art Ghost": {
        name: "Art Ghost",
        caption: "No art",
        theme: { primary: "#010101", accents: ["#020202"] },
        artFace: true,
      },
    },
  });
  const ghost = resolveCard({ level: "Art Ghost", category: "__art_no_src__" });
  assert(ghost.artFace === false && ghost.artSrc === undefined, "no-art artFace → mosaic");

  // Reading levels must not leak ninja default art.
  const reading = resolveCard({ level: "Learner" });
  assert(reading.artSrc === undefined && reading.artFace === false, "no default art leak");

  // Title fallback is "Award", not "Learner".
  const bare = resolveCard({});
  assert(bare.title === "Award", `bare title should be Award, got ${bare.title}`);

  undefineCategory("__test_guild__");
  undefineCategory("__art_no_src__");
  assert(!getCategory("__test_guild__"), "undefineCategory removes category");
  assert(!getPreset("Test Novice"), "undefineCategory removes presets");
  assert(!getCategory("__art_no_src__"), "art-no-src cleaned");

  // Missing preset in order should reject.
  threw = false;
  try {
    defineCategory({
      id: "__missing_preset__",
      label: "Missing",
      order: ["No Such Level"],
    });
  } catch {
    threw = true;
  }
  assert(threw, "defineCategory rejects missing presets");
  assert(!getCategory("__missing_preset__"), "failed define leaves no category");

  definePresets({
    "Temp Only": { name: "Temp Only", caption: "t", theme: { primary: "#999" } },
  });
  assert(getPreset("Temp Only"), "definePresets");
  undefinePresets("Temp Only");
  assert(!getPreset("Temp Only"), "undefinePresets");
  undefineCategory("__noop__"); // no-op
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
