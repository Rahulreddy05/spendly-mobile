import { apiBaseUrl } from './env';

describe('apiBaseUrl', () => {
  it('uses the configured URL, without a trailing slash', () => {
    expect(apiBaseUrl('ios', 'https://spendly.example.com/api/v1/')).toBe('https://spendly.example.com/api/v1');
  });

  it('defaults to the local API as each simulator sees it', () => {
    expect(apiBaseUrl('ios', '')).toBe('http://localhost:4000/api/v1');
    expect(apiBaseUrl('android', undefined)).toBe('http://10.0.2.2:4000/api/v1');
    expect(apiBaseUrl('web', undefined)).toBe('http://localhost:4000/api/v1');
  });
});
