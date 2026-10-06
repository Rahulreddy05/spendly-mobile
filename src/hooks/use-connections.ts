import { Platform } from 'react-native';
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import {
  MONEY_DATA_QUERY_ROOTS,
  PROVIDER,
  QUERY_KEYS,
  waitForInitialSync,
  type BankConnection,
  type LinkPlatform,
  type SpendlyApi,
} from '@rahulreddy05/spendly-shared';
import { useApi, useAppServices } from '../services/app-services';
import type { BankLinker } from '../services/bank-linker';

export type LinkResult = { status: 'linked'; connection: BankConnection } | { status: 'cancelled' };

const platform = (): LinkPlatform => (Platform.OS === 'android' ? 'android' : 'ios');

/** Linking changes accounts, connections, transactions and every total. */
function invalidateMoneyData(queryClient: QueryClient) {
  return Promise.all(
    MONEY_DATA_QUERY_ROOTS.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
  );
}

export function useConnections() {
  const api = useApi();
  return useQuery({ queryKey: QUERY_KEYS.connections, queryFn: api.connections.list });
}

export function useLinkProviders() {
  const api = useApi();
  return useQuery({ queryKey: QUERY_KEYS.providers, queryFn: api.connections.providers });
}

function requireLinker(linker: BankLinker | null): BankLinker {
  if (!linker)
    throw new Error('Bank linking needs the full Pennypath app (not available in Expo Go).');
  return linker;
}

/** After a link, history can take a few seconds to be ready at the bank; keep pulling in the background. */
function useAfterLinked(api: SpendlyApi) {
  const queryClient = useQueryClient();
  return async (result: LinkResult) => {
    await invalidateMoneyData(queryClient);
    if (result.status !== 'linked') return;
    void waitForInitialSync(api, result.connection.id)
      .then(() => invalidateMoneyData(queryClient))
      .catch(() => undefined); // the connection card shows its status and "Sync now"
  };
}

export function useLinkBank() {
  const { api, linker } = useAppServices();
  const afterLinked = useAfterLinked(api);
  return useMutation({
    mutationFn: async (): Promise<LinkResult> => {
      const plaid = requireLinker(linker);
      const { linkToken } = await api.connections.createLinkToken(PROVIDER.PLAID, platform());
      const outcome = await plaid.link(linkToken);
      if (outcome.status === 'cancelled') return outcome;
      return {
        status: 'linked',
        connection: await api.connections.exchange(PROVIDER.PLAID, outcome.publicToken),
      };
    },
    onSuccess: afterLinked,
  });
}

/** "Fix connection": Plaid update mode, then mark it reconnected. */
export function useFixConnection() {
  const { api, linker } = useAppServices();
  const afterLinked = useAfterLinked(api);
  return useMutation({
    mutationFn: async (connection: BankConnection): Promise<LinkResult> => {
      const plaid = requireLinker(linker);
      const { linkToken } = await api.connections.createUpdateLinkToken(connection.id, platform());
      const outcome = await plaid.link(linkToken);
      if (outcome.status === 'cancelled') return outcome;
      return { status: 'linked', connection: await api.connections.markReconnected(connection.id) };
    },
    onSuccess: afterLinked,
  });
}

export function useSyncConnection() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.connections.sync(id),
    // A failed sync can change the status (e.g. to "Needs attention").
    onSettled: () => invalidateMoneyData(queryClient),
  });
}

export function useRemoveConnection() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.connections.remove(id),
    onSuccess: () => invalidateMoneyData(queryClient),
  });
}
