import { useState } from 'react';
import { FIELD_LIMITS } from '@rahulreddy05/spendly-shared';
import { useApi } from '../../services/app-services';
import { useInvalidateSecurity } from '../../hooks/use-security';
import { AppText, Button, Card, ErrorBanner, Notice, TextField } from '../ui';

export function ChangePasswordSection() {
  const api = useApi();
  const invalidate = useInvalidateSecurity();
  const [currentPassword, setCurrent] = useState('');
  const [newPassword, setNew] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<unknown>(null);
  const [done, setDone] = useState(false);
  const mismatch = confirm.length > 0 && confirm !== newPassword;

  const submit = async () => {
    setError(null);
    setDone(false);
    try {
      await api.auth.changePassword({ currentPassword, newPassword });
      setCurrent('');
      setNew('');
      setConfirm('');
      setDone(true);
      void invalidate();
    } catch (err) {
      setError(err);
    }
  };

  return (
    <Card label="Change password">
      <AppText bold accessibilityRole="header">
        Password
      </AppText>
      <TextField
        label="Current password"
        value={currentPassword}
        onChangeText={setCurrent}
        secureTextEntry
        autoComplete="current-password"
      />
      <TextField
        label="New password"
        value={newPassword}
        onChangeText={setNew}
        secureTextEntry
        autoComplete="new-password"
        placeholder={`At least ${FIELD_LIMITS.PASSWORD_MIN} characters`}
      />
      <TextField
        label="Confirm new password"
        value={confirm}
        onChangeText={setConfirm}
        secureTextEntry
        autoComplete="new-password"
        error={mismatch ? "The new passwords don't match." : null}
      />
      {error !== null && <ErrorBanner error={error} />}
      {done && <Notice>Password changed. Your other devices were signed out.</Notice>}
      <Button
        title="Change password"
        onPress={() => void submit()}
        disabled={
          !currentPassword || newPassword.length < FIELD_LIMITS.PASSWORD_MIN || mismatch || !confirm
        }
      />
    </Card>
  );
}
