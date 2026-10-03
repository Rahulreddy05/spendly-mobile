import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import { HttpClient, createSpendlyApi, type ClientPlatform } from '@rahulreddy05/spendly-shared';
import { apiBaseUrl } from '../config/env';
import { FALLBACK_APP_VERSION } from '../constants/app.constants';
import { secureRefreshTokenStore } from './secure-refresh-token-store';
import { expoBiometricAuth } from './biometrics';
import { securePreferences } from './preferences';
import type { AppServices } from './app-services';

/** Composition root: the only place real implementations are constructed. */
export function createAppServices(): AppServices {
  const http = new HttpClient({
    baseUrl: apiBaseUrl(Platform.OS),
    refreshTokenStore: secureRefreshTokenStore(SecureStore),
    client: {
      // Lets the API refuse app versions too old for its current contract (426).
      platform: Platform.OS as ClientPlatform,
      version: Application.nativeApplicationVersion ?? FALLBACK_APP_VERSION,
      // Shown in "Signed-in devices". The model ("iPhone 18 Pro") rather than
      // the personal device name, which iOS also hides without an entitlement.
      ...(Device.modelName ? { deviceName: Device.modelName } : {}),
    },
    // The refresh token travels in the request body; no cookies needed.
    credentials: 'omit',
  });
  return {
    http,
    api: createSpendlyApi(http),
    biometrics: expoBiometricAuth(Platform.OS),
    preferences: securePreferences(SecureStore),
  };
}
