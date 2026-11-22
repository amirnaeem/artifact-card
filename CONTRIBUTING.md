# Contributing

Thanks for taking an interest in `@amirnaeem/artifact-card`.

## Workflow

1. Open an issue first for larger changes (API, visual design, deps).
2. Fork and branch from `main` (`feat/…`, `fix/…`).
3. Keep PRs small and focused.
4. Open a pull request against `main` — direct pushes to `main` are blocked.

## Local checks

```bash
npm install
npm run check
npm run build
npm run dev   # demo at http://localhost:5173
```

CI runs `check` + `build` on every PR. Please keep those green.

## Scope

Prefer the smallest change that solves the problem. Match existing patterns in `src/` — no new dependencies unless discussed.
