/** Design tokens, matching the web app's palette. Components never use raw values. */
export const PALETTE = {
  light: {
    background: '#f6f7f5',
    surface: '#ffffff',
    surfaceMuted: '#eef1ee',
    border: '#dfe4df',
    text: '#17201c',
    textMuted: '#5b6862',
    primary: '#0f6e6e',
    onPrimary: '#ffffff',
    income: '#1f7a4d',
    expense: '#b4492d',
    danger: '#b42318',
    warning: '#a86512',
  },
  dark: {
    background: '#0f1412',
    surface: '#161d1a',
    surfaceMuted: '#1d2622',
    border: '#2a3530',
    text: '#e7ece9',
    textMuted: '#9aa8a1',
    primary: '#3fb0a8',
    onPrimary: '#071210',
    income: '#5cc58f',
    expense: '#ef8a6b',
    danger: '#f97066',
    warning: '#e3a74a',
  },
} as const;

export type Palette = { [K in keyof (typeof PALETTE)['light']]: string };

export const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const RADIUS = { sm: 8, md: 12, pill: 999 } as const;
export const FONT_SIZE = { caption: 12, small: 14, body: 16, title: 20, headline: 28 } as const;
/** Minimum touch target (Apple HIG / Material). */
export const TOUCH_TARGET = 44;
