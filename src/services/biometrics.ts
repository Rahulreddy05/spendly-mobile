import * as LocalAuthentication from 'expo-local-authentication';

export interface BiometricSupport {
  available: boolean;
  /** "Face ID", "Touch ID", "fingerprint" … for button labels. */
  label: string;
}

/** Strategy for biometric checks, so screens can be tested without a device. */
export interface BiometricAuth {
  support(): Promise<BiometricSupport>;
  authenticate(prompt: string): Promise<boolean>;
}

export const BIOMETRIC_FALLBACK_LABEL = 'biometrics';

/** Face ID / Touch ID / fingerprint via expo-local-authentication. */
export function expoBiometricAuth(platform: string): BiometricAuth {
  return {
    async support() {
      const [hardware, enrolled, types] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
        LocalAuthentication.supportedAuthenticationTypesAsync(),
      ]);
      const face = types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
      const finger = types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT);
      const label =
        platform === 'ios'
          ? face
            ? 'Face ID'
            : finger
              ? 'Touch ID'
              : BIOMETRIC_FALLBACK_LABEL
          : face
            ? 'face unlock'
            : finger
              ? 'fingerprint'
              : BIOMETRIC_FALLBACK_LABEL;
      return { available: hardware && enrolled, label };
    },
    async authenticate(prompt) {
      // Device passcode stays available as a fallback (disableDeviceFallback: false).
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: prompt,
        cancelLabel: 'Cancel',
      });
      return result.success;
    },
  };
}
