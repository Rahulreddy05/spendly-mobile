import { StyleSheet, View } from 'react-native';
import {
  CATEGORY_LABEL,
  formatMoney,
  formatPercent,
  type CategoryTotal,
  type Direction,
} from '@rahulreddy05/spendly-shared';
import { AppText, Card } from './ui';
import { useTheme } from '../hooks/use-theme';
import { RADIUS, SPACING } from '../constants/theme.constants';

const PERCENT = 100;
const MIN_BAR_PERCENT = 1;

export function CategoryBreakdown({
  title,
  direction,
  items,
  emptyText,
}: {
  title: string;
  direction: Direction;
  items: CategoryTotal[];
  emptyText: string;
}) {
  const theme = useTheme();
  const fill = direction === 'INCOME' ? theme.income : theme.expense;

  return (
    <Card label={title}>
      <AppText bold accessibilityRole="header">
        {title}
      </AppText>
      {items.length === 0 ? (
        <AppText tone="muted">{emptyText}</AppText>
      ) : (
        items.map((item) => (
          <View
            key={item.category}
            style={styles.row}
            accessible
            accessibilityLabel={`${CATEGORY_LABEL[item.category]}, ${formatMoney(item.totalCents)}, ${formatPercent(item.share)}`}
          >
            <View style={styles.labels}>
              <AppText>
                {CATEGORY_LABEL[item.category]}{' '}
                <AppText tone="muted">· {formatPercent(item.share)}</AppText>
              </AppText>
              <AppText bold>{formatMoney(item.totalCents)}</AppText>
            </View>
            <View style={[styles.track, { backgroundColor: theme.surfaceMuted }]}>
              <View
                style={[
                  styles.fill,
                  {
                    backgroundColor: fill,
                    width: `${Math.max(item.share * PERCENT, MIN_BAR_PERCENT)}%`,
                  },
                ]}
              />
            </View>
          </View>
        ))
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { gap: SPACING.xs },
  labels: { flexDirection: 'row', justifyContent: 'space-between', gap: SPACING.sm },
  track: { height: 8, borderRadius: RADIUS.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: RADIUS.pill },
});
