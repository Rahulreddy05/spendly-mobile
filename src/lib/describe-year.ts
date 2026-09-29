import { CATEGORY_LABEL, formatMoney, formatPercent, type YearSummary } from '@rahulreddy05/spendly-shared';

/**
 * The plain-language answer to "where did my money come from and go?", as
 * sentences. Pure, so the wording is unit-tested.
 */
export function describeYear(summary: YearSummary): string[] {
  const { year, incomeCents, expenseCents, netCents, savingsRate, topExpenseCategory, topIncomeCategory } =
    summary;
  const sentences: string[] = [];

  const flow = `In ${year} you brought in ${formatMoney(incomeCents)} and spent ${formatMoney(expenseCents)}`;
  if (netCents >= 0) {
    const share = savingsRate !== null ? ` (${formatPercent(savingsRate)} of what came in)` : '';
    sentences.push(`${flow}, keeping ${formatMoney(netCents)}${share}.`);
  } else {
    sentences.push(`${flow} — ${formatMoney(-netCents)} more than came in.`);
  }

  if (topExpenseCategory) {
    sentences.push(
      `Most of your spending went to ${CATEGORY_LABEL[topExpenseCategory.category]} (${formatPercent(topExpenseCategory.share)}).`,
    );
  }
  if (topIncomeCategory) {
    sentences.push(`Most of your income came from ${CATEGORY_LABEL[topIncomeCategory.category]}.`);
  }
  return sentences;
}
