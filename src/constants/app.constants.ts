/**
 * Mobile-only constants. Shared ones (categories, API paths, query keys,
 * limits, formatting) come from @rahulreddy05/spendly-shared.
 */

/** Keys in expo-secure-store (Keychain / Keystore). Alphanumerics, '.', '-', '_' only. */
export const SECURE_STORE_KEYS = {
  REFRESH_TOKEN: 'spendly.refreshToken',
} as const;

/**
 * Where a development build finds the local API when EXPO_PUBLIC_API_URL is
 * unset. The Android emulator reaches the host Mac at 10.0.2.2, not localhost.
 */
export const DEV_API_URL = {
  ios: 'http://localhost:4000/api/v1',
  android: 'http://10.0.2.2:4000/api/v1',
} as const;

/** Data stays fresh for a minute; pull-to-refresh always refetches. */
export const QUERY_STALE_TIME_MS = 60_000;

/** Fallback app version if the native one is unavailable (e.g. in tests). */
export const FALLBACK_APP_VERSION = '1.0.0';
