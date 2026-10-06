import { ApiError, ERROR_CODE } from '@rahulreddy05/spendly-shared';
import type { BankLinker, LinkOutcome } from './bank-linker';

/** The slice of react-native-plaid-link-sdk (v13) Pennypath uses; injected so tests need no native module. */
export interface PlaidNativeSdk {
  createPlaidLinkSession(config: {
    token: string;
    onSuccess: (success: { publicToken: string }) => void;
    onExit: (exit: { error?: { errorCode?: string; displayMessage?: string } }) => void;
    onEvent: (event: unknown) => void;
  }): Promise<{ open: (fullScreen?: boolean) => Promise<void> }>;
}

/** Opens Plaid's native Link sheet and resolves with the one-time public token, or "cancelled". */
export class PlaidNativeLinker implements BankLinker {
  constructor(private readonly sdk: PlaidNativeSdk) {}

  async link(linkToken: string): Promise<LinkOutcome> {
    return new Promise<LinkOutcome>((resolve, reject) => {
      this.sdk
        .createPlaidLinkSession({
          token: linkToken,
          onSuccess: ({ publicToken }) => resolve({ status: 'linked', publicToken }),
          // The iOS SDK sends `error: {}` when the user simply closes Link,
          // so only an error code means something went wrong.
          onExit: ({ error }) =>
            error?.errorCode
              ? reject(
                  new ApiError(
                    0,
                    ERROR_CODE.PROVIDER_ERROR,
                    error.displayMessage || 'Your bank could not be connected. Try again.',
                  ),
                )
              : resolve({ status: 'cancelled' }),
          onEvent: () => undefined,
        })
        .then((session) => session.open(false))
        .catch(() =>
          reject(
            new ApiError(
              0,
              ERROR_CODE.UNKNOWN,
              'Could not open the bank connection screen. Try again.',
            ),
          ),
        );
    });
  }
}
