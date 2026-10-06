import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { CATEGORY_LABEL, parseAmountToCents, type Budget } from '@rahulreddy05/spendly-shared';
import { useDeleteBudget, useUpdateBudget } from '../hooks/use-budgets';
import { BudgetProgress } from './BudgetProgress';
import { Button, Card, ErrorBanner, TextField } from './ui';
import { SPACING } from '../constants/theme.constants';

const CENTS = 100;

export function BudgetCard({
  budget,
  elapsed,
  editable,
}: {
  budget: Budget;
  elapsed: number;
  editable: boolean;
}) {
  const update = useUpdateBudget();
  const remove = useDeleteBudget();
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState(String(budget.limitCents / CENTS));
  const [amountError, setAmountError] = useState<string | null>(null);
  const label = CATEGORY_LABEL[budget.category];

  const save = () => {
    const limitCents = parseAmountToCents(amount);
    if (!limitCents) {
      setAmountError('Enter an amount greater than $0.');
      return;
    }
    setAmountError(null);
    update.mutate({ id: budget.id, limitCents }, { onSuccess: () => setEditing(false) });
  };

  const confirmRemove = () =>
    Alert.alert(`Remove your ${label} budget?`, 'Its alerts stop too.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => remove.mutate(budget.id) },
    ]);

  return (
    <Card label={`${label} budget`}>
      <BudgetProgress budget={budget} elapsed={elapsed} />
      {editable &&
        (editing ? (
          <View style={styles.actions}>
            <TextField
              label="New monthly limit ($)"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              error={amountError}
            />
            <Button title="Save" onPress={save} loading={update.isPending} />
            <Button title="Cancel" variant="secondary" onPress={() => setEditing(false)} />
          </View>
        ) : (
          <View style={[styles.actions, styles.inline]}>
            <View style={styles.grow}>
              <Button title="Change limit" variant="secondary" onPress={() => setEditing(true)} />
            </View>
            <View style={styles.grow}>
              <Button
                title="Remove"
                variant="danger"
                onPress={confirmRemove}
                loading={remove.isPending}
              />
            </View>
          </View>
        ))}
      {(update.isError || remove.isError) && <ErrorBanner error={update.error ?? remove.error} />}
    </Card>
  );
}

const styles = StyleSheet.create({
  actions: { gap: SPACING.sm, marginTop: SPACING.md },
  inline: { flexDirection: 'row' },
  grow: { flex: 1 },
});
