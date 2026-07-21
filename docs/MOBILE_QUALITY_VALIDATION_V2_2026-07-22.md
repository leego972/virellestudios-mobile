# Full Mobile Quality Validation V2 — 22 July 2026

This branch was created from the current `main` after the previous validation branch became stale. It changes only this note and runs:

- frozen pnpm installation
- artifact-captured TypeScript diagnostics
- Expo lint and Doctor
- tests and server build
- unsuppressed dependency audit
- canonical Virelle authenticated web fallback
- full iOS/Android packaging workflows where credentials are available
