import { useInfiniteQuery } from '@tanstack/react-query';
import { QUERY_KEYS, TRANSACTIONS_PAGE_SIZE, type TransactionFilters } from '@rahulreddy05/spendly-shared';
import { useApi } from '../services/app-services';

export function useTransactions(filters: TransactionFilters) {
  const api = useApi();
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.transactions(filters),
    queryFn: ({ pageParam }) =>
      api.transactions.list({ ...filters, limit: TRANSACTIONS_PAGE_SIZE, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
}
