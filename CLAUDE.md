# Spendly Mobile

@ENGINEERING_STANDARDS.md
@AGENTS.md

iPhone + Android app for Spendly: where your money comes from and where it goes.
Expo SDK 57 (React Native 0.86), Expo Router, TanStack Query, expo-secure-store.

## Shared code

Types, constants, the HTTP client/API contract and formatting come from
**`@rahulreddy05/spendly-shared`** (repo `../spendly-shared`). Never copy them
here. Installing needs `export NODE_AUTH_TOKEN=$(gh auth token)`.

## Commands

```bash
npm start                  # Metro dev server (press i / a for simulators)
npm run ios / android      # build and run a development build (needs Xcode / Android Studio)
npm test                   # or test:coverage (thresholds enforced)
npm run lint && npm run typecheck && npm run doctor
npx expo export --platform ios|android   # bundle check without a simulator
```

## Architecture

```
src/
  app/              Expo Router routes only (every file is a screen)
    _layout.tsx     providers, splash, Stack.Protected auth guard, upgrade gate
    login, register
    (tabs)/         index (Dashboard), accounts, transactions, settings
  services/         create-services.ts (composition root), app-services (DI context),
                    secure-refresh-token-store (Keychain/Keystore)
  auth/             AuthProvider + useAuth
  hooks/            TanStack Query hooks, useTheme
  components/       ui primitives (AppText, Button, TextField, Card…) and feature components
  constants/        mobile-only constants: theme tokens, secure-store keys, dev API URLs, tabs
  lib/              pure helpers (describeYear)
  test/             fake API/services, fixtures, render helper
```

## Local API

Unset `EXPO_PUBLIC_API_URL` → iOS simulator uses `http://localhost:4000/api/v1`,
Android emulator `http://10.0.2.2:4000/api/v1`. A physical phone needs your
Mac's LAN IP. See `.env.example`.

## Gotchas (SDK 57)

- `@testing-library/react-native` is pinned to 13.3 and `react-test-renderer`
  to the SDK's React version: `expo-router/testing-library` renders
  synchronously and breaks on RNTL 14.
- Jest `transformIgnorePatterns` must include `standard-navigation` (new Expo
  Router dependency shipped as ESM).
- `expo-router/testing-library` matchers have no bundled types — see
  `src/test/expo-router-matchers.d.ts`.
- **iOS 27 SDK requires the UIScene life cycle** or the app exits at launch.
  Expo 57's prebuild template does not adopt it yet, so the local config plugin
  `plugins/with-ios-scene-lifecycle.js` registers Expo's `ExpoAppSceneDelegate`
  and adapts `AppDelegate`. It throws if the template changes shape — when a
  future Expo template adopts scenes itself, delete the plugin.
- `react-test-renderer` must be pinned **exactly** to the React version (a `^`
  range resolves to a newer React peer on fresh installs and breaks `npm ci`).
- If `expo-modules-core` ends up only under `node_modules/expo/node_modules`,
  Jest cannot find it; regenerate the lockfile rather than installing it directly
  (expo-doctor forbids that).

## Status

Phase 2 done: auth, tabs, dashboard, read-only accounts and transactions,
settings with sign-out and account deletion. Phase 3: Stripe bank linking
(`@stripe/stripe-react-native`), manual accounts and transactions, re-categorise.
Phase 4: E2E (Maestro), EAS builds, TestFlight / Play internal testing.
