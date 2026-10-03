import { TOTP_CODE_DIGITS, type SecondFactor } from '@rahulreddy05/spendly-shared';

export type FactorMode = 'code' | 'recovery';

const MIN_RECOVERY_LENGTH = 8;
const CODE_PATTERN = new RegExp(`^\\d{${TOTP_CODE_DIGITS}}$`);

/** A complete second factor from what the user typed, or null if not ready yet. */
export function toSecondFactor(value: string, mode: FactorMode): SecondFactor | null {
  const trimmed = value.trim();
  if (mode === 'recovery')
    return trimmed.length >= MIN_RECOVERY_LENGTH ? { recoveryCode: trimmed } : null;
  return CODE_PATTERN.test(trimmed) ? { code: trimmed } : null;
}
