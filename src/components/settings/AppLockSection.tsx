import { useEffect, useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import { useAppServices } from '../../services/app-services';
import type { BiometricSupport } from '../../services/biometrics';
import { AppText, Card } from '../ui';
import { useTheme } from '../../hooks/use-theme';
import { SPACING } from '../../constants/theme.constants';

/** Turn Face ID / fingerprint unlock on or off (confirming with it first). */
export function AppLockSection() {
  const { biometrics, preferences } = useAppServices();
  const theme = useTheme();
  const [support, setSupport] = useState<BiometricSupport | null>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    void Promise.all([biometrics.support(), preferences.biometricLock()]).then(([s, e]) => {
      setSupport(s);
      setEnabled(e);
    });
  }, [biometrics, preferences]);

  if (!support) return null;

  const toggle = async (next: boolean) => {
    // Prove the biometric works before relying on it to get back in.
    if (next && !(await biometrics.authenticate(`Turn on ${support.label}`))) return;
    await preferences.setBiometricLock(next);
    setEnabled(next);
  };

  return (
    <Card label="App lock">
      <View style={styles.row}>
        <View style={styles.grow}>
          <AppText bold>Unlock with {support.label}</AppText>
          <AppText size="small" tone="muted">
            {support.available
              ? `Ask for ${support.label} when you open the app.`
              : `Set up ${support.label} on this device to use it here.`}
          </AppText>
        </View>
        <Switch
          accessibilityLabel={`Unlock with ${support.label}`}
          value={enabled}
          onValueChange={(v) => void toggle(v)}
          disabled={!support.available}
          trackColor={{ true: theme.primary }}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  grow: { flex: 1, gap: 2 },
});
