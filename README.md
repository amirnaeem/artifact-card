# @amirnaeem/artifact-card

Themeable reading-level **award card** for React.

Pick a level, show a name on the back, flip to explore. Accent tiles can optionally flicker. Flat and mini variants use the same art.

Inspired by [Artifact](https://artifact.news/).

[![version](https://img.shields.io/badge/version-0.1.0-blue.svg)](./package.json)
[![license](https://img.shields.io/github/license/amirnaeem/artifact-card.svg)](./LICENSE)
[![node](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](./package.json)
[![demo](https://img.shields.io/badge/demo-GitHub%20Pages-black.svg)](https://amirnaeem.github.io/artifact-card/)

**Demo:** [amirnaeem.github.io/artifact-card](https://amirnaeem.github.io/artifact-card/)

---

## Install

```bash
npm install @amirnaeem/artifact-card three
```

| Peer | Range |
| --- | --- |
| `react` / `react-dom` | ^18 or ^19 |
| `three` | ^0.160 |

`react` and `react-dom` are assumed already in your app. Install `three` alongside this package.

---

## Use in your project

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

1. Import the component.
2. Import `styles.css` once (app root or layout).
3. Pass a `level` preset and optional identity props.

Tap or click the card to flip. For controlled flip: `flipped` + `onFlip`.

Accent flicker is off by default:

```tsx
<LevelCard level="Savant" flicker fullName="Ada Lovelace" memberSince="2023" />
```

### Vite

Works out of the box with the install above.

### Next.js (App Router)

```tsx
"use client";

import { LevelCard } from "@amirnaeem/artifact-card";
import "@amirnaeem/artifact-card/styles.css";

export function ProfileCard() {
  return <LevelCard level="Scholar" fullName="Ada Lovelace" memberSince="2023" />;
}
```

- Mark the consumer as a **Client Component** (`"use client"`).
- If the bundler fails to resolve the package, add it to `transpilePackages` in `next.config`:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@amirnaeem/artifact-card"],
};

export default nextConfig;
```

Assets resolve from the package via `import.meta.url` — you do **not** copy files into `public/`.

---

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `level` | `string` | — | Award preset (`Learner`, `Scholar`, …) |
| `theme` | `Partial<LevelCardTheme>` | — | Deep-merged over the level preset |
| `title` | `string` | preset name | Front title |
| `caption` | `string` | preset caption | Front caption |
| `fullName` | `string` | — | Back identity (skipped when empty) |
| `memberSince` | `string` | — | Back meta (skipped when empty) |
| `brand` | `string` | `""` | Optional back brand line |
| `showMark` | `boolean` | `true` | Back asterisk |
| `side` | `"front" \| "back"` | — | Flat single face |
| `mini` | `boolean` | `false` | Mosaic-only thumb |
| `flicker` | `boolean` | `false` | Animate accent tiles (Beginner→Savant; respects `prefers-reduced-motion`) |
| `flipped` | `boolean` | — | Controlled flip |
| `defaultFlipped` | `boolean` | `false` | Uncontrolled initial flip |
| `onFlip` | `(flipped: boolean) => void` | — | Flip callback |
| `onNotify` | `(message: string) => void` | — | Tilt permission / errors |
| `className` | `string` | — | Wrapper class |
| `size` | `number` | `320` / `56` mini | Flat / mini CSS size (px) |

### Flat & mini

```tsx
<LevelCard level="Explorer" side="front" size={240} />
<LevelCard level="Explorer" side="back" fullName="Ada" memberSince="2023" />
<LevelCard level="Sage" mini size={56} />
```

---

## Award levels

| Level | Caption |
| --- | --- |
| `Beginner` | Just Joined |
| `Learner` | First Read |
| `Seeker` | 10+ reads |
| `Explorer` | 25+ reads |
| `Scholar` | 50+ reads |
| `Savant` | 100+ reads |
| `Sage` | 250+ reads |
| `Oracle` | 350+ reads |

---

## Theming

```tsx
<LevelCard
  level="Scholar"
  theme={{ primary: "#ff6600" }}
  fullName="Ada Lovelace"
  memberSince="2023"
  brand="ARTIFACT"
/>
```

Merge order: `defaultTheme` ← level preset ← `theme` prop.  
Arrays (`accents`, `voidCells`, …) replace wholesale.

### Fonts

| Variable | Role |
| --- | --- |
| `--font-head` | Front title |
| `--font-display` | Back name |
| `--font-sans` | Back brand |
| `--font-mono` | Caption / meta |

Set them on `:root` (or a host wrapper) to match your product fonts.

---

## Exports

| Export | Purpose |
| --- | --- |
| `LevelCard` | Main component |
| `LevelCardFace` / `LevelCardBack` | Standalone faces |
| `resolveCard` / `mergeTheme` / `defaultTheme` | Theme resolution |
| `LEVEL_CARD_PRESETS` / `LEVEL_CARD_ORDER` / `getPreset` | Presets |
| `paintFace` / `paintFaceMosaic` / `paintFaceChrome` / `paintBack` / `buildFaceModel` / `compositeFace` | Advanced paint |
| `CARD_GLTF_URL` | Packaged shell URL |
| Types | `LevelCardProps`, `LevelCardTheme`, `LevelCardName`, … |

---

## Develop this repo

```bash
git clone https://github.com/amirnaeem/artifact-card.git
cd artifact-card
npm install
```

| Command | Description |
| --- | --- |
| `npm run dev` | Demo at [http://localhost:5173](http://localhost:5173) |
| `npm run check` | Typecheck + paint/grid self-checks |
| `npm run typecheck` | Typecheck only |
| `npm run build` | Emit library `dist/` |
| `npm run build:demo` | Build demo for GitHub Pages |

`prepublishOnly` runs `check` then `build` before publish.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for PR workflow. Report vulnerabilities via [SECURITY.md](./SECURITY.md).

---

## License

[MIT](./LICENSE) © Amir Naeem
