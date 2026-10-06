import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  NOTIFICATIONS_POLL_MS,
  QUERY_KEYS,
  type NotificationSettings,
} from '@rahulreddy05/spendly-shared';
import { useApi } from '../services/app-services';

/** Checks every minute while the app is open, and when it comes back to the foreground. */
export function useNotifications() {
  const api = useApi();
  return useQuery({
    queryKey: QUERY_KEYS.notifications,
    queryFn: () => api.notifications.list(),
    refetchInterval: NOTIFICATIONS_POLL_MS,
    refetchOnWindowFocus: true,
  });
}

export function useMarkNotificationRead() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.notifications.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications }),
  });
}

export function useMarkAllNotificationsRead() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.notifications.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications }),
  });
}

export function useNotificationSettings() {
  const api = useApi();
  return useQuery({
    queryKey: QUERY_KEYS.notificationSettings,
    queryFn: api.notifications.settings,
  });
}

export function useUpdateNotificationSettings() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<NotificationSettings>) => api.notifications.updateSettings(input),
    onSuccess: (settings) => queryClient.setQueryData(QUERY_KEYS.notificationSettings, settings),
  });
}
