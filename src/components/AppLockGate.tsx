import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { APP_NAME } from '@rahulreddy05/spendly-shared';
import { useAppServices } from '../services/app-services';
import { useAuth } from '../auth/auth-context';
import { useTheme } from '../hooks/use-theme';
import { AppText, Button } from './ui';
import { BIOMETRIC_FALLBACK_LABEL } from '../services/biometrics';
import { APP_LOCK_AFTER_BACKGROUND_MS } from '../constants/app.constants';
import { SPACING } from '../constants/theme.constants';

interface LockProps {
  children: ReactNode;
  /** Time in the background before re-locking. Injectable for tests. */
  lockAfterMs?: number;
}

/**
 * When the user has turned on biometric unlock, the app opens locked and
 * re-locks after a minute in the background. Unlocking uses Face ID / Touch ID
 * / fingerprint, with the device passcode as fallback.
 */
export function AppLockGate(props: LockProps) {
  const { status, user } = useAuth();
  if (status !== 'authenticated' || !user) return <>{props.children}</>;
  // A fresh lock per signed-in user: it starts undecided, so protected content
  // never flashes on screen before the lock check finishes.
  return <SessionLock key={user.id} {...props} />;
}

function SessionLock({ children, lockAfterMs = APP_LOCK_AFTER_BACKGROUND_MS }: LockProps) {
  const { biometrics, preferences } = useAppServices();
  const { logout } = useAuth();
  const theme = useTheme();
  const [locked, setLocked] = useState<boolean | null>(null);
  const [label, setLabel] = useState(BIOMETRIC_FALLBACK_LABEL);
  const backgroundedAt = useRef<number | null>(null);

  const unlock = useCallback(async () => {
    if (await biometrics.authenticate(`Unlock ${APP_NAME}`)) setLocked(false);
  }, [biometrics]);

  useEffect(() => {
    let active = true;
    void Promise.all([preferences.biometricLock(), biometrics.support()]).then(
      ([enabled, support]) => {
        if (!active) return;
        setLabel(support.label);
        const shouldLock = enabled && support.available;
        setLocked(shouldLock);
        if (shouldLock) void unlock();
      },
    );
    return () => {
      active = false;
    };
  }, [preferences, biometrics, unlock]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background') backgroundedAt.current = Date.now();
      if (state === 'active' && backgroundedAt.current !== null) {
        const away = Date.now() - backgroundedAt.current;
        backgroundedAt.current = null;
        if (away < lockAfterMs) return;
        void Promise.all([preferences.biometricLock(), biometrics.support()]).then(
          ([enabled, support]) => {
            if (enabled && support.available) {
              setLocked(true);
              void unlock();
            }
          },
        );
      }
    });
    return () => sub.remove();
  }, [preferences, biometrics, unlock, lockAfterMs]);

  if (locked === false) return <>{children}</>;
  if (locked === null) return null;

  return (
    <SafeAreaView style={[styles.fill, { backgroundColor: theme.background }]}>
      <View style={styles.body} accessibilityRole="alert">
        <AppText size="headline" bold accessibilityRole="header">
          {APP_NAME} is locked
        </AppText>
        <AppText tone="muted">Use {label} to unlock.</AppText>
        <Button title={`Unlock with ${label}`} onPress={() => void unlock()} />
        <Button title="Sign out" variant="secondary" onPress={() => void logout()} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  body: { flex: 1, justifyContent: 'center', padding: SPACING.xl, gap: SPACING.md },
});
