# Virelle Studios Mobile Parity Checkpoint — 2026-07-11

Branch: `fix/mobile-parity-audit-2026-07-11`

## Current architecture

The iOS/Android app uses two parity layers:

1. Native React Native screens for frequently used tools.
2. An authenticated WebView fallback for website tools without native screens.

The `All Tools` screen reads `/api/mobile/features` and uses a bundled offline registry when the network is unavailable. This is the correct low-cost architecture for broad website parity, provided the registry contract and routing maps remain synchronized.

## Completed in this pass

- Added `scripts/check-mobile-parity.mjs`.
- Added `pnpm check:parity`.
- Added a combined `pnpm verify` command that runs parity, TypeScript, lint, and tests.
- The parity gate checks:
  - every bundled feature marked `hasNative: true` has a native route/component;
  - every native tool route is represented in the bundled registry or explicitly exempted as an account/system screen;
  - every native tool has an explicit tier requirement;
  - the authenticated WebView fallback remains wired;
  - primary tabs remain registered;
  - the live feature endpoint and offline fallback remain present.

## Confirmed parity risks

### 1. Native and offline registries can drift

`funding-directory` exists in the native `TOOL_MAP`, but it is not present in the bundled fallback registry. The new parity check should fail until that mismatch is resolved rather than allowing the app to silently hide the tool offline.

### 2. App-variant detection is inconsistent

Different files use different checks:

- `extra.isSwappys`
- Expo slug equal to `swappys`
- `extra.appVariant === "swappys"`

These must be consolidated into one shared helper before producing Virelle and Swappys store builds. Otherwise a Virelle build can show Swappys-only branding or a Swappys build can expose Virelle tabs.

### 3. Home branding is not fully variant-gated

The home screen currently renders the Swappys identity banner in the shared mobile application flow. It must render only for the Swappys variant.

### 4. Live registry response must be contract-tested

The mobile hook assumes `/api/mobile/features` returns a `FeatureRegistry` object with `features`. Other Swappys integration checks refer to `flags` or `features` capability objects. The server should return a stable documented envelope, and the mobile client should normalize and validate it before caching.

### 5. WebView parity is functional parity, not native parity

Website-only tools can be available through the authenticated WebView, but device testing is still required for:

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
3. Add a shared app-variant utility and replace all direct variant checks.
4. Gate Swappys-only home content.
5. Confirm `/api/mobile/features` schema from the deployed Virelle backend.
6. Test every live registry entry:
   - native entry opens its component;
   - web entry opens the correct authenticated website route;
   - tier gating matches the website;
   - project placeholders resolve correctly.
7. Build with EAS for both iOS and Android.
8. Test on a physical iPhone and Android device.

## Release truth

The mobile application has a credible broad-parity architecture because non-native website tools can open through the WebView registry. It should not yet be described as verified full parity until the automated gate passes and physical-device testing is completed.
