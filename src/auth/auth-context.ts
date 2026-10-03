import { createContext, useContext } from 'react';
import type { SecondFactor, User } from '@rahulreddy05/spendly-shared';

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

/** Signing in either finishes, or stops for a 2FA code. */
export type LoginOutcome = { status: 'signed-in' } | { status: 'mfa-required'; mfaToken: string };

export interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  login: (email: string, password: string) => Promise<LoginOutcome>;
  completeMfa: (mfaToken: string, factor: SecondFactor) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Re-reads the profile, e.g. after verifying the email or turning on 2FA. */
  refreshUser: () => Promise<void>;
  deleteAccount: (password: string, factor?: SecondFactor) => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>.');
  return ctx;
}
