import type { RefreshTokenStore } from '@rahulreddy05/spendly-shared';
import { SECURE_STORE_KEYS } from '../constants/app.constants';

/** The subset of expo-secure-store we use, injectable for tests. */
export interface SecureStorage {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
}

/**
 * Keeps the refresh token in the iOS Keychain / Android Keystore — encrypted,
 * per-app, and never in plain AsyncStorage.
 */
export function secureRefreshTokenStore(storage: SecureStorage): RefreshTokenStore {
  return {
    get: () => storage.getItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN),
    set: (token) =>
      token === null
        ? storage.deleteItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN)
        : storage.setItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN, token),
  };
}
