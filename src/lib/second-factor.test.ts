import { toSecondFactor } from './second-factor';

describe('toSecondFactor', () => {
  it('accepts exactly 6 digits as an authenticator code', () => {
    expect(toSecondFactor(' 123456 ', 'code')).toEqual({ code: '123456' });
    expect(toSecondFactor('12345', 'code')).toBeNull();
    expect(toSecondFactor('12345a', 'code')).toBeNull();
  });

  it('accepts recovery codes of at least 8 characters', () => {
    expect(toSecondFactor('abcd-efgh', 'recovery')).toEqual({ recoveryCode: 'abcd-efgh' });
    expect(toSecondFactor('abc', 'recovery')).toBeNull();
  });
});
