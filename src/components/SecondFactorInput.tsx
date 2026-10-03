import { useState } from 'react';
import { Pressable } from 'react-native';
import { TOTP_CODE_DIGITS, type SecondFactor } from '@rahulreddy05/spendly-shared';
import { AppText, TextField } from './ui';
import { useTheme } from '../hooks/use-theme';
import { toSecondFactor, type FactorMode } from '../lib/second-factor';

const RECOVERY_MAX = 12;

/** Authenticator code by default, with a switch to a recovery code. */
export function SecondFactorInput({
  onChange,
}: {
  onChange: (factor: SecondFactor | null) => void;
}) {
  const theme = useTheme();
  const [mode, setMode] = useState<FactorMode>('code');
  const [value, setValue] = useState('');

  const update = (next: string, nextMode = mode) => {
    setValue(next);
    onChange(toSecondFactor(next, nextMode));
  };

  return (
    <>
      <TextField
        label={mode === 'code' ? 'Authenticator code' : 'Recovery code'}
        value={value}
        onChangeText={(v) => update(v)}
        keyboardType={mode === 'code' ? 'number-pad' : 'default'}
        autoCapitalize="characters"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        maxLength={mode === 'code' ? TOTP_CODE_DIGITS : RECOVERY_MAX}
        placeholder={mode === 'code' ? '123456' : 'XXXX-XXXX'}
      />
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          const next: FactorMode = mode === 'code' ? 'recovery' : 'code';
          setMode(next);
          update('', next);
        }}
      >
        <AppText style={{ color: theme.primary, fontWeight: '600' }}>
          {mode === 'code' ? 'Use a recovery code instead' : 'Use your authenticator app instead'}
        </AppText>
      </Pressable>
    </>
  );
}
