import { useState } from 'react';
import { Linking, Share, StyleSheet, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import {
  RECOVERY_CODE_COUNT,
  TOTP_CODE_DIGITS,
  withReauth,
  type SecondFactor,
  type TotpSetup,
} from '@rahulreddy05/spendly-shared';
import { useApi } from '../../services/app-services';
import { useAuth } from '../../auth/auth-context';
import { useRequestReauth } from '../../auth/reauth-context';
import { useInvalidateSecurity, useMfaStatus } from '../../hooks/use-security';
import { AppText, Button, Card, ErrorBanner, LoadingView, Notice, TextField } from '../ui';
import { SecondFactorInput } from '../SecondFactorInput';
import { useTheme } from '../../hooks/use-theme';
import { RADIUS, SPACING } from '../../constants/theme.constants';

type Mode = 'idle' | 'setup' | 'codes' | 'disable';

export function TwoFactorSection() {
  const api = useApi();
  const theme = useTheme();
  const { refreshUser } = useAuth();
  const requestReauth = useRequestReauth();
  const invalidate = useInvalidateSecurity();
  const status = useMfaStatus();
  const [mode, setMode] = useState<Mode>('idle');
  const [setup, setSetup] = useState<TotpSetup | null>(null);
  const [code, setCode] = useState('');
  const [codes, setCodes] = useState<string[]>([]);
  const [password, setPassword] = useState('');
  const [factor, setFactor] = useState<SecondFactor | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const run = async (action: () => Promise<void>) => {
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err);
    }
  };

  const finish = () => {
    setMode('idle');
    setCodes([]);
    setSetup(null);
    setCopied(false);
  };

  return (
    <Card label="Two-factor authentication">
      <AppText bold accessibilityRole="header">
        Two-factor authentication
      </AppText>
      {status.isLoading && <LoadingView label="Loading" />}

      {status.data && mode === 'idle' && (
        <>
          {status.data.enabled ? (
            <>
              <AppText>
                <AppText tone="income" bold>
                  On.{' '}
                </AppText>
                Signing in needs a code from your authenticator app.{' '}
                {status.data.recoveryCodesRemaining} recovery codes left.
              </AppText>
              <Button
                title="New recovery codes"
                variant="secondary"
                onPress={() =>
                  void run(async () => {
                    setCodes(
                      await withReauth(requestReauth, () => api.security.regenerateRecoveryCodes()),
                    );
                    setMode('codes');
                    void invalidate();
                  })
                }
              />
              <Button title="Turn off" variant="danger" onPress={() => setMode('disable')} />
            </>
          ) : (
            <>
              <AppText tone="muted">
                Add a second step to signing in with an authenticator app. Even someone with your
                password can&apos;t get in without it.
              </AppText>
              <Button
                title="Turn on"
                onPress={() =>
                  void run(async () => {
                    setSetup(await withReauth(requestReauth, () => api.security.setupTotp()));
                    setCode('');
                    setMode('setup');
                  })
                }
              />
            </>
          )}
        </>
      )}

      {mode === 'setup' && setup && (
        <>
          <AppText>1. Add Spendly to your authenticator app.</AppText>
          <Button
            title="Open authenticator app"
            variant="secondary"
            onPress={() =>
              void Linking.openURL(setup.otpauthUrl).catch(() =>
                setError(new Error('No authenticator app found.')),
              )
            }
          />
          <AppText tone="muted">Or enter this key by hand:</AppText>
          <View style={[styles.secret, { backgroundColor: theme.surfaceMuted }]}>
            <AppText
              selectable
              style={styles.mono}
              accessibilityLabel={`Setup key ${setup.secret}`}
            >
              {setup.secret}
            </AppText>
          </View>
          <Button
            title={copied ? 'Copied' : 'Copy key'}
            variant="secondary"
            onPress={() => void Clipboard.setStringAsync(setup.secret).then(() => setCopied(true))}
          />
          <TextField
            label="2. Enter the 6-digit code it shows"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            maxLength={TOTP_CODE_DIGITS}
          />
          <Button
            title="Confirm and turn on"
            disabled={code.trim().length !== TOTP_CODE_DIGITS}
            onPress={() =>
              void run(async () => {
                setCodes(await api.security.confirmTotp(code.trim()));
                setMode('codes');
                await refreshUser();
                void invalidate();
              })
            }
          />
          <Button title="Cancel" variant="secondary" onPress={finish} />
        </>
      )}

      {mode === 'codes' && (
        <>
          <Notice>
            Save these {RECOVERY_CODE_COUNT} recovery codes somewhere safe. Each one signs you in
            once if you lose your phone. You won&apos;t see them again.
          </Notice>
          <View
            style={[styles.codes, { backgroundColor: theme.surfaceMuted }]}
            accessibilityLabel="Recovery codes"
          >
            {codes.map((c) => (
              <AppText key={c} selectable style={styles.mono}>
                {c}
              </AppText>
            ))}
          </View>
          <Button
            title="Share or save"
            variant="secondary"
            onPress={() =>
              void Share.share({ message: `Spendly recovery codes\n\n${codes.join('\n')}` })
            }
          />
          <Button title="I've saved them" onPress={finish} />
        </>
      )}

      {mode === 'disable' && (
        <>
          <AppText tone="muted">
            Confirm with your password and a code to turn two-factor authentication off.
          </AppText>
          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="current-password"
          />
          <SecondFactorInput onChange={setFactor} />
          <Button
            title="Turn off two-factor"
            variant="danger"
            disabled={!password || !factor}
            onPress={() =>
              void run(async () => {
                if (!factor) return;
                await api.security.disableMfa(password, factor);
                setPassword('');
                setMode('idle');
                await refreshUser();
                void invalidate();
              })
            }
          />
          <Button title="Cancel" variant="secondary" onPress={() => setMode('idle')} />
        </>
      )}
      {error !== null && <ErrorBanner error={error} />}
    </Card>
  );
}

const styles = StyleSheet.create({
  secret: { padding: SPACING.md, borderRadius: RADIUS.sm },
  codes: { padding: SPACING.md, borderRadius: RADIUS.sm, gap: SPACING.xs },
  mono: { fontFamily: 'Menlo', letterSpacing: 1 },
});
