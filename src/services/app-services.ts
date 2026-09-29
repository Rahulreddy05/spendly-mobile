import { createContext, useContext } from 'react';
import type { HttpClient, SpendlyApi } from '@rahulreddy05/spendly-shared';

/**
 * Dependency-injection container for the app. The root layout provides the
 * real implementations (create-services.ts); tests provide fakes.
 */
export interface AppServices {
  http: HttpClient;
  api: SpendlyApi;
}

export const AppServicesContext = createContext<AppServices | null>(null);

export function useAppServices(): AppServices {
  const services = useContext(AppServicesContext);
  if (!services) throw new Error('useAppServices must be used inside <AppProviders>.');
  return services;
}

export const useApi = (): SpendlyApi => useAppServices().api;
