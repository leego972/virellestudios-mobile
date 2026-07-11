# Virelle Studios Mobile Parity Checkpoint — 2026-07-11

Branch: `fix/mobile-parity-audit-2026-07-11`

## Current architecture

The iOS/Android app uses two parity layers:

1. Native React Native screens for frequently used tools.
2. An authenticated WebView fallback for website tools without native screens.

The `All Tools` screen reads `/api/mobile/features` and uses a bundled offline registry when the network is unavailable. This is the correct low-cost architecture for broad website parity, provided the registry contract and routing maps remain synchronized.

## Completed in this branch

- Added `scripts/check-mobile-parity.mjs`.
- Added `pnpm check:parity`.
- Added `pnpm verify` to run parity, TypeScript, lint, and tests.
- Made the parity parser section-aware so `TOOL_MAP`, `TOOL_MIN_TIER`, and `BUNDLED_REGISTRY` cannot be conflated.
- Added a shared `constants/app-variant.ts` helper.
- Updated tab navigation to use the shared Virelle/Swappys variant helper.
- Hardened the authenticated WebView fallback:
  - waits for the secure session token before rendering;
  - injects authentication before page content loads;
  - encodes tokens safely;
  - restricts in-app navigation to the configured Virelle origin;
  - opens external HTTPS links in the system browser;
  - disables third-party cookies;
  - improves HTTP, loading, retry, and progress handling.
- The parity gate checks:
  - every bundled feature marked `hasNative: true` has a native route/component;
  - every native tool route is represented in the bundled registry or explicitly exempted;
  - every native tool has an explicit tier requirement;
  - the authenticated WebView fallback remains wired;
  - primary tabs remain registered;
  - tabs use the shared variant helper;
  - the live feature endpoint and offline fallback remain present;
  - Swappys branding is not left ungated.

## Remaining confirmed risks

### 1. Native and offline registries may still be out of sync

`funding-directory` exists in the native `TOOL_MAP`, but it is not present in the bundled fallback registry. `pnpm check:parity` should fail until this is resolved.

### 2. Home branding still needs explicit Swappys gating

The shared home screen contains the Swappys identity banner. It must render only when `IS_SWAPPYS` is true.

### 3. Live registry response needs execution-time confirmation

The mobile hook expects `/api/mobile/features` to return a `FeatureRegistry` object with `features`. Other Swappys integration checks support capability objects under `flags` or `features`. The deployed server contract must be confirmed before release.

### 4. WebView parity remains functional parity, not native parity

Website-only tools are available through an authenticated WebView, but physical-device testing is still required for:

- login/session propagation;
- file uploads and camera/photo-library selection;
- downloads and share sheets;
- Stripe checkout return links;
- external OAuth callbacks;
- back navigation;
- safe-area and keyboard behavior;
- microphone/camera permissions;
- long-running generation jobs and background/resume behavior.

## Required before claiming full parity

1. Run `pnpm check:parity` and resolve every failure.
2. Run `pnpm verify` successfully.
3. Gate Swappys-only home content with the shared variant helper.
4. Confirm `/api/mobile/features` against the deployed Virelle backend.
5. Test every live registry entry:
   - native entry opens its component;
   - web entry opens the correct authenticated website route;
   - tier gating matches the website;
   - project placeholders resolve correctly.
6. Build with EAS for iOS and Android.
7. Test on a physical iPhone and Android device.

## Release truth

The mobile application has a credible broad-parity architecture and materially improved authenticated WebView handling. It must not be described as verified full parity until the automated commands pass and physical-device testing is completed.
