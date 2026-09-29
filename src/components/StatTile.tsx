import { StyleSheet, View } from 'react-native';
import { AppText } from './ui';
import { useTheme } from '../hooks/use-theme';
import { RADIUS, SPACING } from '../constants/theme.constants';

export function StatTile({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: 'income' | 'expense' }) {
  const theme = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}${hint ? `, ${hint}` : ''}`}
      style={[styles.tile, { backgroundColor: theme.surface, borderColor: theme.border }]}
    >
      <AppText size="small" tone="muted">
        {label}
      </AppText>
      <AppText size="title" bold tone={tone ?? 'default'}>
        {value}
      </AppText>
      {hint ? (
        <AppText size="caption" tone="muted">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { flexBasis: '47%', flexGrow: 1, borderWidth: StyleSheet.hairlineWidth, borderRadius: RADIUS.md, padding: SPACING.md, gap: 2 },
});
