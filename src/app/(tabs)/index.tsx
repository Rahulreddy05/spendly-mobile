import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { DIRECTION, formatMoney, formatPercent } from '@rahulreddy05/spendly-shared';
import { useTopMerchants, useYearSummary } from '../../hooks/use-analytics';
import { describeYear } from '../../lib/describe-year';
import { Screen } from '../../components/Screen';
import { YearStepper } from '../../components/YearStepper';
import { StatTile } from '../../components/StatTile';
import { CategoryBreakdown } from '../../components/CategoryBreakdown';
import { MonthlyBars } from '../../components/MonthlyBars';
import { MerchantList } from '../../components/MerchantList';
import { AppText, ErrorBanner, LoadingView, Notice } from '../../components/ui';
import { SPACING } from '../../constants/theme.constants';

export default function DashboardScreen() {
  const [year, setYear] = useState(() => new Date().getFullYear());
  const summary = useYearSummary(year);
  const spend = useTopMerchants(year, DIRECTION.EXPENSE);
  const income = useTopMerchants(year, DIRECTION.INCOME);

  const refresh = () => {
    void summary.refetch();
    void spend.refetch();
    void income.refetch();
  };
  const data = summary.data;

  return (
    <Screen refreshing={summary.isRefetching} onRefresh={refresh}>
      <YearStepper value={year} onChange={setYear} />

      {summary.isLoading && <LoadingView label="Loading your summary" />}
      {summary.isError && <ErrorBanner error={summary.error} />}

      {data &&
        (data.transactionCount === 0 ? (
          <Notice>
            Nothing recorded for {year} yet. Link a bank or add transactions to see where your money goes.
          </Notice>
        ) : (
          <>
            <View style={styles.headline} accessible accessibilityRole="summary">
              {describeYear(data).map((sentence) => (
                <AppText key={sentence} size="body">
                  {sentence}
                </AppText>
              ))}
            </View>
            <View style={styles.tiles}>
              <StatTile label="Money in" value={formatMoney(data.incomeCents)} tone="income" />
              <StatTile label="Money out" value={formatMoney(data.expenseCents)} tone="expense" />
              <StatTile
                label="Kept"
                value={formatMoney(data.netCents)}
                {...(data.savingsRate !== null ? { hint: `${formatPercent(data.savingsRate)} savings rate` } : {})}
              />
              <StatTile label="Transactions" value={String(data.transactionCount)} hint="Transfers excluded" />
            </View>
            <CategoryBreakdown
              title="Where your money went"
              direction={DIRECTION.EXPENSE}
              items={data.expenseByCategory}
              emptyText="No spending recorded."
            />
            <CategoryBreakdown
              title="Where your money came from"
              direction={DIRECTION.INCOME}
              items={data.incomeByCategory}
              emptyText="No income recorded."
            />
            <MonthlyBars months={data.byMonth} />
            <MerchantList title="Top places you spent" merchants={spend.data ?? []} emptyText="No merchants yet." />
            <MerchantList title="Top income sources" merchants={income.data ?? []} emptyText="No income sources yet." />
          </>
        ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headline: { gap: SPACING.xs },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
});
