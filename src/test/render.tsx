import type { ReactElement } from 'react';
import { render } from '@testing-library/react-native';
import { QueryClient } from '@tanstack/react-query';
import { HttpClient, memoryRefreshTokenStore, type SpendlyApi } from '@rahulreddy05/spendly-shared';
import { AppProviders } from '../providers';
import { ReauthProvider } from '../auth/ReauthProvider';
import type { AppServices } from '../services/app-services';
import type { BiometricAuth } from '../services/biometrics';
import type { Preferences } from '../services/preferences';
import type { BankLinker } from '../services/bank-linker';
import { session, summary } from './fixtures';

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

/** A fake API where every call resolves to a sensible default unless overridden. */
export function fakeApi(overrides: DeepPartial<SpendlyApi> = {}): SpendlyApi {
  const base: SpendlyApi = {
    meta: {
      clientConfig: jest
        .fn()
        .mockResolvedValue({ minAppVersion: { ios: '1.0.0', android: '1.0.0' }, providers: [] }),
    },
    auth: {
      register: jest.fn().mockResolvedValue(session),
      login: jest.fn().mockResolvedValue(session),
      logout: jest.fn().mockResolvedValue(undefined),
      restoreSession: jest.fn().mockResolvedValue(session),
      me: jest.fn().mockResolvedValue(session.user),
      deleteAccount: jest.fn().mockResolvedValue(undefined),
      verifyMfa: jest.fn().mockResolvedValue(session),
      verifyEmail: jest.fn().mockResolvedValue(undefined),
      resendVerification: jest.fn().mockResolvedValue({ sent: true }),
      forgotPassword: jest.fn().mockResolvedValue({ sent: true }),
      resetPassword: jest.fn().mockResolvedValue(undefined),
      changePassword: jest.fn().mockResolvedValue(undefined),
      reauthenticate: jest.fn().mockResolvedValue(undefined),
    },
    security: {
      mfaStatus: jest.fn().mockResolvedValue({ enabled: false, recoveryCodesRemaining: 0 }),
      setupTotp: jest.fn().mockResolvedValue({
        secret: 'JBSWY3DPEHPK3PXP',
        otpauthUrl: 'otpauth://totp/Spendly:r?secret=JBSWY3DPEHPK3PXP&issuer=Spendly',
      }),
      confirmTotp: jest.fn().mockResolvedValue(['AAAA-BBBB', 'CCCC-DDDD']),
      disableMfa: jest.fn().mockResolvedValue(undefined),
      regenerateRecoveryCodes: jest.fn().mockResolvedValue(['EEEE-FFFF']),
      sessions: jest.fn().mockResolvedValue([]),
      revokeSession: jest.fn().mockResolvedValue(undefined),
      revokeOtherSessions: jest.fn().mockResolvedValue(undefined),
      events: jest.fn().mockResolvedValue([]),
    },
    accounts: {
      list: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    },
    transactions: {
      list: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    },
    analytics: {
      summary: jest.fn().mockResolvedValue(summary),
      merchants: jest.fn().mockResolvedValue([]),
    },
    connections: {
      providers: jest.fn().mockResolvedValue([]),
      list: jest.fn().mockResolvedValue([]),
      createLinkToken: jest
        .fn()
        .mockResolvedValue({ linkToken: 'link-sandbox-1', expiration: '2026-10-03T12:00:00Z' }),
      exchange: jest.fn(),
      sync: jest.fn().mockResolvedValue({ upserted: 0, removed: 0 }),
      createUpdateLinkToken: jest
        .fn()
        .mockResolvedValue({ linkToken: 'link-update-1', expiration: '2026-10-03T12:00:00Z' }),
      markReconnected: jest.fn(),
      remove: jest.fn().mockResolvedValue(undefined),
    },
  };
  for (const [group, fns] of Object.entries(overrides))
    Object.assign(base[group as keyof SpendlyApi], fns);
  return base;
}

/**
 * Services for tests. `signedIn` seeds a stored refresh token so the app
 * restores a session on launch, as it would for a returning user.
 */
/** A biometric scanner the test controls. */
export function fakeBiometrics(
  overrides: Partial<{ available: boolean; label: string; succeed: boolean }> = {},
) {
  const config = { available: true, label: 'Face ID', succeed: true, ...overrides };
  return {
    config,
    support: jest.fn(async () => ({ available: config.available, label: config.label })),
    authenticate: jest.fn(async () => config.succeed),
  } satisfies BiometricAuth & { config: typeof config };
}

export function fakePreferences(biometricLock = false): Preferences & { biometricLock: jest.Mock } {
  let lock = biometricLock;
  return {
    biometricLock: jest.fn(async () => lock),
    setBiometricLock: jest.fn(async (v: boolean) => {
      lock = v;
    }),
  };
}

export function fakeServices({
  api = fakeApi(),
  signedIn = true,
  biometrics = fakeBiometrics(),
  preferences = fakePreferences(),
  linker = null,
}: {
  api?: SpendlyApi;
  signedIn?: boolean;
  biometrics?: BiometricAuth;
  preferences?: Preferences;
  linker?: BankLinker | null;
} = {}): AppServices {
  const http = new HttpClient({
    baseUrl: '/api/v1',
    fetch: jest.fn(),
    refreshTokenStore: memoryRefreshTokenStore(signedIn ? 'stored-refresh' : null),
  });
  return { http, api, biometrics, preferences, linker };
}

export function renderWithProviders(ui: ReactElement, services: AppServices = fakeServices()) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } },
  });
  return {
    ...render(
      <AppProviders services={services} queryClient={queryClient}>
        <ReauthProvider>{ui}</ReauthProvider>
      </AppProviders>,
    ),
    services,
  };
}
