import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as Application from 'expo-application';
import { HttpClient, createSpendlyApi, type ClientPlatform } from '@rahulreddy05/spendly-shared';
import { apiBaseUrl } from '../config/env';
import { FALLBACK_APP_VERSION } from '../constants/app.constants';
import { secureRefreshTokenStore } from './secure-refresh-token-store';
import type { AppServices } from './app-services';

/** Composition root: the only place real implementations are constructed. */
export function createAppServices(): AppServices {
  const http = new HttpClient({
    baseUrl: apiBaseUrl(Platform.OS),
    refreshTokenStore: secureRefreshTokenStore(SecureStore),
    // Lets the API refuse app versions too old for its current contract (426).
    client: {
      platform: Platform.OS as ClientPlatform,
      version: Application.nativeApplicationVersion ?? FALLBACK_APP_VERSION,
    },
    // The refresh token travels in the request body; no cookies needed.
    credentials: 'omit',
  });
  return { http, api: createSpendlyApi(http) };
}
