import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { createAppServices } from './create-services';

jest.mock('expo-application', () => ({ nativeApplicationVersion: '1.2.3' }));

describe('createAppServices', () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('identifies the app version, sends the stored refresh token in the body, and saves the new one', async () => {
    await SecureStore.setItemAsync('spendly.refreshToken', 'stored');
    const fetchMock = jest.fn(async () =>
      new Response(JSON.stringify({ accessToken: 'a', refreshToken: 'rotated', user: { id: 'u', email: 'e', displayName: null } }), {
        status: 200,
      }),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    const { api } = createAppServices();
    await api.auth.restoreSession();

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`${Platform.OS === 'android' ? 'http://10.0.2.2:4000' : 'http://localhost:4000'}/api/v1/auth/refresh`);
    expect(init.credentials).toBe('omit');
    expect(JSON.parse(String(init.body))).toEqual({ refreshToken: 'stored' });
    expect(init.headers).toMatchObject({ 'x-client-platform': Platform.OS, 'x-client-version': '1.2.3' });
    expect(await SecureStore.getItemAsync('spendly.refreshToken')).toBe('rotated');
  });
});
