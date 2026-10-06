import { useState } from 'react';
import { PROVIDER } from '@rahulreddy05/spendly-shared';
import { useAuth } from '../auth/auth-context';
import { useAppServices } from '../services/app-services';
import { useLinkBank, useLinkProviders } from '../hooks/use-connections';
import { AppText, Button, Card, ErrorBanner, Notice } from './ui';

/** "Link a bank account" through Plaid, or why it is unavailable right now. */
export function LinkBankCard() {
  const { user } = useAuth();
  const { linker } = useAppServices();
  const providers = useLinkProviders();
  const link = useLinkBank();
  const [message, setMessage] = useState<string | null>(null);

  if (providers.isLoading) return null;
  if (!providers.data?.includes(PROVIDER.PLAID) || !linker) {
    return (
      <Notice>
        Bank linking isn&apos;t available right now. You can still see accounts added on the
        website.
      </Notice>
    );
  }
  if (!user?.emailVerified) {
    return <Notice>Verify your email address (see Settings) to link a bank.</Notice>;
  }

  const onPress = () => {
    setMessage(null);
    link.mutate(undefined, {
      onSuccess: (result) =>
        setMessage(
          result.status === 'cancelled'
            ? 'Bank linking was cancelled.'
            : `Linked ${result.connection.institutionName ?? 'your bank'}: ${result.connection.accounts.length} account${
                result.connection.accounts.length === 1 ? '' : 's'
              }. Transactions are importing.`,
        ),
    });
  };

  return (
    <Card label="Link a bank">
      <AppText tone="muted">Connect your bank so transactions flow in automatically.</AppText>
      <Button title="Link a bank account" onPress={onPress} loading={link.isPending} />
      {message && <AppText size="small">{message}</AppText>}
      {link.isError && <ErrorBanner error={link.error} />}
    </Card>
  );
}
