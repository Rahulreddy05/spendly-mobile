import { StyleSheet, View } from 'react-native';
import {
  BUDGET_STATUS_LABEL,
  CATEGORY_LABEL,
  formatMoney,
  formatPercent,
  type Budget,
  type BudgetStatus,
} from '@rahulreddy05/spendly-shared';
import { AppText } from './ui';
import { useTheme } from '../hooks/use-theme';
import type { Palette } from '../constants/theme.constants';
import { RADIUS, SPACING } from '../constants/theme.constants';

const PERCENT = 100;
const BAR_HEIGHT = 10;

const statusColor = (status: BudgetStatus, theme: Palette): string =>
  ({ OK: theme.income, WARNING: theme.warning, EXCEEDED: theme.expense })[status];

/** One budget: amounts, a progress bar with a "where you should be" marker, and status. */
export function BudgetProgress({ budget, elapsed }: { budget: Budget; elapsed: number }) {
  const theme = useTheme();
  const label = CATEGORY_LABEL[budget.category];
  const fill = Math.min(PERCENT, budget.usedPercent);
  const color = statusColor(budget.status, theme);
  const over = budget.remainingCents < 0;

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <AppText bold>{label}</AppText>
        <AppText size="small" tone="muted">
          {formatMoney(budget.spentCents)} of {formatMoney(budget.limitCents)}
        </AppText>
      </View>
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={`${label} spending`}
        accessibilityValue={{
          min: 0,
          max: PERCENT,
          now: Math.round(fill),
          text: `${budget.usedPercent}% used`,
        }}
        style={[styles.track, { backgroundColor: theme.surfaceMuted }]}
      >
        <View style={[styles.fill, { width: `${fill}%`, backgroundColor: color }]} />
        {elapsed > 0 && elapsed < 1 && (
          <View
            style={[styles.pace, { left: `${elapsed * PERCENT}%`, backgroundColor: theme.text }]}
          />
        )}
      </View>
      <View style={styles.row}>
        <AppText size="small" style={{ color }}>
          {BUDGET_STATUS_LABEL[budget.status]} · {formatPercent(budget.usedPercent / PERCENT)} used
        </AppText>
        <AppText size="small" tone="muted">
          {over
            ? `${formatMoney(-budget.remainingCents)} over`
            : `${formatMoney(budget.remainingCents)} left`}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: SPACING.xs },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: SPACING.sm, flexWrap: 'wrap' },
  track: {
    height: BAR_HEIGHT,
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
    marginVertical: SPACING.xs,
  },
  fill: { height: '100%', borderRadius: RADIUS.pill },
  pace: { position: 'absolute', top: 0, bottom: 0, width: 2, opacity: 0.45 },
});
