import { ScrollView, SectionList } from 'react-native';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { ApiError } from '@rahulreddy05/spendly-shared';
import DashboardScreen from './app/(tabs)/index';
import TransactionsScreen from './app/(tabs)/transactions';
import { fakeApi, fakeServices, renderWithProviders } from './test/render';
import { manualAccount, summary, transaction } from './test/fixtures';

const withApi = (api = fakeApi()) => fakeServices({ api });

describe('Dashboard', () => {
  it('answers where money came from and went', async () => {
    const merchants = jest.fn(async (_y: number, direction: string) =>
      direction === 'EXPENSE'
        ? [{ merchant: 'Amazon', totalCents: 12_000, transactionCount: 2 }]
        : [{ merchant: 'ACME Payroll', totalCents: 600_000, transactionCount: 2 }],
    );
    renderWithProviders(<DashboardScreen />, withApi(fakeApi({ analytics: { merchants } })));

    expect(await screen.findByText('Most of your spending went to Housing (74%).')).toBeTruthy();
    expect(screen.getByLabelText('Money in: $6,000.00')).toBeTruthy();
    expect(screen.getByLabelText('Kept: $3,500.00, 58% savings rate')).toBeTruthy();
    expect(screen.getByLabelText('Housing, $1,850.00, 74%')).toBeTruthy();
    expect(screen.getByLabelText('Jan: Money in $6,000.00, Money out $2,500.00')).toBeTruthy();
    expect(await screen.findByText(/^Amazon/)).toBeTruthy();
    expect(await screen.findByText(/^ACME Payroll/)).toBeTruthy();
  });

  it('steps to the previous year and re-queries', async () => {
    const summaryFn = jest.fn().mockResolvedValue(summary);
    renderWithProviders(
      <DashboardScreen />,
      withApi(fakeApi({ analytics: { summary: summaryFn } })),
    );
    await screen.findByText(/you brought in/);

    fireEvent.press(screen.getByRole('button', { name: 'Previous year' }));
    await waitFor(() => expect(summaryFn).toHaveBeenLastCalledWith(new Date().getFullYear() - 1));
    expect(screen.getByRole('button', { name: 'Next year' })).toBeTruthy();
  });

  it('pull-to-refresh refetches the summary and merchant lists', async () => {
    const api = fakeApi();
    renderWithProviders(<DashboardScreen />, withApi(api));
    await screen.findByText(/you brought in/);
    const scroll = screen.UNSAFE_getByType(ScrollView);

    await act(async () => {
      scroll.props.refreshControl.props.onRefresh();
    });
    await waitFor(() => expect(api.analytics.summary).toHaveBeenCalledTimes(2));
    expect(api.analytics.merchants).toHaveBeenCalledTimes(4);
  });

  it('guides a new user and shows errors', async () => {
    renderWithProviders(
      <DashboardScreen />,
      withApi(
        fakeApi({
          analytics: { summary: jest.fn().mockResolvedValue({ ...summary, transactionCount: 0 }) },
        }),
      ),
    );
    expect(await screen.findByText(/Nothing recorded for/)).toBeTruthy();
  });

  it('shows a friendly error', async () => {
    renderWithProviders(
      <DashboardScreen />,
      withApi(
        fakeApi({
          analytics: {
            summary: jest
              .fn()
              .mockRejectedValue(new ApiError(0, 'NETWORK_ERROR', 'Could not reach Pennypath.')),
          },
        }),
      ),
    );
    expect(await screen.findByText('Could not reach Pennypath.')).toBeTruthy();
  });
});

describe('Transactions', () => {
  it('groups by month with signed amounts and account names', async () => {
    const items = [
      transaction({
        id: 't1',
        merchant: 'Payroll',
        direction: 'INCOME',
        category: 'SALARY',
        amountCents: 300_000,
        occurredAt: '2026-04-01T00:00:00.000Z',
      }),
      transaction({
        id: 't2',
        merchant: 'Cafe',
        status: 'PENDING',
        occurredAt: '2026-03-04T00:00:00.000Z',
      }),
    ];
    renderWithProviders(
      <TransactionsScreen />,
      withApi(
        fakeApi({
          transactions: { list: jest.fn().mockResolvedValue({ items, nextCursor: null }) },
          accounts: { list: jest.fn().mockResolvedValue([manualAccount]) },
        }),
      ),
    );

    expect(await screen.findByText('APR 2026')).toBeTruthy();
    expect(screen.getByText('MAR 2026')).toBeTruthy();
    expect(screen.getByText('+$3,000.00')).toBeTruthy();
    expect(screen.getByText('-$12.50')).toBeTruthy();
    expect(screen.getByText(/Pending/)).toBeTruthy();
    await waitFor(() =>
      expect(screen.getByLabelText('Cafe, -$12.50, Dining out, Mar 4, 2026')).toBeTruthy(),
    );
  });

  it('loads the next page when scrolled to the end', async () => {
    const list = jest
      .fn()
      .mockResolvedValueOnce({
        items: [transaction({ id: 'a', merchant: 'First' })],
        nextCursor: 'c1',
      })
      .mockResolvedValueOnce({
        items: [transaction({ id: 'b', merchant: 'Second' })],
        nextCursor: null,
      });
    renderWithProviders(<TransactionsScreen />, withApi(fakeApi({ transactions: { list } })));

    await screen.findByText('First');
    fireEvent(screen.getByText('First'), 'onEndReached');
    fireEvent.scroll(screen.UNSAFE_getByType(SectionList), {
      nativeEvent: {
        contentOffset: { y: 500 },
        contentSize: { height: 500 },
        layoutMeasurement: { height: 100 },
      },
    });
    expect(await screen.findByText('Second')).toBeTruthy();
    expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ cursor: 'c1' }));
  });

  it('says when the year is empty', async () => {
    renderWithProviders(<TransactionsScreen />);
    expect(await screen.findByText(/No transactions in/)).toBeTruthy();
  });
});
