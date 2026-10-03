import { useCallback, useRef, useState, type ReactNode } from 'react';
import { Modal, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { SecondFactor } from '@rahulreddy05/spendly-shared';
import { useApi } from '../services/app-services';
import { useAuth } from './auth-context';
import { ReauthContext } from './reauth-context';
import { useTheme } from '../hooks/use-theme';
import { AppText, Button, ErrorBanner, TextField } from '../components/ui';
import { SecondFactorInput } from '../components/SecondFactorInput';
import { SPACING } from '../constants/theme.constants';

/** Hosts the password-confirmation sheet used before sensitive actions. */
export function ReauthProvider({ children }: { children: ReactNode }) {
  const api = useApi();
  const theme = useTheme();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [factor, setFactor] = useState<SecondFactor | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [pending, setPending] = useState(false);
  const resolver = useRef<((ok: boolean) => void) | null>(null);

  const requestReauth = useCallback(
    () =>
      new Promise<boolean>((resolve) => {
        resolver.current = resolve;
        setPassword('');
        setFactor(null);
        setError(null);
        setOpen(true);
      }),
    [],
  );

  const close = (ok: boolean) => {
    setOpen(false);
    resolver.current?.(ok);
    resolver.current = null;
  };

  const confirm = async () => {
    setPending(true);
    setError(null);
    try {
      await api.auth.reauthenticate(password, factor ?? undefined);
      close(true);
    } catch (err) {
      setError(err);
    } finally {
      setPending(false);
    }
  };

  return (
    <ReauthContext.Provider value={requestReauth}>
      {children}
      <Modal
        visible={open}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => close(false)}
      >
        <SafeAreaView style={[styles.sheet, { backgroundColor: theme.background }]}>
          <AppText size="title" bold accessibilityRole="header">
            Confirm it&apos;s you
          </AppText>
          <AppText tone="muted">For your security, enter your password to continue.</AppText>
          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="current-password"
          />
          {user?.mfaEnabled && <SecondFactorInput onChange={setFactor} />}
          {error !== null && <ErrorBanner error={error} />}
          <Button
            title="Confirm"
            onPress={() => void confirm()}
            loading={pending}
            disabled={!password || Boolean(user?.mfaEnabled && !factor)}
          />
          <Button
            title="Cancel"
            variant="secondary"
            onPress={() => close(false)}
            disabled={pending}
          />
        </SafeAreaView>
      </Modal>
    </ReauthContext.Provider>
  );
}

const styles = StyleSheet.create({ sheet: { flex: 1, padding: SPACING.xl, gap: SPACING.lg } });
