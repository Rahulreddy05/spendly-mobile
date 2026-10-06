import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { currentMonth, formatMonth, monthElapsed } from '@rahulreddy05/spendly-shared';
import { useBudgets } from '../hooks/use-budgets';
import { BudgetProgress } from './BudgetProgress';
import { AppText, Button, Card } from './ui';
import { ROUTES } from '../constants/navigation.constants';
import { SPACING } from '../constants/theme.constants';

const SHOWN = 3;

/** Dashboard card: the budgets closest to (or over) their limit this month. */
export function BudgetsSummaryCard() {
  const router = useRouter();
  const month = currentMonth();
  const budgets = useBudgets(month);
  const list = [...(budgets.data?.budgets ?? [])]
    .sort((a, b) => b.usedPercent - a.usedPercent)
    .slice(0, SHOWN);
  if (!budgets.isSuccess) return null;

  return (
    <Card label="This month's budgets">
      <AppText bold accessibilityRole="header">
        {formatMonth(month)} budgets
      </AppText>
      {list.length === 0 ? (
        <AppText size="small" tone="muted">
          Set monthly limits for categories like dining or shopping, and get alerted before you
          overspend.
        </AppText>
      ) : (
        <View style={styles.list}>
          {list.map((b) => (
            <BudgetProgress key={b.id} budget={b} elapsed={monthElapsed(month)} />
          ))}
        </View>
      )}
      <View style={styles.action}>
        <Button
          title={list.length ? 'See all budgets' : 'Set a budget'}
          variant="secondary"
          onPress={() => router.navigate(ROUTES.BUDGETS)}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  list: { gap: SPACING.md, marginTop: SPACING.sm },
  action: { marginTop: SPACING.md },
});
