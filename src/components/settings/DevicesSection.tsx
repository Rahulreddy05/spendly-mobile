import { StyleSheet, View } from 'react-native';
import { formatDateTime } from '@rahulreddy05/spendly-shared';
import { useRevokeOtherSessions, useRevokeSession, useSessions } from '../../hooks/use-security';
import { AppText, Button, Card, ErrorBanner, LoadingView } from '../ui';
import { useTheme } from '../../hooks/use-theme';
import { SPACING } from '../../constants/theme.constants';

export function DevicesSection() {
  const theme = useTheme();
  const sessions = useSessions();
  const revoke = useRevokeSession();
  const revokeOthers = useRevokeOtherSessions();
  const others = (sessions.data ?? []).filter((s) => !s.current);

  return (
    <Card label="Signed-in devices">
      <AppText bold accessibilityRole="header">
        Signed-in devices
      </AppText>
      {sessions.isLoading && <LoadingView label="Loading devices" />}
      {sessions.isError && <ErrorBanner error={sessions.error} />}
      {(sessions.data ?? []).map((s) => (
        <View key={s.id} style={[styles.row, { borderBottomColor: theme.border }]}>
          <View style={styles.grow}>
            <AppText bold>
              {s.deviceName}
              {s.current ? <AppText tone="income"> · This device</AppText> : null}
            </AppText>
            <AppText size="small" tone="muted">
              Last active {formatDateTime(s.lastUsedAt)}
              {s.ipAddress ? ` · IP ${s.ipAddress}` : ''}
            </AppText>
          </View>
          {!s.current && (
            <Button title="Sign out" variant="danger" onPress={() => revoke.mutate(s.id)} />
          )}
        </View>
      ))}
      {others.length > 0 && (
        <Button
          title="Sign out of all other devices"
          variant="secondary"
          onPress={() => revokeOthers.mutate()}
          loading={revokeOthers.isPending}
        />
      )}
      {(revoke.isError || revokeOthers.isError) && (
        <ErrorBanner error={revoke.error ?? revokeOthers.error} />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  grow: { flex: 1, gap: 2 },
});
