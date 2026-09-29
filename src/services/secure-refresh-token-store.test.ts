import * as SecureStore from 'expo-secure-store';
import { secureRefreshTokenStore } from './secure-refresh-token-store';

describe('secureRefreshTokenStore', () => {
  it('keeps the refresh token in the Keychain/Keystore and deletes it on sign-out', async () => {
    const store = secureRefreshTokenStore(SecureStore);
    expect(await store.get()).toBeNull();

    await store.set('token-1');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('spendly.refreshToken', 'token-1');
    expect(await store.get()).toBe('token-1');

    await store.set(null);
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('spendly.refreshToken');
    expect(await store.get()).toBeNull();
  });
});
