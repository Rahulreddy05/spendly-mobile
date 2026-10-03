import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { APP_NAME, FIELD_LIMITS, type SecondFactor } from '@rahulreddy05/spendly-shared';
import { useAuth } from '../auth/auth-context';
import { useTheme } from '../hooks/use-theme';
import { AppText, Button, ErrorBanner, TextField } from './ui';
import { SecondFactorInput } from './SecondFactorInput';
import { SPACING } from '../constants/theme.constants';

/** Second step of a 2FA sign-in. */
function MfaStep({ mfaToken, onCancel }: { mfaToken: string; onCancel: () => void }) {
  const { completeMfa } = useAuth();
  const [factor, setFactor] = useState<SecondFactor | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [pending, setPending] = useState(false);

  const verify = async () => {
    if (!factor) return;
    setError(null);
    setPending(true);
    try {
      await completeMfa(mfaToken, factor);
    } catch (err) {
      setError(err);
      setPending(false);
    }
  };

  return (
    <>
      <AppText size="headline" bold accessibilityRole="header">
        Two-factor authentication
      </AppText>
      <AppText tone="muted">Enter the 6-digit code from your authenticator app.</AppText>
      <SecondFactorInput onChange={setFactor} />
      {error !== null && <ErrorBanner error={error} />}
      <Button title="Verify" onPress={() => void verify()} loading={pending} disabled={!factor} />
      <Button title="Back to sign in" variant="secondary" onPress={onCancel} disabled={pending} />
    </>
  );
}

/** Sign in / create account. The root navigator switches screens once signed in. */
export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const { login, register } = useAuth();
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<unknown>(null);
  const [pending, setPending] = useState(false);
  const isLogin = mode === 'login';

  const submit = async () => {
    setError(null);
    setPending(true);
    try {
      if (isLogin) {
        const outcome = await login(email.trim(), password);
        if (outcome.status === 'mfa-required') {
          setMfaToken(outcome.mfaToken);
          setPending(false);
        }
      } else {
        await register(email.trim(), password, displayName.trim() || undefined);
      }
    } catch (err) {
      setError(err);
      setPending(false);
    }
  };

  return (
    <SafeAreaView style={[styles.fill, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {mfaToken ? (
            <MfaStep mfaToken={mfaToken} onCancel={() => setMfaToken(null)} />
          ) : (
            <>
              <AppText size="headline" bold accessibilityRole="header">
                {isLogin ? `Sign in to ${APP_NAME}` : `Create your ${APP_NAME} account`}
              </AppText>
              <AppText tone="muted">See where your money comes from and where it goes.</AppText>

              {!isLogin && (
                <TextField
                  label="Name (optional)"
                  value={displayName}
                  onChangeText={setDisplayName}
                  autoComplete="name"
                />
              )}
              <TextField
                label="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                textContentType="emailAddress"
              />
              <TextField
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                textContentType={isLogin ? 'password' : 'newPassword'}
                {...(!isLogin
                  ? { placeholder: `At least ${FIELD_LIMITS.PASSWORD_MIN} characters` }
                  : {})}
              />
              {error !== null && <ErrorBanner error={error} />}
              <Button
                title={isLogin ? 'Sign in' : 'Create account'}
                onPress={() => void submit()}
                loading={pending}
                disabled={!email || !password}
              />
              {isLogin && (
                <Link href="/forgot-password">
                  <AppText style={{ color: theme.primary, fontWeight: '600' }}>
                    Forgot your password?
                  </AppText>
                </Link>
              )}
              <View style={styles.switch}>
                <AppText tone="muted">{isLogin ? 'New here?' : 'Already have an account?'}</AppText>
                <Link href={isLogin ? '/register' : '/login'} replace>
                  <AppText style={{ color: theme.primary, fontWeight: '600' }}>
                    {isLogin ? 'Create an account' : 'Sign in'}
                  </AppText>
                </Link>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  body: { padding: SPACING.xl, gap: SPACING.lg, flexGrow: 1, justifyContent: 'center' },
  switch: { flexDirection: 'row', gap: SPACING.xs, justifyContent: 'center' },
});
