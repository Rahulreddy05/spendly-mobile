import { Alert, Linking, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react-native';
import { ApiError } from '@rahulreddy05/spendly-shared';
import SettingsScreen from './app/(tabs)/settings';
import {
  fakeApi,
  fakeBiometrics,
  fakePreferences,
  fakeServices,
  renderWithProviders,
} from './test/render';
import { session, user } from './test/fixtures';

jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn().mockResolvedValue(true) }));

const reauthRequired = () =>
  new ApiError(403, 'REAUTH_REQUIRED', 'Please confirm your password to continue.');
const withMfaUser = () => ({
  restoreSession: jest.fn().mockResolvedValue({ ...session, user: { ...user, mfaEnabled: true } }),
});

describe('two-factor authentication', () => {
  it('confirms the password, opens the authenticator, and shows recovery codes once', async () => {
    const setupTotp = jest.fn().mockRejectedValueOnce(reauthRequired()).mockResolvedValue({
      secret: 'JBSWY3DPEHPK3PXP',
      otpauthUrl: 'otpauth://totp/Pennypath:r?secret=JBSWY3DPEHPK3PXP',
    });
    const services = fakeServices({ api: fakeApi({ security: { setupTotp } }) });
    jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' });
    renderWithProviders(<SettingsScreen />, services);

    fireEvent.press(await screen.findByRole('button', { name: 'Turn on' }));
    // Re-authentication sheet appears, then the action is retried.
    fireEvent.changeText(await screen.findByLabelText('Password'), 'correct-horse-battery');
    fireEvent.press(screen.getByRole('button', { name: 'Confirm' }));
    expect(await screen.findByLabelText('Setup key JBSWY3DPEHPK3PXP')).toBeTruthy();
    expect(services.api.auth.reauthenticate).toHaveBeenCalledWith(
      'correct-horse-battery',
      undefined,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Open authenticator app' }));
    expect(Linking.openURL).toHaveBeenCalledWith(
      'otpauth://totp/Pennypath:r?secret=JBSWY3DPEHPK3PXP',
    );
    fireEvent.press(screen.getByRole('button', { name: 'Copy key' }));
    expect(await screen.findByRole('button', { name: 'Copied' })).toBeTruthy();
    expect(Clipboard.setStringAsync).toHaveBeenCalledWith('JBSWY3DPEHPK3PXP');

    fireEvent.changeText(screen.getByLabelText('2. Enter the 6-digit code it shows'), '123456');
    fireEvent.press(screen.getByRole('button', { name: 'Confirm and turn on' }));
    expect(await screen.findByText('AAAA-BBBB')).toBeTruthy();
    expect(screen.getByText('CCCC-DDDD')).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'Share or save' }));
    expect(Share.share).toHaveBeenCalledWith({ message: expect.stringContaining('AAAA-BBBB') });
    fireEvent.press(screen.getByRole('button', { name: "I've saved them" }));
    await waitFor(() => expect(screen.queryByText('AAAA-BBBB')).toBeNull());
  });

  it('turns off with the password and a code, and regenerates recovery codes', async () => {
    const services = fakeServices({
      api: fakeApi({
        auth: withMfaUser(),
        security: {
          mfaStatus: jest.fn().mockResolvedValue({ enabled: true, recoveryCodesRemaining: 4 }),
        },
      }),
    });
    renderWithProviders(<SettingsScreen />, services);
    const section = await screen.findByLabelText('Two-factor authentication');
    expect(await within(section).findByText(/4 recovery codes left/)).toBeTruthy();

    fireEvent.press(within(section).getByRole('button', { name: 'New recovery codes' }));
    expect(await within(section).findByText('EEEE-FFFF')).toBeTruthy();
    fireEvent.press(within(section).getByRole('button', { name: "I've saved them" }));

    fireEvent.press(await within(section).findByRole('button', { name: 'Turn off' }));
    fireEvent.changeText(within(section).getByLabelText('Password'), 'correct-horse-battery');
    fireEvent.changeText(within(section).getByLabelText('Authenticator code'), '654321');
    fireEvent.press(within(section).getByRole('button', { name: 'Turn off two-factor' }));
    await waitFor(() =>
      expect(services.api.security.disableMfa).toHaveBeenCalledWith('correct-horse-battery', {
        code: '654321',
      }),
    );
  });
});

describe('app lock', () => {
  it('needs a successful Face ID before turning on, and can be turned off', async () => {
    const biometrics = fakeBiometrics();
    const preferences = fakePreferences(false);
    renderWithProviders(<SettingsScreen />, fakeServices({ biometrics, preferences }));

    const toggle = await screen.findByLabelText('Unlock with Face ID');
    biometrics.config.succeed = false;
    await act(async () => fireEvent(toggle, 'valueChange', true));
    expect(preferences.setBiometricLock).not.toHaveBeenCalled();

    biometrics.config.succeed = true;
    await act(async () => fireEvent(toggle, 'valueChange', true));
    expect(preferences.setBiometricLock).toHaveBeenLastCalledWith(true);
    await act(async () => fireEvent(toggle, 'valueChange', false));
    expect(preferences.setBiometricLock).toHaveBeenLastCalledWith(false);
  });

  it('explains when biometrics are not set up', async () => {
    renderWithProviders(
      <SettingsScreen />,
      fakeServices({ biometrics: fakeBiometrics({ available: false, label: 'Touch ID' }) }),
    );
    expect(await screen.findByText('Set up Touch ID on this device to use it here.')).toBeTruthy();
  });
});

describe('password, devices, activity', () => {
  it('changes the password once the confirmation matches', async () => {
    const services = fakeServices();
    renderWithProviders(<SettingsScreen />, services);
    const section = await screen.findByLabelText('Change password');
    fireEvent.changeText(within(section).getByLabelText('Current password'), 'old-password-123');
    fireEvent.changeText(within(section).getByLabelText('New password'), 'a-new-passphrase-1');
    fireEvent.changeText(within(section).getByLabelText('Confirm new password'), 'different');
    expect(within(section).getByText("The new passwords don't match.")).toBeTruthy();

    fireEvent.changeText(
      within(section).getByLabelText('Confirm new password'),
      'a-new-passphrase-1',
    );
    fireEvent.press(within(section).getByRole('button', { name: 'Change password' }));
    expect(await within(section).findByText(/other devices were signed out/)).toBeTruthy();
    expect(services.api.auth.changePassword).toHaveBeenCalledWith({
      currentPassword: 'old-password-123',
      newPassword: 'a-new-passphrase-1',
    });
  });

  it('lists devices and signs out the others', async () => {
    const sessions = [
      {
        id: 's1',
        deviceName: 'iPhone 18 Pro',
        platform: 'ios',
        ipAddress: null,
        createdAt: '2026-10-01T00:00:00Z',
        lastUsedAt: '2026-10-03T00:00:00Z',
        current: true,
      },
      {
        id: 's2',
        deviceName: 'Chrome on macOS',
        platform: 'web',
        ipAddress: '1.2.3.4',
        createdAt: '2026-09-01T00:00:00Z',
        lastUsedAt: '2026-10-02T00:00:00Z',
        current: false,
      },
    ];
    const services = fakeServices({
      api: fakeApi({ security: { sessions: jest.fn().mockResolvedValue(sessions) } }),
    });
    renderWithProviders(<SettingsScreen />, services);
    const section = await screen.findByLabelText('Signed-in devices');
    expect(await within(section).findByText(/This device/)).toBeTruthy();
    expect(within(section).getByText(/IP 1\.2\.3\.4/)).toBeTruthy();

    fireEvent.press(within(section).getByRole('button', { name: 'Sign out' }));
    await waitFor(() => expect(services.api.security.revokeSession).toHaveBeenCalledWith('s2'));
    fireEvent.press(within(section).getByRole('button', { name: 'Sign out of all other devices' }));
    await waitFor(() => expect(services.api.security.revokeOtherSessions).toHaveBeenCalled());
  });

  it('shows recent activity with readable labels', async () => {
    const services = fakeServices({
      api: fakeApi({
        security: {
          events: jest.fn().mockResolvedValue([
            {
              id: 'e1',
              type: 'ACCOUNT_LOCKED',
              deviceName: 'Chrome on Windows',
              ipAddress: null,
              createdAt: '2026-10-03T00:00:00Z',
            },
          ]),
        },
      }),
    });
    renderWithProviders(<SettingsScreen />, services);
    expect(await screen.findByText('Sign-in locked after failed attempts')).toBeTruthy();
    expect(screen.getByText(/Chrome on Windows/)).toBeTruthy();
  });
});

describe('sign out and delete', () => {
  it('signs out after confirmation', async () => {
    const services = fakeServices();
    jest
      .spyOn(Alert, 'alert')
      .mockImplementation((_t, _m, buttons) =>
        buttons?.find((b) => b.text === 'Sign out')?.onPress?.(),
      );
    renderWithProviders(<SettingsScreen />, services);
    fireEvent.press(await screen.findByRole('button', { name: 'Sign out' }));
    await waitFor(() => expect(services.api.auth.logout).toHaveBeenCalled());
  });

  it('deletes with the password and the 2FA code', async () => {
    const services = fakeServices({ api: fakeApi({ auth: withMfaUser() }) });
    renderWithProviders(<SettingsScreen />, services);
    fireEvent.press(await screen.findByRole('button', { name: 'Delete account' }));
    fireEvent.changeText(
      screen.getByLabelText('Enter your password to confirm'),
      'correct-horse-battery',
    );
    expect(
      screen.getByRole('button', { name: 'Delete permanently' }).props.accessibilityState,
    ).toMatchObject({ disabled: true });
    fireEvent.changeText(screen.getAllByLabelText('Authenticator code').at(-1)!, '123456');
    fireEvent.press(screen.getByRole('button', { name: 'Delete permanently' }));
    await waitFor(() =>
      expect(services.api.auth.deleteAccount).toHaveBeenCalledWith('correct-horse-battery', {
        code: '123456',
      }),
    );
  });
});
