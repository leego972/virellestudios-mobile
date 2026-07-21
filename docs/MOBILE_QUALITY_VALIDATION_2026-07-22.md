# Full Mobile Quality Validation — 22 July 2026

This branch changes only this validation note. Pull-request CI tests the current `main` tree, including:

- frozen pnpm installation
- TypeScript
- Expo lint and Doctor
- tests and server build
- unsuppressed dependency audit
- canonical Virelle web fallback and authenticated session handoff
- removal of the duplicate Swappys release variant
