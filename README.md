# @amirnaeem/artifact-card

Themeable reading-level profile card for React.

Default render is a **GLTF glass shell** (Three.js). Front and back art are painted on canvas — the same painters power flat lab faces, mini thumbs, and the WebGL fallback.

[![npm version](https://img.shields.io/npm/v/@amirnaeem/artifact-card.svg)](https://www.npmjs.com/package/@amirnaeem/artifact-card)
[![license](https://img.shields.io/npm/l/@amirnaeem/artifact-card.svg)](./LICENSE)
[![node](https://img.shields.io/node/v/@amirnaeem/artifact-card.svg)](./package.json)

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

GLTF and textures resolve from the published package via `import.meta.url` — you do **not** copy files into `public/`.

---

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `level` | `string` | — | Preset name (`Learner`, `Scholar`, …) |
| `theme` | `Partial<LevelCardTheme>` | — | Deep-merged over the level preset |
| `title` | `string` | preset name | Front title |
| `caption` | `string` | preset caption | Front caption |
| `fullName` | `string` | — | Back identity (skipped when empty) |
| `memberSince` | `string` | — | Back meta (skipped when empty) |
| `brand` | `string` | `""` | Optional back brand line |
| `showMark` | `boolean` | `true` | Back asterisk |
| `side` | `"front" \| "back"` | — | Flat single face (no WebGL) |
| `mini` | `boolean` | `false` | Mosaic-only thumb |
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

**Presets:** `Beginner` · `Learner` · `Seeker` · `Explorer` · `Scholar` · `Savant` · `Sage` · `Oracle`

### Fonts

Canvas type uses CSS variables (with package fallbacks):

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
| `LevelCardFace` / `LevelCardBack` | Standalone canvas faces |
| `resolveCard` / `mergeTheme` / `defaultTheme` | Theme resolution |
| `LEVEL_CARD_PRESETS` / `LEVEL_CARD_ORDER` / `getPreset` | Presets |
| `paintFace` / `paintBack` / `buildFaceModel` | Advanced canvas paint |
| `CARD_GLTF_URL` | Packaged shell URL |
| Types | `LevelCardProps`, `LevelCardTheme`, … |

---

## Develop this repo

```bash
git clone https://github.com/amirnaeem/artifact-card.git
cd artifact-card
npm install
```

| Command | Description |
| --- | --- |
| `npm run dev` | Demo app at [http://localhost:5173](http://localhost:5173) |
| `npm run check` | Typecheck + paint/grid self-checks |
| `npm run typecheck` | Typecheck only |
| `npm run build` | Emit `dist/` (ESM, types, CSS, GLTF assets) |

`prepublishOnly` runs `check` then `build` before publish.

---

## License

[MIT](./LICENSE) © Amir Naeem
