import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import {
  currentMonth,
  formatMoney,
  formatPercent,
  monthElapsed,
} from '@rahulreddy05/spendly-shared';
import { useBudgets } from '../../hooks/use-budgets';
import { Screen } from '../../components/Screen';
import { MonthStepper } from '../../components/MonthStepper';
import { AddBudgetCard } from '../../components/AddBudgetCard';
import { BudgetCard } from '../../components/BudgetCard';
import { AppText, ErrorBanner, LoadingView, Notice } from '../../components/ui';

const MONTH = /^\d{4}-\d{2}$/;

export default function BudgetsScreen() {
  const thisMonth = currentMonth();
  // An alert can open this screen on its own month.
  const params = useLocalSearchParams<{ month?: string }>();
  const fromLink =
    params.month && MONTH.test(params.month) && params.month <= thisMonth ? params.month : null;
  const [chosen, setChosen] = useState<string | null>(null);
  const month = chosen ?? fromLink ?? thisMonth;
  const budgets = useBudgets(month);
  const isCurrent = month === thisMonth;
  const elapsed = monthElapsed(month);
  const data = budgets.data;

  return (
    <Screen refreshing={budgets.isRefetching} onRefresh={() => void budgets.refetch()}>
      <MonthStepper value={month} max={thisMonth} onChange={setChosen} />
      {isCurrent && <AddBudgetCard taken={data?.budgets.map((b) => b.category) ?? []} />}
      {budgets.isLoading && <LoadingView label="Loading budgets" />}
      {budgets.isError && <ErrorBanner error={budgets.error} />}
      {data &&
        (data.budgets.length === 0 ? (
          <Notice>
            {isCurrent
              ? 'No budgets yet. Pick a category above to start.'
              : 'No budgets for this month.'}
          </Notice>
        ) : (
          <>
            <AppText accessibilityRole="text">
              You&apos;ve spent {formatMoney(data.totalSpentCents)} of{' '}
              {formatMoney(data.totalLimitCents)} across your budgets
              {isCurrent ? `, with ${formatPercent(elapsed)} of the month gone.` : '.'}
            </AppText>
            {data.budgets.map((b) => (
              <BudgetCard
                key={b.id}
                budget={b}
                elapsed={isCurrent ? elapsed : 1}
                editable={isCurrent}
              />
            ))}
          </>
        ))}
    </Screen>
  );
}
