import { StyleSheet, View } from 'react-native';
import {
  ACCOUNT_COLOR_HEX,
  ACCOUNT_TYPE_LABEL,
  DATA_SOURCE,
  formatDate,
  formatMoney,
  type Account,
} from '@rahulreddy05/spendly-shared';
import { AppText } from './ui';
import { RADIUS, SPACING } from '../constants/theme.constants';

/** One account line. Linked accounts sit inside their bank's card, so the bank name is not repeated. */
export function AccountRow({ account }: { account: Account }) {
  const linked = account.source !== DATA_SOURCE.MANUAL;
  const meta = [
    linked ? null : 'Manual',
    ACCOUNT_TYPE_LABEL[account.type],
    linked ? null : account.institution,
    account.last4 ? `•••• ${account.last4}` : null,
    !linked && account.lastSyncedAt ? `Synced ${formatDate(account.lastSyncedAt)}` : null,
  ].filter(Boolean);

  return (
    <View style={styles.row} accessibilityLabel={account.name}>
      <View style={[styles.swatch, { backgroundColor: ACCOUNT_COLOR_HEX[account.color] }]} />
      <View style={styles.info}>
        <AppText bold>{account.name}</AppText>
        <AppText size="small" tone="muted">
          {meta.join(' · ')}
        </AppText>
      </View>
      {account.balanceCents !== null && (
        <AppText bold>{formatMoney(account.balanceCents, account.currency)}</AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  swatch: { width: 6, alignSelf: 'stretch', borderRadius: RADIUS.pill },
  info: { flex: 1, gap: 2 },
});
