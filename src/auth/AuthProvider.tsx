import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { isMfaChallenge, type AuthResponse, type User } from '@rahulreddy05/spendly-shared';
import { useAppServices } from '../services/app-services';
import { AuthContext, type AuthContextValue, type AuthStatus } from './auth-context';

/**
 * Tracks who is signed in. Tokens themselves are handled by the shared
 * HttpClient: access token in memory, refresh token in the Keychain/Keystore.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const { api, http } = useAppServices();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<User | null>(null);

  const acceptSession = useCallback((session: AuthResponse) => {
    setUser(session.user);
    setStatus('authenticated');
  }, []);

  const endSession = useCallback(() => {
    setUser(null);
    setStatus('anonymous');
    queryClient.clear();
  }, [queryClient]);

  // On launch, a stored refresh token (if any) restores the session.
  useEffect(() => {
    let active = true;
    http.onSessionExpired(() => active && endSession());
    http
      .storedRefreshToken()
      .then((token) => (token ? api.auth.restoreSession() : null))
      .then((session) => {
        if (!active) return;
        if (session) acceptSession(session);
        else setStatus('anonymous');
      })
      .catch(() => active && setStatus('anonymous'));
    return () => {
      active = false;
      http.onSessionExpired(null);
    };
  }, [api, http, acceptSession, endSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      login: async (email, password) => {
        const result = await api.auth.login({ email, password });
        if (isMfaChallenge(result)) return { status: 'mfa-required', mfaToken: result.mfaToken };
        acceptSession(result);
        return { status: 'signed-in' };
      },
      completeMfa: async (mfaToken, factor) =>
        acceptSession(await api.auth.verifyMfa(mfaToken, factor)),
      register: async (email, password, displayName) =>
        acceptSession(
          await api.auth.register({ email, password, ...(displayName ? { displayName } : {}) }),
        ),
      logout: async () => {
        try {
          await api.auth.logout();
        } finally {
          endSession();
        }
      },
      refreshUser: async () => {
        const me = await api.auth.me();
        setUser({
          id: me.id,
          email: me.email,
          displayName: me.displayName,
          emailVerified: me.emailVerified,
          mfaEnabled: me.mfaEnabled,
        });
      },
      deleteAccount: async (password, factor) => {
        await api.auth.deleteAccount(password, factor);
        endSession();
      },
    }),
    [status, user, api, acceptSession, endSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
