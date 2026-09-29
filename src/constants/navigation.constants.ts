import type { ComponentProps } from 'react';
import type Ionicons from '@expo/vector-icons/Ionicons';

type IconName = ComponentProps<typeof Ionicons>['name'];

/** Bottom tabs, in order. `name` is the file in src/app/(tabs). */
export const TABS: readonly { name: string; title: string; icon: IconName }[] = [
  { name: 'index', title: 'Dashboard', icon: 'pie-chart-outline' },
  { name: 'accounts', title: 'Accounts', icon: 'wallet-outline' },
  { name: 'transactions', title: 'Transactions', icon: 'list-outline' },
  { name: 'settings', title: 'Settings', icon: 'settings-outline' },
];
