import { SECURE_STORE_KEYS } from '../constants/app.constants';
import type { SecureStorage } from './secure-refresh-token-store';

/** Small on-device settings, kept in the Keychain/Keystore alongside the session. */
export interface Preferences {
  biometricLock(): Promise<boolean>;
  setBiometricLock(enabled: boolean): Promise<void>;
}

export function securePreferences(storage: SecureStorage): Preferences {
  return {
    biometricLock: async () =>
      (await storage.getItemAsync(SECURE_STORE_KEYS.BIOMETRIC_LOCK)) === 'true',
    setBiometricLock: (enabled) =>
      enabled
        ? storage.setItemAsync(SECURE_STORE_KEYS.BIOMETRIC_LOCK, 'true')
        : storage.deleteItemAsync(SECURE_STORE_KEYS.BIOMETRIC_LOCK),
  };
}
