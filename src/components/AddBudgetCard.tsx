import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  BUDGETABLE_CATEGORIES,
  CATEGORY_LABEL,
  parseAmountToCents,
  type Category,
} from '@rahulreddy05/spendly-shared';
import { useCreateBudget } from '../hooks/use-budgets';
import { AppText, Button, Card, ErrorBanner, Notice, TextField } from './ui';
import { useTheme } from '../hooks/use-theme';
import { RADIUS, SPACING } from '../constants/theme.constants';

/** Pick a spending category without a budget, then set its monthly limit. */
export function AddBudgetCard({ taken }: { taken: readonly Category[] }) {
  const theme = useTheme();
  const create = useCreateBudget();
  const available = BUDGETABLE_CATEGORIES.filter((c) => !taken.includes(c));
  const [picked, setPicked] = useState<Category | null>(null);
  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState<string | null>(null);
  const category = picked && (available as readonly string[]).includes(picked) ? picked : null;

  if (available.length === 0) {
    return <Notice>Every spending category has a budget. Change one below to adjust it.</Notice>;
  }

  const submit = () => {
    if (!category) return;
    const limitCents = parseAmountToCents(amount);
    if (!limitCents) {
      setAmountError('Enter an amount greater than $0, like 300 or 249.99.');
      return;
    }
    setAmountError(null);
    create.mutate(
      { category, limitCents },
      {
        onSuccess: () => {
          setPicked(null);
          setAmount('');
        },
      },
    );
  };

  return (
    <Card label="Add a budget">
      <AppText bold accessibilityRole="header">
        Add a budget
      </AppText>
      <AppText size="small" tone="muted">
        We&apos;ll alert you at 80% and when you reach the limit.
      </AppText>
      <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel="Category">
        {available.map((c) => {
          const selected = c === category;
          return (
            <Pressable
              key={c}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => setPicked(c)}
              style={[
                styles.chip,
                {
                  borderColor: selected ? theme.primary : theme.border,
                  backgroundColor: selected ? theme.primary : theme.surface,
                },
              ]}
            >
              <AppText size="small" style={{ color: selected ? theme.onPrimary : theme.text }}>
                {CATEGORY_LABEL[c]}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      {category && (
        <View style={styles.form}>
          <TextField
            label={`Monthly limit for ${CATEGORY_LABEL[category]} ($)`}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="300"
            error={amountError}
          />
          <Button title="Add budget" onPress={submit} loading={create.isPending} />
        </View>
      )}
      {create.isError && <ErrorBanner error={create.error} />}
    </Card>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.md },
  chip: {
    borderWidth: 1,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  form: { gap: SPACING.sm, marginTop: SPACING.md },
});
