import { Pressable, StyleSheet, View } from 'react-native';
import { formatMonth, shiftMonth } from '@rahulreddy05/spendly-shared';
import { AppText } from './ui';
import { useTheme } from '../hooks/use-theme';
import { SPACING, TOUCH_TARGET } from '../constants/theme.constants';

/** ‹ October 2026 › — never past `max` (this month). */
export function MonthStepper({
  value,
  max,
  onChange,
}: {
  value: string;
  max: string;
  onChange: (month: string) => void;
}) {
  const theme = useTheme();
  const atMax = value >= max;
  const step = (label: string, glyph: string, delta: number, enabled: boolean) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !enabled }}
      disabled={!enabled}
      onPress={() => onChange(shiftMonth(value, delta))}
      style={[styles.arrow, { opacity: enabled ? 1 : 0.3 }]}
    >
      <AppText size="title" style={{ color: theme.primary }}>
        {glyph}
      </AppText>
    </Pressable>
  );
  return (
    <View style={styles.row} accessibilityLabel={formatMonth(value)}>
      {step('Previous month', '‹', -1, true)}
      <AppText size="title" bold>
        {formatMonth(value)}
      </AppText>
      {step('Next month', '›', 1, !atMax)}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  arrow: {
    minWidth: TOUCH_TARGET,
    minHeight: TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
