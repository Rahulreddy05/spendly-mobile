import { Pressable, StyleSheet, View } from 'react-native';
import { YEAR_PICKER_SPAN } from '@rahulreddy05/spendly-shared';
import { AppText } from './ui';
import { useTheme } from '../hooks/use-theme';
import { SPACING, TOUCH_TARGET } from '../constants/theme.constants';

function StepButton({
  label,
  glyph,
  enabled,
  onPress,
}: {
  label: string;
  glyph: string;
  enabled: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !enabled }}
      disabled={!enabled}
      onPress={onPress}
      style={[styles.arrow, { opacity: enabled ? 1 : 0.3 }]}
    >
      <AppText size="title" style={{ color: theme.primary }}>
        {glyph}
      </AppText>
    </Pressable>
  );
}

/** ‹ 2026 › — steps through the last YEAR_PICKER_SPAN years. */
export function YearStepper({ value, onChange }: { value: number; onChange: (year: number) => void }) {
  const current = new Date().getFullYear();
  const min = current - YEAR_PICKER_SPAN + 1;

  return (
    <View style={styles.row} accessibilityLabel={`Year ${value}`}>
      <StepButton label="Previous year" glyph="‹" enabled={value > min} onPress={() => onChange(value - 1)} />
      <AppText size="title" bold>
        {value}
      </AppText>
      <StepButton label="Next year" glyph="›" enabled={value < current} onPress={() => onChange(value + 1)} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  arrow: { minWidth: TOUCH_TARGET, minHeight: TOUCH_TARGET, alignItems: 'center', justifyContent: 'center' },
});
