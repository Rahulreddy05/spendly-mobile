import { DEV_API_URL } from '../constants/app.constants';

type NativePlatform = keyof typeof DEV_API_URL;

/**
 * API base URL. EXPO_PUBLIC_API_URL is inlined at build time; release builds
 * must set it (e.g. https://spendly.example.com/api/v1).
 */
export function apiBaseUrl(platform: string, configured = process.env.EXPO_PUBLIC_API_URL): string {
  if (configured) return configured.replace(/\/+$/, '');
  return DEV_API_URL[(platform in DEV_API_URL ? platform : 'ios') as NativePlatform];
}
