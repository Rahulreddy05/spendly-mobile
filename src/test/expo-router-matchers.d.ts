/**
 * expo-router/testing-library registers these matchers at runtime but ships
 * no type declarations for them (SDK 57).
 */
declare global {
  namespace jest {
    interface Matchers<R> {
      toHavePathname(pathname: string): R;
      toHavePathnameWithParams(pathname: string): R;
      toHaveSegments(segments: string[]): R;
    }
  }
}

export {};
