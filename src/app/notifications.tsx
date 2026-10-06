import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { formatDateTime, type AppNotification } from '@rahulreddy05/spendly-shared';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '../hooks/use-notifications';
import { Screen } from '../components/Screen';
import { AppText, Button, ErrorBanner, LoadingView, Notice } from '../components/ui';
import { useTheme } from '../hooks/use-theme';
import { ROUTES } from '../constants/navigation.constants';
import { RADIUS, SPACING } from '../constants/theme.constants';

export default function NotificationsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const notifications = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const items = notifications.data?.items ?? [];
  const unread = notifications.data?.unreadCount ?? 0;

  /** Budget alerts open the budgets tab on their month. */
  const open = (n: AppNotification) => {
    if (!n.readAt) markRead.mutate(n.id);
    const month = typeof n.data?.month === 'string' ? n.data.month : undefined;
    router.navigate({ pathname: ROUTES.BUDGETS, params: month ? { month } : {} });
  };

  return (
    <Screen refreshing={notifications.isRefetching} onRefresh={() => void notifications.refetch()}>
      {unread > 0 && (
        <Button
          title="Mark all as read"
          variant="secondary"
          onPress={() => markAll.mutate()}
          loading={markAll.isPending}
        />
      )}
      {notifications.isLoading && <LoadingView label="Loading notifications" />}
      {notifications.isError && <ErrorBanner error={notifications.error} />}
      {notifications.isSuccess && items.length === 0 && (
        <Notice>No notifications yet. Budget alerts will show up here.</Notice>
      )}
      {items.map((n) => (
        <Pressable
          key={n.id}
          accessibilityRole="button"
          accessibilityLabel={`${n.readAt ? '' : 'Unread. '}${n.title}. ${n.body}`}
          onPress={() => open(n)}
          style={[
            styles.item,
            {
              borderColor: theme.border,
              backgroundColor: n.readAt ? theme.surface : theme.surfaceMuted,
            },
          ]}
        >
          <View style={styles.titleRow}>
            {!n.readAt && <View style={[styles.dot, { backgroundColor: theme.primary }]} />}
            <AppText bold>{n.title}</AppText>
          </View>
          <AppText size="small" tone="muted">
            {n.body}
          </AppText>
          <AppText size="caption" tone="muted">
            {formatDateTime(n.createdAt)}
          </AppText>
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  item: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    gap: SPACING.xs,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  dot: { width: 8, height: 8, borderRadius: RADIUS.pill },
});
