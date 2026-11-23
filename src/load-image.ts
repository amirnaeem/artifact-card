/** URL-keyed image cache with a public-package URL safety gate. */

type Entry = {
  image: HTMLImageElement | null;
  promise: Promise<HTMLImageElement> | null;
  listeners: Set<() => void>;
};

const cache = new Map<string, Entry>();

function entry(url: string): Entry {
  let e = cache.get(url);
  if (!e) {
    e = { image: null, promise: null, listeners: new Set() };
    cache.set(url, e);
  }
  return e;
}

/**
 * Allow relative paths and http(s) / blob / data:image URLs.
 * Reject empty strings and dangerous schemes (javascript:, vbscript:, file:, …).
 */
export function isSafeAssetUrl(url: string): boolean {
  if (typeof url !== "string") return false;
  const s = url.trim();
  if (!s) return false;
  const lower = s.toLowerCase();
  if (lower.startsWith("data:image/")) return true;
  if (lower.startsWith("blob:")) return true;
  if (lower.startsWith("https://") || lower.startsWith("http://")) return true;
  // Relative / root-relative / protocol-relative blocked (//evil) — require path form.
  if (lower.startsWith("//")) return false;
  if (/^[a-z][a-z0-9+.-]*:/i.test(s)) return false;
  return true;
}

export function getImage(url: string): HTMLImageElement | null {
  if (!isSafeAssetUrl(url)) return null;
  const img = entry(url).image;
  return img?.complete && img.naturalWidth > 0 ? img : null;
}

export function onImageLoad(url: string, cb: () => void): () => void {
  if (!isSafeAssetUrl(url)) return () => {};
  const e = entry(url);
  e.listeners.add(cb);
  return () => {
    e.listeners.delete(cb);
  };
}

function notify(e: Entry) {
  for (const cb of e.listeners) cb();
}

export function loadImage(url: string): Promise<HTMLImageElement> {
  if (!isSafeAssetUrl(url)) {
    return Promise.reject(new Error("Unsafe asset URL"));
  }
  const ready = getImage(url);
  if (ready) return Promise.resolve(ready);
  const e = entry(url);
  if (e.promise) return e.promise;

  e.promise = new Promise((resolve, reject) => {
    if (typeof Image === "undefined") {
      e.promise = null;
      reject(new Error("Image unavailable"));
      return;
    }
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      e.image = img;
      notify(e);
      resolve(img);
    };
    img.onerror = () => {
      e.promise = null;
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
  return e.promise;
}

/** Subscribe + kick a load; calls `cb` when the image is ready (or already cached). */
export function watchImage(url: string | undefined, cb: () => void): () => void {
  if (!url || !isSafeAssetUrl(url)) return () => {};
  const unsub = onImageLoad(url, cb);
  void loadImage(url)
    .then(cb)
    .catch(() => {});
  return unsub;
}
