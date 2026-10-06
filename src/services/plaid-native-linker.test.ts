import { PlaidNativeLinker, type PlaidNativeSdk } from './plaid-native-linker';

type Config = Parameters<PlaidNativeSdk['createPlaidLinkSession']>[0];

/** A fake native SDK whose Link sheet finishes the way each test says. */
function fakeSdk(finish: (config: Config) => void, openFails = false) {
  const open = jest.fn(async () => {
    if (openFails) throw new Error('native failure');
  });
  const sdk: PlaidNativeSdk = {
    createPlaidLinkSession: jest.fn(async (config: Config) => {
      open.mockImplementation(async () => {
        if (openFails) throw new Error('native failure');
        finish(config);
      });
      return { open };
    }),
  };
  return { sdk, open };
}

describe('PlaidNativeLinker', () => {
  it('resolves with the public token when the user finishes', async () => {
    const { sdk, open } = fakeSdk((c) => c.onSuccess({ publicToken: 'public-1' }));
    expect(await new PlaidNativeLinker(sdk).link('link-1')).toEqual({
      status: 'linked',
      publicToken: 'public-1',
    });
    expect(sdk.createPlaidLinkSession).toHaveBeenCalledWith(
      expect.objectContaining({ token: 'link-1' }),
    );
    expect(open).toHaveBeenCalledWith(false);
  });

  it('treats closing Link as cancelled, including the empty error iOS sends', async () => {
    const { sdk } = fakeSdk((c) => c.onExit({}));
    expect(await new PlaidNativeLinker(sdk).link('link-1')).toEqual({ status: 'cancelled' });
    const { sdk: ios } = fakeSdk((c) => c.onExit({ error: {} }));
    expect(await new PlaidNativeLinker(ios).link('link-1')).toEqual({ status: 'cancelled' });
  });

  it("surfaces Plaid's user-facing message on an error exit", async () => {
    const { sdk } = fakeSdk((c) =>
      c.onExit({
        error: { errorCode: 'INSTITUTION_DOWN', displayMessage: 'This bank is unavailable.' },
      }),
    );
    await expect(new PlaidNativeLinker(sdk).link('t')).rejects.toMatchObject({
      code: 'PROVIDER_ERROR',
      message: 'This bank is unavailable.',
    });

    const { sdk: quiet } = fakeSdk((c) => c.onExit({ error: { errorCode: 'X' } }));
    await expect(new PlaidNativeLinker(quiet).link('t')).rejects.toMatchObject({
      message: 'Your bank could not be connected. Try again.',
    });
  });

  it('reports when the native sheet cannot open', async () => {
    const { sdk } = fakeSdk(() => undefined, true);
    await expect(new PlaidNativeLinker(sdk).link('t')).rejects.toMatchObject({
      code: 'UNKNOWN_ERROR',
    });
  });
});
