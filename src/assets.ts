/** Packaged GLTF URL (files live in dist/assets via static-copy). */

function asset(rel: string): string {
  // @vite-ignore — resolve against shipped dist/assets, do not inline.
  return new URL(/* @vite-ignore */ rel, import.meta.url).href;
}

export const CARD_GLTF_URL = asset("./assets/card/card.gltf");
