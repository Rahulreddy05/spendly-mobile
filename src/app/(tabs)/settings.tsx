import { useState } from 'react';
import { Alert, Modal, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Application from 'expo-application';
import { useAuth } from '../../auth/auth-context';
import { useTheme } from '../../hooks/use-theme';
import { Screen } from '../../components/Screen';
import { AppText, Button, Card, ErrorBanner, TextField } from '../../components/ui';
import { FALLBACK_APP_VERSION } from '../../constants/app.constants';
import { SPACING } from '../../constants/theme.constants';

/** Password-confirmed permanent deletion — required by the App Store and Play Store. */
function DeleteAccountModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { deleteAccount } = useAuth();
  const theme = useTheme();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<unknown>(null);
  const [pending, setPending] = useState(false);

  const confirm = async () => {
    setError(null);
    setPending(true);
    try {
      await deleteAccount(password);
    } catch (err) {
      setError(err);
      setPending(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.modal, { backgroundColor: theme.background }]}>
        <AppText size="title" bold accessibilityRole="header">
          Delete your account
        </AppText>
        <AppText tone="muted">
          This permanently deletes your Spendly account, your accounts and every transaction, and
          disconnects any linked banks. It cannot be undone.
        </AppText>
        <TextField
          label="Enter your password to confirm"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="current-password"
        />
        {error !== null && <ErrorBanner error={error} />}
        <Button title="Delete permanently" variant="danger" onPress={() => void confirm()} loading={pending} disabled={!password} />
        <Button title="Cancel" variant="secondary" onPress={onClose} disabled={pending} />
      </SafeAreaView>
    </Modal>
  );
}

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const version = Application.nativeApplicationVersion ?? FALLBACK_APP_VERSION;

  const confirmSignOut = () =>
    Alert.alert('Sign out?', 'You will need to sign in again to see your money.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => void logout() },
    ]);

  return (
    <Screen>
      <Card label="Profile">
        <AppText bold>{user?.displayName ?? 'Signed in'}</AppText>
        <AppText tone="muted">{user?.email}</AppText>
      </Card>
      <View style={styles.actions}>
        <Button title="Sign out" variant="secondary" onPress={confirmSignOut} />
        <Button title="Delete account" variant="danger" onPress={() => setDeleting(true)} />
      </View>
      <AppText size="caption" tone="muted">
        Spendly {version}
      </AppText>
      <DeleteAccountModal visible={deleting} onClose={() => setDeleting(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: { gap: SPACING.md },
  modal: { flex: 1, padding: SPACING.xl, gap: SPACING.lg },
});
