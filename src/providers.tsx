import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppServicesContext, type AppServices } from './services/app-services';
import { AuthProvider } from './auth/AuthProvider';
import { QUERY_STALE_TIME_MS } from './constants/app.constants';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: QUERY_STALE_TIME_MS,
        retry: 1,
        // Tests: no cache-GC timers left running after a test ends.
        ...(process.env.NODE_ENV === 'test' ? { gcTime: Infinity } : {}),
      },
    },
  });
}

/** Services, server-state cache and auth around the whole app. */
export function AppProviders({
  services,
  queryClient,
  children,
}: {
  services: AppServices;
  queryClient: QueryClient;
  children: ReactNode;
}) {
  return (
    <AppServicesContext.Provider value={services}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    </AppServicesContext.Provider>
  );
}
