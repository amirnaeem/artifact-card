# @amirnaeem/artifact-card

Themeable reading-level profile card for React — GLTF glass shell by default, with flat SVG faces for labs, thumbs, and WebGL fallbacks.

[![npm version](https://img.shields.io/npm/v/@amirnaeem/artifact-card.svg)](https://www.npmjs.com/package/@amirnaeem/artifact-card)
[![license](https://img.shields.io/npm/l/@amirnaeem/artifact-card.svg)](./LICENSE)
[![node](https://img.shields.io/node/v/@amirnaeem/artifact-card.svg)](./package.json)

```bash
npm install @amirnaeem/artifact-card react react-dom three
```

`react`, `react-dom`, and `three` are **peer dependencies** — install them alongside the package.

## Quick start

```tsx
import { LevelCard } from "@amirnaeem/artifact-card";
import "@amirnaeem/artifact-card/styles.css";

export function Profile() {
  return (
    <LevelCard
      level="Learner"
      fullName="Ada Lovelace"
      memberSince="2023"
    />
  );
}
```

Tap or click the card to flip. Use `flipped` / `onFlip` for controlled mode.

## Features

- **GLTF glass shell** — Three.js card with tilt, drag, and flip
- **Flat SVG faces** — `side="front" | "back"` for labs and fallbacks
- **Mini thumbs** — mosaic-only tiles via `mini`
- **Level presets** — Beginner → Oracle with deep-merge theming
- **Bundled assets** — badges + GLTF ship in the package (no Next `public/` folder required)

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `level` | `string` | — | Preset name (`Learner`, `Scholar`, …) |
| `theme` | `Partial<LevelCardTheme>` | — | Deep-merged over the level preset |
| `title` | `string` | preset name | Front title override |
| `caption` | `string` | preset caption | Front caption override |
| `fullName` | `string` | — | Identity on the back |
| `memberSince` | `string` | — | Membership label on the back |
| `brand` | `string` | `"ARTIFACT"` | Brand mark on the back |
| `side` | `"front" \| "back"` | — | Render a single flat face |
| `mini` | `boolean` | `false` | Mosaic-only thumb |
| `flipped` | `boolean` | — | Controlled flip state |
| `defaultFlipped` | `boolean` | `false` | Uncontrolled initial flip |
| `onFlip` | `(flipped: boolean) => void` | — | Flip callback |
| `onNotify` | `(message: string) => void` | — | Host toast for tilt permission failures |
| `className` | `string` | — | Wrapper class |
| `size` | `number` | `320` / `56` mini | Flat / mini size in px |

Also exported: `LevelCardFace`, `LevelCardBack`, `Asterisk`, theme helpers (`resolveCard`, `mergeTheme`, `defaultTheme`), presets (`LEVEL_CARD_PRESETS`, `LEVEL_CARD_ORDER`, `getPreset`), paint/grid utilities, and types.

## Theming

```tsx
<LevelCard
  level="Scholar"
  theme={{
    primary: "#ff6600",
    animation: {
      intensity: 2,
      enabled: true,
      staggerMs: 12,
      accentPulse: true,
      markSpin: true,
    },
  }}
  fullName="Ada Lovelace"
  memberSince="October 2023"
/>
```

`theme` deep-merges over the level preset, which merges over `defaultTheme`. Arrays (`accents`, `voidCells`, …) replace wholesale. Animation intensity mainly affects flat SVG tiles.

### Presets

`Beginner` · `Learner` · `Seeker` · `Explorer` · `Scholar` · `Savant` · `Sage` · `Oracle`

## Flat & mini

```tsx
{/* Lab / QA faces */}
<LevelCard level="Explorer" side="front" size={240} />
<LevelCard level="Explorer" side="back" fullName="Ada" memberSince="2023" />

{/* Levels list thumb */}
<LevelCard level="Sage" mini size={56} />
```

## Assets

Badge SVGs and the GLTF shell (+ bins) are published under `dist/assets/`. Runtime URLs resolve via `import.meta.url` — consumers do not need to copy files into their own `public/` folder.

```ts
import { CARD_GLTF_URL, badgeFrontUrl, BADGE_BACK_URL } from "@amirnaeem/artifact-card";
```

## Peer requirements

| Peer | Supported |
| --- | --- |
| `react` / `react-dom` | ^18 or ^19 |
| `three` | ^0.160 (verified with 0.187) |
| Node | >= 18 (for tooling) |

## Local development

```bash
git clone https://github.com/amirnaeem/artifact-card.git
cd artifact-card
npm install
npm run demo    # http://localhost:5173 — GLTF, flat faces, mini, presets
npm run check   # tsc + paint/grid self-checks
npm run build   # dist/ ESM + types + assets + styles.css
```

## Contributing

1. Keep changes focused on the card surface — no app-specific Toast/Icon deps
2. Run `npm run check` and smoke the demo before opening a PR
3. Prefer small diffs; update types and README when the public API changes

## License

[MIT](./LICENSE) © Amir Naeem
