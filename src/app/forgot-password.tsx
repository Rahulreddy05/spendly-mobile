import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { EMAIL_CODE_DIGITS, FIELD_LIMITS } from '@rahulreddy05/spendly-shared';
import { useApi } from '../services/app-services';
import { useTheme } from '../hooks/use-theme';
import { AppText, Button, ErrorBanner, Notice, TextField } from '../components/ui';
import { SPACING } from '../constants/theme.constants';

type Step = 'request' | 'reset' | 'done';

/** Request a code by email, then set a new password with it. */
export default function ForgotPasswordScreen() {
  const api = useApi();
  const theme = useTheme();
  const [step, setStep] = useState<Step>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<unknown>(null);
  const [pending, setPending] = useState(false);

  const run = async (action: () => Promise<void>) => {
    setError(null);
    setPending(true);
    try {
      await action();
    } catch (err) {
      setError(err);
    } finally {
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
          <AppText size="headline" bold accessibilityRole="header">
            Reset your password
          </AppText>
          {step === 'request' && (
            <>
              <AppText tone="muted">Enter your email and we&apos;ll send you a code.</AppText>
              <TextField
                label="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
              {error !== null && <ErrorBanner error={error} />}
              <Button
                title="Send code"
                loading={pending}
                disabled={!email.trim()}
                onPress={() =>
                  void run(async () => {
                    await api.auth.forgotPassword(email.trim());
                    setStep('reset');
                  })
                }
              />
            </>
          )}
          {step === 'reset' && (
            <>
              <AppText tone="muted">
                If an account exists for {email.trim()}, we&apos;ve emailed it a {EMAIL_CODE_DIGITS}
                -digit code.
              </AppText>
              <TextField
                label="Code"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                maxLength={EMAIL_CODE_DIGITS}
              />
              <TextField
                label="New password"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                textContentType="newPassword"
                placeholder={`At least ${FIELD_LIMITS.PASSWORD_MIN} characters`}
              />
              {error !== null && <ErrorBanner error={error} />}
              <Button
                title="Set new password"
                loading={pending}
                disabled={
                  code.trim().length !== EMAIL_CODE_DIGITS ||
                  newPassword.length < FIELD_LIMITS.PASSWORD_MIN
                }
                onPress={() =>
                  void run(async () => {
                    await api.auth.resetPassword({
                      email: email.trim(),
                      code: code.trim(),
                      newPassword,
                    });
                    setStep('done');
                  })
                }
              />
            </>
          )}
          {step === 'done' && (
            <Notice>
              Your password has been changed and you&apos;ve been signed out everywhere. Sign in
              with your new password.
            </Notice>
          )}
          <Link href="/login" replace>
            <AppText style={{ color: theme.primary, fontWeight: '600' }}>Back to sign in</AppText>
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  body: { padding: SPACING.xl, gap: SPACING.lg, flexGrow: 1, justifyContent: 'center' },
});
