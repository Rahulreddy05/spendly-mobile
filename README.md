# spendly-mobile

**Pennypath** for iPhone and Android — see where your money comes from and where it goes.

Expo (React Native) · Expo Router · TanStack Query · TypeScript

## Setup

You need Node 22, the GitHub CLI logged in, and for simulators **Xcode** (iOS)
and **Android Studio** (Android).

```bash
export NODE_AUTH_TOKEN=$(gh auth token)   # installs @rahulreddy05/spendly-shared
npm ci
```

Start the API (`../spendly-api`, `npm run dev`), then:

```bash
npm run ios        # builds and opens the iOS simulator
npm run android    # builds and opens the Android emulator
```

Sign in with the demo account from the API seed (`npm run seed` there).

## Commands

| Command | What it does |
| --- | --- |
| `npm start` | Metro dev server |
| `npm run ios` / `android` | Development build on a simulator |
| `npm test` / `test:coverage` | Unit, screen and navigation tests |
| `npm run lint` / `typecheck` / `doctor` | ESLint / TypeScript / Expo dependency checks |

## Security

- Refresh token in the iOS Keychain / Android Keystore (`expo-secure-store`); access token in memory only.
- Sends its version on every request; the API can require an update (HTTP 426).
- In-app account deletion (Settings), as the App Store requires.

See [CLAUDE.md](CLAUDE.md) and [ENGINEERING_STANDARDS.md](ENGINEERING_STANDARDS.md).
