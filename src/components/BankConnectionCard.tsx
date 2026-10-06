import { Alert, StyleSheet, View } from 'react-native';
import {
  CONNECTION_STATUS,
  CONNECTION_STATUS_HELP,
  CONNECTION_STATUS_LABEL,
  formatDate,
  type BankConnection,
} from '@rahulreddy05/spendly-shared';
import { useFixConnection, useRemoveConnection, useSyncConnection } from '../hooks/use-connections';
import { AccountRow } from './AccountRow';
import { AppText, Button, Card, ErrorBanner } from './ui';
import { SPACING } from '../constants/theme.constants';

export function BankConnectionCard({ connection }: { connection: BankConnection }) {
  const sync = useSyncConnection();
  const fix = useFixConnection();
  const remove = useRemoveConnection();
  const name = connection.institutionName ?? 'Bank';
  const active = connection.status === CONNECTION_STATUS.ACTIVE;
  const accounts = connection.accounts.filter((a) => !a.archived);

  const onRemove = () =>
    Alert.alert(
      `Remove ${name}?`,
      'Pennypath loses access, and its accounts and imported transactions are deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => remove.mutate(connection.id) },
      ],
    );

  return (
    <Card label={name}>
      <View style={styles.header}>
        <AppText bold>{name}</AppText>
        <AppText size="small" bold tone={active ? 'income' : 'expense'}>
          {CONNECTION_STATUS_LABEL[connection.status]}
        </AppText>
      </View>
      <AppText size="small" tone="muted">
        {active
          ? connection.lastSyncedAt
            ? `Last synced ${formatDate(connection.lastSyncedAt)}`
            : 'Importing transactions…'
          : CONNECTION_STATUS_HELP[connection.status]}
      </AppText>

      <View style={styles.accounts}>
        {accounts.map((a) => (
          <AccountRow key={a.id} account={a} />
        ))}
      </View>

      {(sync.isError || fix.isError || remove.isError) && (
        <ErrorBanner error={sync.error ?? fix.error ?? remove.error} />
      )}
      {sync.isSuccess && (
        <AppText size="small" tone="muted" accessibilityRole="text">
          {sync.data.upserted === 0 && sync.data.removed === 0
            ? 'Already up to date.'
            : `Updated ${sync.data.upserted} transaction${sync.data.upserted === 1 ? '' : 's'}.`}
        </AppText>
      )}

      <View style={styles.actions}>
        {active && (
          <Button
            title="Sync now"
            variant="secondary"
            onPress={() => sync.mutate(connection.id)}
            loading={sync.isPending}
          />
        )}
        {connection.status === CONNECTION_STATUS.LOGIN_REQUIRED && (
          <Button
            title="Fix connection"
            onPress={() => fix.mutate(connection)}
            loading={fix.isPending}
          />
        )}
        <Button title="Remove" variant="danger" onPress={onRemove} loading={remove.isPending} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  accounts: { gap: SPACING.sm, marginTop: SPACING.md },
  actions: { gap: SPACING.sm, marginTop: SPACING.md },
});
