import { StyleSheet, View } from 'react-native';
import { formatMoney, type MerchantTotal } from '@rahulreddy05/spendly-shared';
import { AppText, Card } from './ui';
import { SPACING } from '../constants/theme.constants';

export function MerchantList({ title, merchants, emptyText }: { title: string; merchants: MerchantTotal[]; emptyText: string }) {
  return (
    <Card label={title}>
      <AppText bold accessibilityRole="header">
        {title}
      </AppText>
      {merchants.length === 0 ? (
        <AppText tone="muted">{emptyText}</AppText>
      ) : (
        merchants.map((m) => (
          <View key={m.merchant} style={styles.row}>
            <AppText numberOfLines={1} style={styles.name}>
              {m.merchant} <AppText tone="muted">· {m.transactionCount}×</AppText>
            </AppText>
            <AppText bold>{formatMoney(m.totalCents)}</AppText>
          </View>
        ))
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: SPACING.sm },
  name: { flexShrink: 1 },
});
