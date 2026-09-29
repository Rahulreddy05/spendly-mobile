import { StyleSheet, View } from 'react-native';
import {
  ACCOUNT_COLOR_HEX,
  ACCOUNT_STATUS,
  ACCOUNT_TYPE_LABEL,
  DATA_SOURCE,
  formatDate,
  formatMoney,
  type Account,
} from '@rahulreddy05/spendly-shared';
import { useAccounts } from '../../hooks/use-accounts';
import { Screen } from '../../components/Screen';
import { AppText, Card, ErrorBanner, LoadingView, Notice } from '../../components/ui';
import { RADIUS, SPACING } from '../../constants/theme.constants';

function AccountRow({ account }: { account: Account }) {
  const linked = account.source !== DATA_SOURCE.MANUAL;
  const meta = [
    ACCOUNT_TYPE_LABEL[account.type],
    account.institution,
    account.last4 ? `•••• ${account.last4}` : null,
    account.lastSyncedAt ? `Synced ${formatDate(account.lastSyncedAt)}` : null,
  ].filter(Boolean);

  return (
    <Card label={account.name}>
      <View style={styles.row}>
        <View style={[styles.swatch, { backgroundColor: ACCOUNT_COLOR_HEX[account.color] }]} />
        <View style={styles.info}>
          <AppText bold>{account.name}</AppText>
          <AppText size="small" tone="muted">
            {[linked ? 'Linked' : 'Manual', ...meta].join(' · ')}
          </AppText>
          {account.status === ACCOUNT_STATUS.DISCONNECTED && (
            <AppText size="small" tone="expense">
              Disconnected — link it again to resume syncing
            </AppText>
          )}
        </View>
        {account.balanceCents !== null && (
          <AppText bold>{formatMoney(account.balanceCents, account.currency)}</AppText>
        )}
      </View>
    </Card>
  );
}

export default function AccountsScreen() {
  const accounts = useAccounts();
  const active = (accounts.data ?? []).filter((a) => !a.archived);

  return (
    <Screen refreshing={accounts.isRefetching} onRefresh={() => void accounts.refetch()}>
      {accounts.isLoading && <LoadingView label="Loading accounts" />}
      {accounts.isError && <ErrorBanner error={accounts.error} />}
      {accounts.isSuccess && active.length === 0 && <Notice>No accounts yet.</Notice>}
      {active.map((a) => (
        <AccountRow key={a.id} account={a} />
      ))}
      <Notice>Linking a bank and adding accounts from the app is coming in the next update. Until then, use the Spendly website.</Notice>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  swatch: { width: 6, alignSelf: 'stretch', borderRadius: RADIUS.pill },
  info: { flex: 1, gap: 2 },
});
