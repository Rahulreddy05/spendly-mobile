import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNotifications } from '../hooks/use-notifications';
import { useTheme } from '../hooks/use-theme';
import { AppText } from './ui';
import { ROUTES } from '../constants/navigation.constants';
import { RADIUS, SPACING, TOUCH_TARGET } from '../constants/theme.constants';

const MAX_BADGE = 9;
const ICON_SIZE = 24;

/** Bell in every tab's header, with the unread count. */
export function NotificationBellButton() {
  const theme = useTheme();
  const router = useRouter();
  const unread = useNotifications().data?.unreadCount ?? 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={unread ? `Notifications, ${unread} unread` : 'Notifications'}
      onPress={() => router.push(ROUTES.NOTIFICATIONS)}
      style={styles.button}
    >
      <Ionicons name="notifications-outline" size={ICON_SIZE} color={theme.text} />
      {unread > 0 && (
        <View style={[styles.badge, { backgroundColor: theme.expense }]}>
          <AppText size="caption" bold style={{ color: '#fff' }}>
            {unread > MAX_BADGE ? `${MAX_BADGE}+` : String(unread)}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: TOUCH_TARGET,
    minHeight: TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
