import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@rahulreddy05/spendly-shared';
import { useApi } from '../services/app-services';

export function useAccounts() {
  const api = useApi();
  return useQuery({ queryKey: QUERY_KEYS.accounts, queryFn: api.accounts.list });
}
