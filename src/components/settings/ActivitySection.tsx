import { View } from 'react-native';
import {
  SECURITY_EVENT_LABEL,
  WARNING_SECURITY_EVENTS,
  formatDate,
} from '@rahulreddy05/spendly-shared';
import { useSecurityEvents } from '../../hooks/use-security';
import { AppText, Card, ErrorBanner, LoadingView } from '../ui';

const SHOWN_EVENTS = 10;

export function ActivitySection() {
  const events = useSecurityEvents();
  return (
    <Card label="Security activity">
      <AppText bold accessibilityRole="header">
        Recent security activity
      </AppText>
      {events.isLoading && <LoadingView label="Loading activity" />}
      {events.isError && <ErrorBanner error={events.error} />}
      {(events.data ?? []).slice(0, SHOWN_EVENTS).map((e) => (
        <View key={e.id}>
          <AppText tone={WARNING_SECURITY_EVENTS.includes(e.type) ? 'expense' : 'default'}>
            {SECURITY_EVENT_LABEL[e.type]}
          </AppText>
          <AppText size="small" tone="muted">
            {formatDate(e.createdAt)}
            {e.deviceName ? ` · ${e.deviceName}` : ''}
          </AppText>
        </View>
      ))}
    </Card>
  );
}
