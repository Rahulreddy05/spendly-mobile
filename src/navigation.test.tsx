import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { ApiError, HttpClient, memoryRefreshTokenStore } from '@rahulreddy05/spendly-shared';
import { fakeApi, fakeServices } from './test/render';
import type { AppServices } from './services/app-services';

// The root layout builds its services here; tests hand it fakes instead.
let mockServices: AppServices;
jest.mock('./services/create-services', () => ({ createAppServices: () => mockServices }));

const APP_DIR = './src/app';

describe('navigation and sign-in', () => {
  it('shows sign-in when there is no stored session, even for a deep link', async () => {
    mockServices = fakeServices({ signedIn: false });
    renderRouter(APP_DIR, { initialUrl: '/transactions' });

    expect(await screen.findByText('Sign in to Spendly')).toBeTruthy();
    expect(screen).toHavePathname('/login');
    expect(mockServices.api.auth.restoreSession).not.toHaveBeenCalled();
  });

  it('restores a stored session straight into the dashboard', async () => {
    mockServices = fakeServices();
    renderRouter(APP_DIR, { initialUrl: '/' });

    expect(await screen.findByText(/you brought in \$6,000\.00/)).toBeTruthy();
    expect(screen).toHavePathname('/');
  });

  it('signs in and lands on the tabs', async () => {
    mockServices = fakeServices({ signedIn: false });
    renderRouter(APP_DIR, { initialUrl: '/login' });

    fireEvent.changeText(await screen.findByLabelText('Email'), ' rahul@example.com ');
    fireEvent.changeText(screen.getByLabelText('Password'), 'correct-horse-battery');
    fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText(/you brought in/)).toBeTruthy();
    expect(mockServices.api.auth.login).toHaveBeenCalledWith({ email: 'rahul@example.com', password: 'correct-horse-battery' });
  });

  it('shows the server message when sign-in fails', async () => {
    mockServices = fakeServices({
      signedIn: false,
      api: fakeApi({ auth: { login: jest.fn().mockRejectedValue(new ApiError(401, 'UNAUTHORIZED', 'Email or password is incorrect.')) } }),
    });
    renderRouter(APP_DIR, { initialUrl: '/login' });

    fireEvent.changeText(await screen.findByLabelText('Email'), 'a@b.co');
    fireEvent.changeText(screen.getByLabelText('Password'), 'nope');
    fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Email or password is incorrect.')).toBeTruthy();
  });

  it('registers from the create-account screen', async () => {
    mockServices = fakeServices({ signedIn: false });
    renderRouter(APP_DIR, { initialUrl: '/login' });

    fireEvent.press(await screen.findByText('Create an account'));
    fireEvent.changeText(await screen.findByLabelText('Name (optional)'), 'Rahul');
    fireEvent.changeText(screen.getByLabelText('Email'), 'new@example.com');
    fireEvent.changeText(screen.getByLabelText('Password'), 'correct-horse-battery');
    fireEvent.press(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() =>
      expect(mockServices.api.auth.register).toHaveBeenCalledWith({ email: 'new@example.com', password: 'correct-horse-battery', displayName: 'Rahul' }),
    );
  });

  it('falls back to sign-in when the stored session has expired', async () => {
    mockServices = fakeServices({
      api: fakeApi({ auth: { restoreSession: jest.fn().mockRejectedValue(new ApiError(401, 'UNAUTHORIZED', 'expired')) } }),
    });
    renderRouter(APP_DIR, { initialUrl: '/' });
    expect(await screen.findByText('Sign in to Spendly')).toBeTruthy();
  });

  it('replaces the app with an update prompt when the API answers 426', async () => {
    const http = new HttpClient({
      baseUrl: '',
      refreshTokenStore: memoryRefreshTokenStore(null),
      fetch: jest.fn(async () =>
        new Response(JSON.stringify({ error: { code: 'UPGRADE_REQUIRED', message: 'Update', details: { minVersion: '2.0.0' } } }), { status: 426 }),
      ),
    });
    mockServices = { http, api: fakeApi() };
    renderRouter(APP_DIR, { initialUrl: '/login' });
    await screen.findByText('Sign in to Spendly');

    await act(async () => {
      await http.request('/anything').catch(() => undefined);
    });
    expect(await screen.findByText('Update Spendly')).toBeTruthy();
    expect(screen.getByText(/version 2\.0\.0 or newer/)).toBeTruthy();
  });
});
