import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
} from 'react-native';
import { errorMessage } from '@rahulreddy05/spendly-shared';
import { useTheme } from '../hooks/use-theme';
import { FONT_SIZE, RADIUS, SPACING, TOUCH_TARGET } from '../constants/theme.constants';

/** Small set of themed primitives every screen builds on. */

type Tone = 'default' | 'muted' | 'income' | 'expense' | 'danger';

export function AppText({
  children,
  size = 'body',
  tone = 'default',
  bold = false,
  style,
  ...rest
}: {
  children: ReactNode;
  size?: keyof typeof FONT_SIZE;
  tone?: Tone;
  bold?: boolean;
  style?: StyleProp<TextStyle>;
  accessibilityRole?: 'header' | 'text';
  accessibilityLabel?: string;
  numberOfLines?: number;
  /** Long-press to copy (setup keys, recovery codes). */
  selectable?: boolean;
}) {
  const theme = useTheme();
  const color = {
    default: theme.text,
    muted: theme.textMuted,
    income: theme.income,
    expense: theme.expense,
    danger: theme.danger,
  }[tone];
  return (
    <Text
      style={[
        {
          color,
          fontSize: FONT_SIZE[size],
          fontWeight: bold ? '700' : '400',
          fontVariant: ['tabular-nums'],
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}

export function Card({ children, label }: { children: ReactNode; label?: string }) {
  const theme = useTheme();
  return (
    <View
      accessibilityLabel={label}
      style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
    >
      {children}
    </View>
  );
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  loading?: boolean;
}) {
  const theme = useTheme();
  const bg = variant === 'primary' ? theme.primary : theme.surface;
  const fg =
    variant === 'primary' ? theme.onPrimary : variant === 'danger' ? theme.danger : theme.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, borderColor: theme.border, opacity: pressed || disabled ? 0.7 : 1 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text style={[styles.buttonText, { color: fg }]}>{title}</Text>
      )}
    </Pressable>
  );
}

export function TextField({
  label,
  error,
  ...input
}: TextInputProps & { label: string; error?: string | null }) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      <AppText size="small" bold>
        {label}
      </AppText>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={theme.textMuted}
        style={[
          styles.input,
          {
            borderColor: error ? theme.danger : theme.border,
            color: theme.text,
            backgroundColor: theme.surface,
          },
        ]}
        {...input}
      />
      {error ? (
        <AppText size="small" tone="danger">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

export function ErrorBanner({ error }: { error: unknown }) {
  const theme = useTheme();
  return (
    <View accessibilityRole="alert" style={[styles.banner, { borderColor: theme.danger }]}>
      <AppText tone="danger">{errorMessage(error)}</AppText>
    </View>
  );
}

export function Notice({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return (
    <View
      style={[styles.banner, { borderColor: theme.border, backgroundColor: theme.surfaceMuted }]}
    >
      <AppText tone="muted">{children}</AppText>
    </View>
  );
}

export function LoadingView({ label = 'Loading' }: { label?: string }) {
  const theme = useTheme();
  return (
    <View style={styles.center} accessibilityLabel={label} accessibilityRole="progressbar">
      <ActivityIndicator color={theme.primary} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  button: {
    minHeight: TOUCH_TARGET,
    borderRadius: RADIUS.sm,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  buttonText: { fontSize: FONT_SIZE.body, fontWeight: '600' },
  field: { gap: SPACING.xs },
  input: {
    minHeight: TOUCH_TARGET,
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    fontSize: FONT_SIZE.body,
  },
  banner: { borderWidth: 1, borderRadius: RADIUS.sm, padding: SPACING.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xxl },
});
