import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS, type CreateBudgetInput } from '@rahulreddy05/spendly-shared';
import { useApi } from '../services/app-services';

export function useBudgets(month: string) {
  const api = useApi();
  return useQuery({
    queryKey: QUERY_KEYS.budgets(month),
    queryFn: () => api.budgets.list(month),
    placeholderData: keepPreviousData,
  });
}

/** A budget change can create an alert, so refresh the bell too. */
function useInvalidateBudgets() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.budgetsRoot }),
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications }),
    ]);
}

export function useCreateBudget() {
  const api = useApi();
  const invalidate = useInvalidateBudgets();
  return useMutation({
    mutationFn: (input: CreateBudgetInput) => api.budgets.create(input),
    onSuccess: invalidate,
  });
}

export function useUpdateBudget() {
  const api = useApi();
  const invalidate = useInvalidateBudgets();
  return useMutation({
    mutationFn: ({ id, limitCents }: { id: string; limitCents: number }) =>
      api.budgets.update(id, limitCents),
    onSuccess: invalidate,
  });
}

export function useDeleteBudget() {
  const api = useApi();
  const invalidate = useInvalidateBudgets();
  return useMutation({ mutationFn: (id: string) => api.budgets.remove(id), onSuccess: invalidate });
}
