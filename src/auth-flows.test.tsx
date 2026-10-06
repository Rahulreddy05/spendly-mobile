import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { ApiError } from '@rahulreddy05/spendly-shared';
import { fakeApi, fakeBiometrics, fakePreferences, fakeServices } from './test/render';
import { session, user } from './test/fixtures';
import type { AppServices } from './services/app-services';

let mockServices: AppServices;
jest.mock('./services/create-services', () => ({ createAppServices: () => mockServices }));

const APP_DIR = './src/app';

async function enterCredentials() {
  fireEvent.changeText(await screen.findByLabelText('Email'), 'rahul@example.com');
  fireEvent.changeText(screen.getByLabelText('Password'), 'correct-horse-battery');
  fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
}

describe('two-factor sign-in', () => {
  it('asks for the authenticator code after the password', async () => {
    mockServices = fakeServices({
      signedIn: false,
      api: fakeApi({
        auth: {
          login: jest.fn().mockResolvedValue({ mfaRequired: true, mfaToken: 'challenge-1' }),
        },
      }),
    });
    renderRouter(APP_DIR, { initialUrl: '/login' });
    await enterCredentials();

    expect(await screen.findByText('Two-factor authentication')).toBeTruthy();
    const verify = screen.getByRole('button', { name: 'Verify' });
    expect(verify.props.accessibilityState).toMatchObject({ disabled: true });
    fireEvent.changeText(screen.getByLabelText('Authenticator code'), '123456');
    fireEvent.press(screen.getByRole('button', { name: 'Verify' }));

    expect(await screen.findByText(/you brought in/)).toBeTruthy();
    expect(mockServices.api.auth.verifyMfa).toHaveBeenCalledWith('challenge-1', { code: '123456' });
  });

  it('accepts a recovery code and shows a wrong code', async () => {
    mockServices = fakeServices({
      signedIn: false,
      api: fakeApi({
        auth: {
          login: jest.fn().mockResolvedValue({ mfaRequired: true, mfaToken: 'c' }),
          verifyMfa: jest
            .fn()
            .mockRejectedValueOnce(new ApiError(401, 'UNAUTHORIZED', 'That code is incorrect.'))
            .mockResolvedValue(session),
        },
      }),
    });
    renderRouter(APP_DIR, { initialUrl: '/login' });
    await enterCredentials();

    fireEvent.press(await screen.findByText('Use a recovery code instead'));
    fireEvent.changeText(screen.getByLabelText('Recovery code'), 'AAAA-BBBB');
    fireEvent.press(screen.getByRole('button', { name: 'Verify' }));
    expect(await screen.findByText('That code is incorrect.')).toBeTruthy();
    expect(mockServices.api.auth.verifyMfa).toHaveBeenCalledWith('c', {
      recoveryCode: 'AAAA-BBBB',
    });

    fireEvent.press(screen.getByRole('button', { name: 'Back to sign in' }));
    expect(await screen.findByText('Sign in to Pennypath')).toBeTruthy();
  });
});

describe('forgot password', () => {
  it('requests a code and sets a new password', async () => {
    mockServices = fakeServices({ signedIn: false });
    renderRouter(APP_DIR, { initialUrl: '/login' });

    fireEvent.press(await screen.findByText('Forgot your password?'));
    fireEvent.changeText(await screen.findByLabelText('Email'), 'rahul@example.com');
    fireEvent.press(screen.getByRole('button', { name: 'Send code' }));
    expect(await screen.findByText(/If an account exists for rahul@example.com/)).toBeTruthy();

    fireEvent.changeText(screen.getByLabelText('Code'), '123456');
    fireEvent.changeText(screen.getByLabelText('New password'), 'a-brand-new-passphrase');
    fireEvent.press(screen.getByRole('button', { name: 'Set new password' }));
    expect(await screen.findByText(/signed out everywhere/)).toBeTruthy();
    expect(mockServices.api.auth.resetPassword).toHaveBeenCalledWith({
      email: 'rahul@example.com',
      code: '123456',
      newPassword: 'a-brand-new-passphrase',
    });
    expect(screen).toHavePathname('/forgot-password');
  });
});

describe('biometric app lock', () => {
  it('opens locked and unlocks with Face ID', async () => {
    const biometrics = fakeBiometrics();
    mockServices = fakeServices({ biometrics, preferences: fakePreferences(true) });
    renderRouter(APP_DIR, { initialUrl: '/' });

    // The prompt appears straight away and succeeds.
    expect(await screen.findByText(/you brought in/)).toBeTruthy();
    expect(biometrics.authenticate).toHaveBeenCalledWith('Unlock Pennypath');
  });

  it('stays locked when Face ID fails, and offers sign-out', async () => {
    const biometrics = fakeBiometrics({ succeed: false });
    mockServices = fakeServices({ biometrics, preferences: fakePreferences(true) });
    renderRouter(APP_DIR, { initialUrl: '/' });

    expect(await screen.findByText('Pennypath is locked')).toBeTruthy();
    expect(screen.queryByText(/you brought in/)).toBeNull();

    biometrics.config.succeed = true;
    fireEvent.press(screen.getByRole('button', { name: 'Unlock with Face ID' }));
    expect(await screen.findByText(/you brought in/)).toBeTruthy();
  });

  it('does nothing when the lock is off', async () => {
    const biometrics = fakeBiometrics();
    mockServices = fakeServices({ biometrics, preferences: fakePreferences(false) });
    renderRouter(APP_DIR, { initialUrl: '/' });
    expect(await screen.findByText(/you brought in/)).toBeTruthy();
    expect(biometrics.authenticate).not.toHaveBeenCalled();
  });
});

describe('email verification card', () => {
  it('verifies the email and disappears', async () => {
    mockServices = fakeServices({
      api: fakeApi({
        auth: {
          restoreSession: jest
            .fn()
            .mockResolvedValue({ ...session, user: { ...user, emailVerified: false } }),
          me: jest
            .fn()
            .mockResolvedValue({ ...user, emailVerified: true, createdAt: '2026-01-01' }),
        },
      }),
    });
    renderRouter(APP_DIR, { initialUrl: '/' });
    fireEvent.changeText(await screen.findByLabelText('Verification code'), '123456');
    fireEvent.press(screen.getByRole('button', { name: 'Verify' }));
    await waitFor(() => expect(screen.queryByLabelText('Verification code')).toBeNull());
    expect(mockServices.api.auth.verifyEmail).toHaveBeenCalledWith('123456');
  });
});
