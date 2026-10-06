import { StyleSheet, Switch, View } from 'react-native';
import {
  useNotificationSettings,
  useUpdateNotificationSettings,
} from '../../hooks/use-notifications';
import { AppText, Card, ErrorBanner } from '../ui';
import { useTheme } from '../../hooks/use-theme';
import { SPACING } from '../../constants/theme.constants';

export function NotificationsSection() {
  const theme = useTheme();
  const settings = useNotificationSettings();
  const update = useUpdateNotificationSettings();

  return (
    <Card label="Notifications">
      <View style={styles.row}>
        <View style={styles.grow}>
          <AppText bold>Email me budget alerts</AppText>
          <AppText size="small" tone="muted">
            Alerts always appear under the bell. This also sends them by email.
          </AppText>
        </View>
        <Switch
          accessibilityLabel="Email me budget alerts"
          value={settings.data?.budgetAlertEmail ?? true}
          disabled={!settings.data || update.isPending}
          onValueChange={(v) => update.mutate({ budgetAlertEmail: v })}
          trackColor={{ true: theme.primary }}
        />
      </View>
      {(settings.isError || update.isError) && (
        <ErrorBanner error={settings.error ?? update.error} />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  grow: { flex: 1, gap: 2 },
});
