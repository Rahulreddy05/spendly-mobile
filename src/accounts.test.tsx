import { Alert } from 'react-native';
import { fireEvent, screen, waitFor, within } from '@testing-library/react-native';
import { ApiError, type SpendlyApi } from '@rahulreddy05/spendly-shared';
import AccountsScreen from './app/(tabs)/accounts';
import { fakeApi, fakeServices, renderWithProviders } from './test/render';
import { connection, linkedAccount, manualAccount, session } from './test/fixtures';
import type { BankLinker } from './services/bank-linker';

const linked = (publicToken = 'public-sandbox-1'): BankLinker => ({
  link: jest.fn().mockResolvedValue({ status: 'linked', publicToken }),
});

const plaidApi = (overrides: Parameters<typeof fakeApi>[0] = {}): SpendlyApi =>
  fakeApi({
    ...overrides,
    connections: { providers: jest.fn().mockResolvedValue(['PLAID']), ...overrides.connections },
  });

const renderAccounts = (api: SpendlyApi, linker: BankLinker | null = linked()) =>
  renderWithProviders(<AccountsScreen />, fakeServices({ api, linker }));

describe('Accounts', () => {
  it('shows each bank with its accounts, and manual accounts separately', async () => {
    const archived = { ...manualAccount, id: 'old', name: 'Old card', archived: true };
    renderAccounts(
      plaidApi({
        accounts: { list: jest.fn().mockResolvedValue([linkedAccount, manualAccount, archived]) },
        connections: { list: jest.fn().mockResolvedValue([connection]) },
      }),
    );

    const bank = await screen.findByLabelText('Chase');
    expect(within(bank).getByText('Connected')).toBeTruthy();
    expect(within(bank).getByText('Last synced Sep 1, 2026')).toBeTruthy();
    expect(within(bank).getByText('Total Checking')).toBeTruthy();
    expect(within(bank).getByText('Checking · •••• 6789')).toBeTruthy();
    expect(within(bank).getByText('$2,500.00')).toBeTruthy();

    const manual = screen.getByLabelText('Manual accounts');
    expect(within(manual).getByText('Wallet')).toBeTruthy();
    expect(within(manual).getByText('Manual · Cash')).toBeTruthy();
    expect(screen.queryByText('Old card')).toBeNull();
  });

  it('says when there are no accounts', async () => {
    renderAccounts(fakeApi());
    expect(await screen.findByText('No accounts yet.')).toBeTruthy();
  });

  it('links a bank: link token → Plaid Link → exchange, then imports in the background', async () => {
    const linker = linked();
    const api = plaidApi({
      connections: {
        exchange: jest.fn().mockResolvedValue(connection),
        sync: jest.fn().mockResolvedValue({ upserted: 48, removed: 0 }),
      },
    });
    renderAccounts(api, linker);

    fireEvent.press(await screen.findByText('Link a bank account'));

    expect(
      await screen.findByText('Linked Chase: 1 account. Transactions are importing.'),
    ).toBeTruthy();
    expect(api.connections.createLinkToken).toHaveBeenCalledWith('PLAID', 'ios');
    expect(linker.link).toHaveBeenCalledWith('link-sandbox-1');
    expect(api.connections.exchange).toHaveBeenCalledWith('PLAID', 'public-sandbox-1');
    await waitFor(() => expect(api.connections.sync).toHaveBeenCalledWith('conn-1'));
  });

  it('reports a cancelled link without exchanging anything', async () => {
    const api = plaidApi();
    renderAccounts(api, { link: jest.fn().mockResolvedValue({ status: 'cancelled' }) });
    fireEvent.press(await screen.findByText('Link a bank account'));
    expect(await screen.findByText('Bank linking was cancelled.')).toBeTruthy();
    expect(api.connections.exchange).not.toHaveBeenCalled();
  });

  it('shows linking errors, such as a bank that is already linked', async () => {
    const api = plaidApi({
      connections: {
        exchange: jest
          .fn()
          .mockRejectedValue(new ApiError(409, 'CONFLICT', 'Those accounts are already linked.')),
      },
    });
    renderAccounts(api);
    fireEvent.press(await screen.findByText('Link a bank account'));
    expect(await screen.findByText('Those accounts are already linked.')).toBeTruthy();
  });

  it('hides linking when the server or this build cannot do it', async () => {
    const { unmount } = renderAccounts(fakeApi()); // no providers configured
    expect(await screen.findByText(/isn.t available right now/)).toBeTruthy();
    unmount();

    renderAccounts(plaidApi(), null); // no native Plaid module (Expo Go)
    expect(await screen.findByText(/isn.t available right now/)).toBeTruthy();
    expect(screen.queryByText('Link a bank account')).toBeNull();
  });

  it('asks for a verified email before linking', async () => {
    const unverified = { ...session, user: { ...session.user, emailVerified: false } };
    renderAccounts(
      plaidApi({
        auth: {
          restoreSession: jest.fn().mockResolvedValue(unverified),
          me: jest.fn().mockResolvedValue(unverified.user),
        },
      }),
    );
    expect(await screen.findByText(/Verify your email address/)).toBeTruthy();
    expect(screen.queryByText('Link a bank account')).toBeNull();
  });

  it('fixes a connection that needs the user to sign in again', async () => {
    const linker = linked('public-update');
    const api = plaidApi({
      connections: {
        list: jest.fn().mockResolvedValue([{ ...connection, status: 'LOGIN_REQUIRED' }]),
        markReconnected: jest.fn().mockResolvedValue(connection),
        sync: jest.fn().mockResolvedValue({ upserted: 1, removed: 0 }),
      },
    });
    renderAccounts(api, linker);

    const bank = await screen.findByLabelText('Chase');
    expect(within(bank).getByText('Needs attention')).toBeTruthy();
    expect(within(bank).queryByText('Sync now')).toBeNull();

    fireEvent.press(within(bank).getByText('Fix connection'));
    await waitFor(() => expect(api.connections.markReconnected).toHaveBeenCalledWith('conn-1'));
    expect(api.connections.createUpdateLinkToken).toHaveBeenCalledWith('conn-1', 'ios');
    expect(linker.link).toHaveBeenCalledWith('link-update-1');
    expect(api.connections.exchange).not.toHaveBeenCalled();
  });

  it('explains a revoked connection and offers only removal', async () => {
    renderAccounts(
      plaidApi({
        connections: {
          list: jest.fn().mockResolvedValue([{ ...connection, status: 'DISCONNECTED' }]),
        },
      }),
    );
    const bank = await screen.findByLabelText('Chase');
    expect(within(bank).getByText(/revoked/)).toBeTruthy();
    expect(within(bank).queryByText('Sync now')).toBeNull();
    expect(within(bank).queryByText('Fix connection')).toBeNull();
    expect(within(bank).getByText('Remove')).toBeTruthy();
  });

  it('syncs on demand and shows the result or the error', async () => {
    const sync = jest
      .fn()
      .mockResolvedValueOnce({ upserted: 3, removed: 0 })
      .mockRejectedValueOnce(
        new ApiError(409, 'BANK_LOGIN_REQUIRED', 'Your bank needs you to sign in again.'),
      );
    renderAccounts(
      plaidApi({ connections: { list: jest.fn().mockResolvedValue([connection]), sync } }),
    );

    fireEvent.press(await screen.findByText('Sync now'));
    expect(await screen.findByText('Updated 3 transactions.')).toBeTruthy();
    fireEvent.press(screen.getByText('Sync now'));
    expect(await screen.findByText('Your bank needs you to sign in again.')).toBeTruthy();
    expect(sync).toHaveBeenCalledWith('conn-1');
  });

  it('removes a connection only after confirming', async () => {
    const api = plaidApi({ connections: { list: jest.fn().mockResolvedValue([connection]) } });
    const alert = jest.spyOn(Alert, 'alert');
    renderAccounts(api);

    fireEvent.press(await screen.findByText('Remove'));
    expect(alert).toHaveBeenCalledWith(
      'Remove Chase?',
      expect.stringContaining('deleted'),
      expect.any(Array),
    );
    expect(api.connections.remove).not.toHaveBeenCalled();

    const buttons = alert.mock.calls[0]![2]!;
    buttons.find((b) => b.style === 'destructive')!.onPress!();
    await waitFor(() => expect(api.connections.remove).toHaveBeenCalledWith('conn-1'));
  });
});
