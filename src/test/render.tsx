import type { ReactElement } from 'react';
import { render } from '@testing-library/react-native';
import { QueryClient } from '@tanstack/react-query';
import { HttpClient, memoryRefreshTokenStore, type SpendlyApi } from '@rahulreddy05/spendly-shared';
import { AppProviders } from '../providers';
import type { AppServices } from '../services/app-services';
import { session, summary } from './fixtures';

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

/** A fake API where every call resolves to a sensible default unless overridden. */
export function fakeApi(overrides: DeepPartial<SpendlyApi> = {}): SpendlyApi {
  const base: SpendlyApi = {
    meta: { clientConfig: jest.fn().mockResolvedValue({ minAppVersion: { ios: '1.0.0', android: '1.0.0' }, providers: [] }) },
    auth: {
      register: jest.fn().mockResolvedValue(session),
      login: jest.fn().mockResolvedValue(session),
      logout: jest.fn().mockResolvedValue(undefined),
      restoreSession: jest.fn().mockResolvedValue(session),
      me: jest.fn().mockResolvedValue(session.user),
      deleteAccount: jest.fn().mockResolvedValue(undefined),
    },
    accounts: { list: jest.fn().mockResolvedValue([]), create: jest.fn(), update: jest.fn(), remove: jest.fn() },
    transactions: {
      list: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    },
    analytics: { summary: jest.fn().mockResolvedValue(summary), merchants: jest.fn().mockResolvedValue([]) },
    connections: { providers: jest.fn().mockResolvedValue([]), startLink: jest.fn(), completeLink: jest.fn(), refreshAccount: jest.fn() },
  };
  for (const [group, fns] of Object.entries(overrides)) Object.assign(base[group as keyof SpendlyApi], fns);
  return base;
}

/**
 * Services for tests. `signedIn` seeds a stored refresh token so the app
 * restores a session on launch, as it would for a returning user.
 */
export function fakeServices({ api = fakeApi(), signedIn = true }: { api?: SpendlyApi; signedIn?: boolean } = {}): AppServices {
  const http = new HttpClient({
    baseUrl: '/api/v1',
    fetch: jest.fn(),
    refreshTokenStore: memoryRefreshTokenStore(signedIn ? 'stored-refresh' : null),
  });
  return { http, api };
}

export function renderWithProviders(ui: ReactElement, services: AppServices = fakeServices()) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } },
  });
  return { ...render(<AppProviders services={services} queryClient={queryClient}>{ui}</AppProviders>), services };
}
