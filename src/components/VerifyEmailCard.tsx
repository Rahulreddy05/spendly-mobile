import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { EMAIL_CODE_DIGITS } from '@rahulreddy05/spendly-shared';
import { useApi } from '../services/app-services';
import { useAuth } from '../auth/auth-context';
import { AppText, Button, Card, ErrorBanner, TextField } from './ui';
import { SPACING } from '../constants/theme.constants';

/** Shown until the email address is verified (bank linking needs it). */
export function VerifyEmailCard() {
  const api = useApi();
  const { user, refreshUser } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState<unknown>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (!user || user.emailVerified) return null;

  const verify = async () => {
    setError(null);
    try {
      await api.auth.verifyEmail(code.trim());
      await refreshUser();
    } catch (err) {
      setError(err);
    }
  };

  const resend = async () => {
    setError(null);
    try {
      await api.auth.resendVerification();
      setNotice(`We sent a new code to ${user.email}.`);
    } catch (err) {
      setError(err);
    }
  };

  return (
    <Card label="Verify your email">
      <AppText bold accessibilityRole="header">
        Verify your email
      </AppText>
      <AppText tone="muted">
        Enter the {EMAIL_CODE_DIGITS}-digit code we sent to {user.email}.
      </AppText>
      <TextField
        label="Verification code"
        value={code}
        onChangeText={setCode}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        maxLength={EMAIL_CODE_DIGITS}
      />
      <View style={styles.row}>
        <View style={styles.grow}>
          <Button
            title="Verify"
            onPress={() => void verify()}
            disabled={code.trim().length !== EMAIL_CODE_DIGITS}
          />
        </View>
        <View style={styles.grow}>
          <Button title="Resend code" variant="secondary" onPress={() => void resend()} />
        </View>
      </View>
      {notice && <AppText tone="muted">{notice}</AppText>}
      {error !== null && <ErrorBanner error={error} />}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: SPACING.sm },
  grow: { flex: 1 },
});
