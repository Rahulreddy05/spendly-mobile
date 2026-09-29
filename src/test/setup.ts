// jest-expo mocks Expo's native modules. Keep a fresh in-memory secure store per test.
jest.mock('expo-secure-store', () => {
  let store: Record<string, string> = {};
  return {
    getItemAsync: jest.fn(async (key: string) => store[key] ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => {
      store[key] = value;
    }),
    deleteItemAsync: jest.fn(async (key: string) => {
      delete store[key];
    }),
    __reset: () => {
      store = {};
    },
  };
});

beforeEach(() => {
  (jest.requireMock('expo-secure-store') as { __reset: () => void }).__reset();
});
