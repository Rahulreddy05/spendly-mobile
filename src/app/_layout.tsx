import { useEffect, useState, type ReactNode } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProviders, connectQueryFocusToAppState, createQueryClient } from '../providers';
import { createAppServices } from '../services/create-services';
import { useAppServices } from '../services/app-services';
import { useAuth } from '../auth/auth-context';
import { UpgradeRequired } from '../components/UpgradeRequired';
import { AppLockGate } from '../components/AppLockGate';
import { ReauthProvider } from '../auth/ReauthProvider';

// Keep the splash screen up until we know whether a session can be restored.
SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const [services] = useState(createAppServices);
  const [queryClient] = useState(createQueryClient);
  useEffect(connectQueryFocusToAppState, []);

  return (
    <SafeAreaProvider>
      <AppProviders services={services} queryClient={queryClient}>
        <UpgradeGate>
          <AppLockGate>
            <ReauthProvider>
              <RootNavigator />
            </ReauthProvider>
          </AppLockGate>
        </UpgradeGate>
        <StatusBar style="auto" />
      </AppProviders>
    </SafeAreaProvider>
  );
}

/** Signed-in users get the tabs; everyone else only sign-in and register. */
function RootNavigator() {
  const { status } = useAuth();

  useEffect(() => {
    if (status !== 'loading') SplashScreen.hideAsync().catch(() => undefined);
  }, [status]);

  if (status === 'loading') return null;
  const signedIn = status === 'authenticated';

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="notifications"
          options={{ headerShown: true, title: 'Notifications', headerBackTitle: 'Back' }}
        />
      </Stack.Protected>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="forgot-password" />
      </Stack.Protected>
    </Stack>
  );
}

/** Replaces the whole app with an update prompt once the API answers 426. */
function UpgradeGate({ children }: { children: ReactNode }) {
  const { http } = useAppServices();
  const [required, setRequired] = useState<{ minVersion?: string } | null>(null);

  useEffect(() => {
    http.onUpgradeRequired((minVersion) => setRequired({ ...(minVersion ? { minVersion } : {}) }));
    return () => http.onUpgradeRequired(null);
  }, [http]);

  return required ? <UpgradeRequired {...required} /> : <>{children}</>;
}
