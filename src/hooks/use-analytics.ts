import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS, TOP_MERCHANTS_LIMIT, type Direction } from '@rahulreddy05/spendly-shared';
import { useApi } from '../services/app-services';

export function useYearSummary(year: number) {
  const api = useApi();
  return useQuery({
    queryKey: QUERY_KEYS.summary(year),
    queryFn: () => api.analytics.summary(year),
  });
}

export function useTopMerchants(year: number, direction: Direction) {
  const api = useApi();
  return useQuery({
    queryKey: QUERY_KEYS.merchants(year, direction),
    queryFn: () => api.analytics.merchants(year, direction, TOP_MERCHANTS_LIMIT),
  });
}
