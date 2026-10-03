import type { Account, AuthResponse, Transaction, YearSummary } from '@rahulreddy05/spendly-shared';

export const user = {
  id: 'u1',
  email: 'rahul@example.com',
  displayName: 'Rahul',
  emailVerified: true,
  mfaEnabled: false,
};
export const session: AuthResponse = { accessToken: 'access-1', refreshToken: 'refresh-1', user };

export const manualAccount: Account = {
  id: 'acc-manual',
  name: 'Wallet',
  institution: null,
  type: 'CASH',
  last4: null,
  color: 'moss',
  currency: 'USD',
  source: 'MANUAL',
  status: 'ACTIVE',
  archived: false,
  balanceCents: null,
  lastSyncedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
};

export const linkedAccount: Account = {
  ...manualAccount,
  id: 'acc-linked',
  name: 'Total Checking',
  institution: 'Chase',
  type: 'CHECKING',
  last4: '6789',
  color: 'petrol',
  source: 'STRIPE',
  balanceCents: 250_000,
  lastSyncedAt: '2026-09-01T00:00:00.000Z',
};

export const transaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: `tx-${Math.random().toString(36).slice(2)}`,
  accountId: manualAccount.id,
  amountCents: 1_250,
  direction: 'EXPENSE',
  currency: 'USD',
  category: 'DINING',
  status: 'POSTED',
  merchant: 'Cafe',
  note: null,
  occurredAt: '2026-03-04T00:00:00.000Z',
  source: 'MANUAL',
  ...overrides,
});

export const summary: YearSummary = {
  year: 2026,
  incomeCents: 600_000,
  expenseCents: 250_000,
  netCents: 350_000,
  savingsRate: 0.583,
  transactionCount: 12,
  topExpenseCategory: {
    category: 'HOUSING',
    totalCents: 185_000,
    transactionCount: 1,
    share: 0.74,
  },
  topIncomeCategory: { category: 'SALARY', totalCents: 600_000, transactionCount: 2, share: 1 },
  expenseByCategory: [
    { category: 'HOUSING', totalCents: 185_000, transactionCount: 1, share: 0.74 },
    { category: 'DINING', totalCents: 65_000, transactionCount: 9, share: 0.26 },
  ],
  incomeByCategory: [{ category: 'SALARY', totalCents: 600_000, transactionCount: 2, share: 1 }],
  byMonth: Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    incomeCents: i === 0 ? 600_000 : 0,
    expenseCents: i === 0 ? 250_000 : 0,
    netCents: i === 0 ? 350_000 : 0,
  })),
  byAccount: [],
};
