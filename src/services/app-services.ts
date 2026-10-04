import { createContext, useContext } from 'react';
import type { HttpClient, SpendlyApi } from '@rahulreddy05/spendly-shared';
import type { BiometricAuth } from './biometrics';
import type { Preferences } from './preferences';
import type { BankLinker } from './bank-linker';

/**
 * Dependency-injection container for the app. The root layout provides the
 * real implementations (create-services.ts); tests provide fakes.
 */
export interface AppServices {
  http: HttpClient;
  api: SpendlyApi;
  biometrics: BiometricAuth;
  preferences: Preferences;
  /** Null where the native Plaid module is unavailable (e.g. Expo Go). */
  linker: BankLinker | null;
}

export const AppServicesContext = createContext<AppServices | null>(null);

export function useAppServices(): AppServices {
  const services = useContext(AppServicesContext);
  if (!services) throw new Error('useAppServices must be used inside <AppProviders>.');
  return services;
}

export const useApi = (): SpendlyApi => useAppServices().api;
