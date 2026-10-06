/** What came back from the provider's native linking UI. */
export type LinkOutcome = { status: 'linked'; publicToken: string } | { status: 'cancelled' };

/**
 * Strategy for a provider's native linking flow (Plaid Link today, an Account
 * Aggregator consent flow later). Hooks depend on this interface only.
 */
export interface BankLinker {
  link(linkToken: string): Promise<LinkOutcome>;
}
