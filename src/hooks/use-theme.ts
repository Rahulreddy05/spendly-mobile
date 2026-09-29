import { useColorScheme } from 'react-native';
import { PALETTE, type Palette } from '../constants/theme.constants';

/** The palette for the system light/dark setting. */
export function useTheme(): Palette {
  return useColorScheme() === 'dark' ? PALETTE.dark : PALETTE.light;
}
