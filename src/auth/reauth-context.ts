import { createContext, useContext } from 'react';
import type { RequestReauth } from '@rahulreddy05/spendly-shared';

/** Opens the "confirm it's you" sheet; resolves true once confirmed. */
export const ReauthContext = createContext<RequestReauth | null>(null);

export function useRequestReauth(): RequestReauth {
  const ctx = useContext(ReauthContext);
  if (!ctx) throw new Error('useRequestReauth must be used inside <ReauthProvider>.');
  return ctx;
}
