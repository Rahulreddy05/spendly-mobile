import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from './ui';
import { useTheme } from '../hooks/use-theme';
import { SPACING } from '../constants/theme.constants';

/** Blocking screen when the API rejects this app version (HTTP 426). */
export function UpgradeRequired({ minVersion }: { minVersion?: string }) {
  const theme = useTheme();
  return (
    <SafeAreaView style={[styles.fill, { backgroundColor: theme.background }]}>
      <View style={styles.body} accessibilityRole="alert">
        <AppText size="headline" bold accessibilityRole="header">
          Update Pennypath
        </AppText>
        <AppText tone="muted">
          This version of the app is no longer supported
          {minVersion ? ` — version ${minVersion} or newer is required` : ''}. Please update from
          the App Store or Google Play to keep using Pennypath.
        </AppText>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  body: { flex: 1, justifyContent: 'center', padding: SPACING.xl, gap: SPACING.md },
});
