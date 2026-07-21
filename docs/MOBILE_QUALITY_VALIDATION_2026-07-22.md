# Full Mobile Quality Validation — 22 July 2026

This validation run tests the exact current `main` tree, including:

- frozen pnpm installation
- artifact-captured TypeScript diagnostics
- Expo lint and Doctor
- tests and server build
- unsuppressed dependency audit
- canonical Virelle web fallback and authenticated session handoff
- removal of the duplicate Swappys release variant

The TypeScript log is uploaded even on failure so every compiler defect can be fixed directly.
