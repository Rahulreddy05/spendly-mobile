import { describeYear } from './describe-year';
import { summary } from '../test/fixtures';

describe('describeYear', () => {
  it('says what came in, went out, was kept, and where', () => {
    expect(describeYear(summary)).toEqual([
      'In 2026 you brought in $6,000.00 and spent $2,500.00, keeping $3,500.00 (58% of what came in).',
      'Most of your spending went to Housing (74%).',
      'Most of your income came from Salary.',
    ]);
  });

  it('is honest about overspending and omits missing parts', () => {
    const over = {
      ...summary,
      incomeCents: 1_000,
      expenseCents: 5_000,
      netCents: -4_000,
      savingsRate: null,
      topExpenseCategory: null,
      topIncomeCategory: null,
    };
    expect(describeYear(over)).toEqual([
      'In 2026 you brought in $10.00 and spent $50.00 — $40.00 more than came in.',
    ]);
  });

  it('leaves out the savings rate when there was no income', () => {
    const noIncome = {
      ...summary,
      incomeCents: 0,
      expenseCents: 0,
      netCents: 0,
      savingsRate: null,
    };
    expect(describeYear(noIncome)[0]).toBe(
      'In 2026 you brought in $0.00 and spent $0.00, keeping $0.00.',
    );
  });
});
