import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@rahulreddy05/spendly-shared';
import { useApi } from '../services/app-services';

export function useMfaStatus() {
  const api = useApi();
  return useQuery({ queryKey: QUERY_KEYS.mfaStatus, queryFn: api.security.mfaStatus });
}

export function useSessions() {
  const api = useApi();
  return useQuery({ queryKey: QUERY_KEYS.sessions, queryFn: api.security.sessions });
}

export function useSecurityEvents() {
  const api = useApi();
  return useQuery({ queryKey: QUERY_KEYS.securityEvents, queryFn: api.security.events });
}

/** After any security change the status, devices and activity may all differ. */
export function useInvalidateSecurity() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.securityRoot });
}

export function useRevokeSession() {
  const api = useApi();
  const invalidate = useInvalidateSecurity();
  return useMutation({
    mutationFn: (id: string) => api.security.revokeSession(id),
    onSuccess: invalidate,
  });
}

export function useRevokeOtherSessions() {
  const api = useApi();
  const invalidate = useInvalidateSecurity();
  return useMutation({
    mutationFn: () => api.security.revokeOtherSessions(),
    onSuccess: invalidate,
  });
}
