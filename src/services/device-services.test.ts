import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { expoBiometricAuth } from './biometrics';
import { securePreferences } from './preferences';

jest.mock('expo-local-authentication', () => ({
  AuthenticationType: { FINGERPRINT: 1, FACIAL_RECOGNITION: 2, IRIS: 3 },
  hasHardwareAsync: jest.fn(),
  isEnrolledAsync: jest.fn(),
  supportedAuthenticationTypesAsync: jest.fn(),
  authenticateAsync: jest.fn(),
}));
const LA = jest.mocked(LocalAuthentication);

function device(hardware: boolean, enrolled: boolean, types: number[]) {
  LA.hasHardwareAsync.mockResolvedValue(hardware);
  LA.isEnrolledAsync.mockResolvedValue(enrolled);
  LA.supportedAuthenticationTypesAsync.mockResolvedValue(types);
}

describe('expoBiometricAuth', () => {
  it.each([
    ['ios', [2], 'Face ID'],
    ['ios', [1], 'Touch ID'],
    ['android', [1], 'fingerprint'],
    ['android', [2], 'face unlock'],
    ['android', [], 'biometrics'],
  ])('%s with %j is called %s', async (platform, types, label) => {
    device(true, true, types as number[]);
    expect(await expoBiometricAuth(platform as string).support()).toEqual({
      available: true,
      label,
    });
  });

  it('is unavailable without hardware or enrolment', async () => {
    device(true, false, [2]);
    expect((await expoBiometricAuth('ios').support()).available).toBe(false);
    device(false, true, []);
    expect((await expoBiometricAuth('ios').support()).available).toBe(false);
  });

  it('authenticates with the device passcode as a fallback', async () => {
    LA.authenticateAsync.mockResolvedValue({ success: true });
    expect(await expoBiometricAuth('ios').authenticate('Unlock Pennypath')).toBe(true);
    expect(LA.authenticateAsync).toHaveBeenCalledWith({
      promptMessage: 'Unlock Pennypath',
      cancelLabel: 'Cancel',
    });
    LA.authenticateAsync.mockResolvedValue({ success: false, error: 'user_cancel' });
    expect(await expoBiometricAuth('ios').authenticate('x')).toBe(false);
  });
});

describe('securePreferences', () => {
  it('stores the app-lock choice in the Keychain/Keystore', async () => {
    const prefs = securePreferences(SecureStore);
    expect(await prefs.biometricLock()).toBe(false);
    await prefs.setBiometricLock(true);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('spendly.biometricLock', 'true');
    expect(await prefs.biometricLock()).toBe(true);
    await prefs.setBiometricLock(false);
    expect(await prefs.biometricLock()).toBe(false);
  });
});
