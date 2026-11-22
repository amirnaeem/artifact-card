/** Packaged card + badge URLs (files live in dist/assets via static-copy). */

function asset(rel: string): string {
  // @vite-ignore — resolve against shipped dist/assets, do not inline.
  return new URL(/* @vite-ignore */ rel, import.meta.url).href;
}

export const CARD_GLTF_URL = asset("./assets/card/card.gltf");

const FRONT: Record<string, string> = {
  Beginner: asset("./assets/badges/image-front-Beginner.svg"),
  Learner: asset("./assets/badges/image-front-Learner.svg"),
  Seeker: asset("./assets/badges/image-front-Seeker.svg"),
  Explorer: asset("./assets/badges/image-front-Explorer.svg"),
  Scholar: asset("./assets/badges/image-front-Scholar.svg"),
  Savant: asset("./assets/badges/image-front-Savant.svg"),
  Sage: asset("./assets/badges/image-front-Sage.svg"),
  Oracle: asset("./assets/badges/image-front-Oracle.svg"),
};

export function badgeFrontUrl(level: string): string | undefined {
  return FRONT[level];
}

export const BADGE_BACK_URL = asset("./assets/badges/image-back.svg");
