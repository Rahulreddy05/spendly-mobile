import { StyleSheet, View } from 'react-native';
import { DIRECTION_LABEL, formatMoney, monthLabel, type MonthTotal } from '@rahulreddy05/spendly-shared';
import { AppText, Card } from './ui';
import { useTheme } from '../hooks/use-theme';
import { SPACING } from '../constants/theme.constants';

const CHART_HEIGHT = 140;

/** Income vs spending per month as paired bars; each month is one accessible element. */
export function MonthlyBars({ months }: { months: MonthTotal[] }) {
  const theme = useTheme();
  const max = Math.max(1, ...months.flatMap((m) => [m.incomeCents, m.expenseCents]));
  const height = (cents: number) => Math.round((cents / max) * CHART_HEIGHT);

  return (
    <Card label="Month by month">
      <AppText bold accessibilityRole="header">
        Month by month
      </AppText>
      <View style={styles.chart}>
        {months.map((m) => (
          <View
            key={m.month}
            style={styles.month}
            accessible
            accessibilityLabel={`${monthLabel(m.month)}: ${DIRECTION_LABEL.INCOME} ${formatMoney(m.incomeCents)}, ${DIRECTION_LABEL.EXPENSE} ${formatMoney(m.expenseCents)}`}
          >
            <View style={styles.bars}>
              <View style={[styles.bar, { height: height(m.incomeCents), backgroundColor: theme.income }]} />
              <View style={[styles.bar, { height: height(m.expenseCents), backgroundColor: theme.expense }]} />
            </View>
            <AppText size="caption" tone="muted">
              {monthLabel(m.month).charAt(0)}
            </AppText>
          </View>
        ))}
      </View>
      <View style={styles.legend}>
        <Legend color={theme.income} label={DIRECTION_LABEL.INCOME} />
        <Legend color={theme.expense} label={DIRECTION_LABEL.EXPENSE} />
      </View>
    </Card>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.swatch, { backgroundColor: color }]} />
      <AppText size="small" tone="muted">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  chart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: CHART_HEIGHT + 20 },
  month: { alignItems: 'center', gap: SPACING.xs, flex: 1 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: CHART_HEIGHT },
  bar: { width: 7, borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  legend: { flexDirection: 'row', gap: SPACING.lg },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  swatch: { width: 10, height: 10, borderRadius: 2 },
});
