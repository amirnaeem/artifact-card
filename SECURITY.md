# Security Policy

## Supported versions

| Version | Supported |
| --- | --- |
| `0.x` on `main` / latest npm | Yes |

## Trust boundaries

Treat these props as **application-controlled data** (or sanitize them server-side before passing them in):

- Text: `title`, `caption`, `fullName`, `memberSince`, `brand`
- Layout: `size`, `theme` (especially `theme.grid`)
- Media URLs: `artSrc`, `markSrc` (host-controlled image URLs loaded into canvas / WebGL textures)

The library clamps `size` and grid dimensions and skips prototype-pollution keys in `mergeTheme`, but it does **not** HTML-sanitize strings (text is drawn with canvas `fillText` / React attributes). Do not feed raw untrusted user HTML into props.

`artSrc` / `markSrc` are gated with `isSafeAssetUrl` (relative paths and `http` / `https` / `blob` / `data:image/…` only). Dangerous schemes such as `javascript:` are rejected. Packaged GLTF shell and default ninja art URLs remain fixed inside the package — callers cannot swap the card model URL.

Peer `three` versions are the consumer’s responsibility; this package is tested against recent `0.18x` releases within the declared peer range.

## Reporting a vulnerability

Please **do not** open a public issue for security reports.

Open a private [GitHub security advisory](https://github.com/amirnaeem/artifact-card/security/advisories/new) with:

- A description of the issue
- Steps to reproduce
- Impact assessment if known

You should hear back within a few days. If the report is confirmed, a fix will be prepared and credited unless you ask otherwise.
