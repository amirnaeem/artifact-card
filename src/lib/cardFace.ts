/**
 * Rasterize a card-face SVG to a square canvas. The files ship with a small CSS
 * size; we strip that and draw at `px` so the 3D card stays sharp.
 */
export async function rasterSvg(url: string, px: number): Promise<HTMLCanvasElement | null> {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    let svg = await r.text();
    if (!/<svg/i.test(svg)) return null;
    svg = svg.replace(/<svg\b([^>]*)>/i, (_, attrs: string) =>
      `<svg${attrs.replace(/\s(width|height|style)="[^"]*"/gi, "")} width="${px}" height="${px}">`);
    const img = new Image();
    const blob = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    img.src = blob;
    await img.decode();
    URL.revokeObjectURL(blob);
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = px;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, px, px);
    return canvas;
  } catch {
    return null;
  }
}
