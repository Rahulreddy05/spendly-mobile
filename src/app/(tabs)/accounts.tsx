import { DATA_SOURCE } from '@rahulreddy05/spendly-shared';
import { useAccounts } from '../../hooks/use-accounts';
import { useConnections } from '../../hooks/use-connections';
import { Screen } from '../../components/Screen';
import { LinkBankCard } from '../../components/LinkBankCard';
import { BankConnectionCard } from '../../components/BankConnectionCard';
import { AccountRow } from '../../components/AccountRow';
import { AppText, Card, ErrorBanner, LoadingView, Notice } from '../../components/ui';

export default function AccountsScreen() {
  const accounts = useAccounts();
  const connections = useConnections();
  const manual = (accounts.data ?? []).filter(
    (a) => a.source === DATA_SOURCE.MANUAL && !a.archived,
  );
  const hasConnections = (connections.data?.length ?? 0) > 0;

  const refresh = () => void Promise.all([accounts.refetch(), connections.refetch()]);

  return (
    <Screen refreshing={accounts.isRefetching || connections.isRefetching} onRefresh={refresh}>
      <LinkBankCard />
      {(accounts.isLoading || connections.isLoading) && <LoadingView label="Loading accounts" />}
      {connections.isError && <ErrorBanner error={connections.error} />}
      {accounts.isError && <ErrorBanner error={accounts.error} />}

      {connections.data?.map((c) => (
        <BankConnectionCard key={c.id} connection={c} />
      ))}

      {manual.length > 0 && (
        <Card label="Manual accounts">
          <AppText bold accessibilityRole="header">
            Manual accounts
          </AppText>
          {manual.map((a) => (
            <AccountRow key={a.id} account={a} />
          ))}
        </Card>
      )}
      {accounts.isSuccess && connections.isSuccess && !hasConnections && manual.length === 0 && (
        <Notice>No accounts yet.</Notice>
      )}
    </Screen>
  );
}
