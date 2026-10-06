import { AppState, Text, type AppStateStatus } from 'react-native';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { AppLockGate } from './AppLockGate';
import { fakeBiometrics, fakePreferences, fakeServices, renderWithProviders } from '../test/render';

describe('AppLockGate', () => {
  let listeners: ((s: AppStateStatus) => void)[];

  beforeEach(() => {
    listeners = [];
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, cb) => {
      listeners.push(cb as (s: AppStateStatus) => void);
      return { remove: jest.fn() } as unknown as ReturnType<typeof AppState.addEventListener>;
    });
  });
  afterEach(() => jest.restoreAllMocks());

  const appState = (state: AppStateStatus) => act(() => listeners.forEach((l) => l(state)));

  it('re-locks after time in the background, and sign-out is always available', async () => {
    const biometrics = fakeBiometrics();
    const services = fakeServices({ biometrics, preferences: fakePreferences(true) });
    renderWithProviders(
      <AppLockGate lockAfterMs={0}>
        <Text>Secret balances</Text>
      </AppLockGate>,
      services,
    );
    await waitFor(() => expect(biometrics.authenticate).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('Secret balances')).toBeTruthy();

    biometrics.config.succeed = false;
    appState('background');
    appState('active');
    expect(await screen.findByText('Pennypath is locked')).toBeTruthy();
    expect(screen.queryByText('Secret balances')).toBeNull();

    fireEvent.press(screen.getByRole('button', { name: 'Sign out' }));
    await act(async () => undefined);
    expect(services.api.auth.logout).toHaveBeenCalled();
  });

  it('does not re-lock after a short trip to the background', async () => {
    const biometrics = fakeBiometrics();
    renderWithProviders(
      <AppLockGate>
        <Text>Secret balances</Text>
      </AppLockGate>,
      fakeServices({ biometrics, preferences: fakePreferences(true) }),
    );
    // Session restored and the launch unlock done.
    await waitFor(() => expect(biometrics.authenticate).toHaveBeenCalledTimes(1));
    await screen.findByText('Secret balances');
    appState('background');
    appState('active');
    expect(screen.getByText('Secret balances')).toBeTruthy();
    expect(biometrics.authenticate).toHaveBeenCalledTimes(1); // only the launch unlock
  });

  it('never shows protected content before the lock decision', async () => {
    let decide!: (enabled: boolean) => void;
    const preferences = fakePreferences(true);
    preferences.biometricLock.mockReturnValueOnce(new Promise<boolean>((r) => (decide = r)));
    const services = fakeServices({ biometrics: fakeBiometrics({ succeed: false }), preferences });
    renderWithProviders(
      <AppLockGate>
        <Text>Secret balances</Text>
      </AppLockGate>,
      services,
    );
    // Session restored, lock setting still loading: nothing sensitive is visible.
    await act(async () => undefined);
    expect(screen.queryByText('Secret balances')).toBeNull();

    await act(async () => decide(true));
    expect(await screen.findByText('Pennypath is locked')).toBeTruthy();
    expect(screen.queryByText('Secret balances')).toBeNull();
  });

  it('never locks when biometrics are unavailable, even if the setting is on', async () => {
    const biometrics = fakeBiometrics({ available: false });
    renderWithProviders(
      <AppLockGate lockAfterMs={0}>
        <Text>Secret balances</Text>
      </AppLockGate>,
      fakeServices({ biometrics, preferences: fakePreferences(true) }),
    );
    expect(await screen.findByText('Secret balances')).toBeTruthy();
    expect(biometrics.authenticate).not.toHaveBeenCalled();
  });
});
