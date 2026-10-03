import { useMemo } from 'react';
import { RefreshControl, SectionList, StyleSheet, View } from 'react-native';
import {
  CATEGORY_LABEL,
  formatDate,
  formatMoney,
  groupByMonth,
  signedCents,
  TRANSACTION_STATUS,
  type Transaction,
} from '@rahulreddy05/spendly-shared';
import { useTransactions } from '../../hooks/use-transactions';
import { useAccounts } from '../../hooks/use-accounts';
import { useTheme } from '../../hooks/use-theme';
import { AppText, ErrorBanner, LoadingView, Notice } from '../../components/ui';
import { SPACING } from '../../constants/theme.constants';

function TransactionRow({ tx, accountName }: { tx: Transaction; accountName: string }) {
  const theme = useTheme();
  const title = tx.merchant ?? CATEGORY_LABEL[tx.category];
  const amount = formatMoney(signedCents(tx.amountCents, tx.direction), tx.currency, {
    signed: true,
  });
  return (
    <View
      accessible
      accessibilityLabel={`${title}, ${amount}, ${CATEGORY_LABEL[tx.category]}, ${formatDate(tx.occurredAt)}`}
      style={[styles.row, { borderBottomColor: theme.border }]}
    >
      <View style={styles.info}>
        <AppText numberOfLines={1}>
          {title}
          {tx.status === TRANSACTION_STATUS.PENDING ? (
            <AppText tone="muted"> · Pending</AppText>
          ) : null}
        </AppText>
        <AppText size="small" tone="muted" numberOfLines={1}>
          {CATEGORY_LABEL[tx.category]} · {formatDate(tx.occurredAt)} · {accountName}
        </AppText>
      </View>
      <AppText bold tone={tx.direction === 'INCOME' ? 'income' : 'expense'}>
        {amount}
      </AppText>
    </View>
  );
}

export default function TransactionsScreen() {
  const theme = useTheme();
  const year = new Date().getFullYear();
  const transactions = useTransactions({ year });
  const accounts = useAccounts();

  const names = useMemo(
    () => new Map((accounts.data ?? []).map((a) => [a.id, a.name])),
    [accounts.data],
  );
  const sections = useMemo(
    () =>
      groupByMonth(transactions.data?.pages.flatMap((p) => p.items) ?? []).map((g) => ({
        key: g.key,
        title: g.label,
        data: g.items,
      })),
    [transactions.data],
  );

  if (transactions.isLoading) return <LoadingView label="Loading transactions" />;

  return (
    <SectionList
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.body}
      sections={sections}
      keyExtractor={(tx) => tx.id}
      renderItem={({ item }) => (
        <TransactionRow tx={item} accountName={names.get(item.accountId) ?? ''} />
      )}
      renderSectionHeader={({ section }) => (
        <AppText
          size="small"
          tone="muted"
          bold
          style={[styles.header, { backgroundColor: theme.background }]}
        >
          {section.title.toUpperCase()}
        </AppText>
      )}
      ListHeaderComponent={transactions.isError ? <ErrorBanner error={transactions.error} /> : null}
      ListEmptyComponent={
        transactions.isSuccess ? <Notice>No transactions in {year} yet.</Notice> : null
      }
      ListFooterComponent={
        transactions.isFetchingNextPage ? <LoadingView label="Loading more" /> : null
      }
      onEndReached={() => {
        if (transactions.hasNextPage && !transactions.isFetchingNextPage)
          void transactions.fetchNextPage();
      }}
      onEndReachedThreshold={0.5}
      refreshControl={
        <RefreshControl
          refreshing={transactions.isRefetching && !transactions.isFetchingNextPage}
          onRefresh={() => void transactions.refetch()}
          tintColor={theme.primary}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  body: { padding: SPACING.lg },
  header: { paddingTop: SPACING.lg, paddingBottom: SPACING.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  info: { flex: 1, gap: 2 },
});
