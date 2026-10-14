/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Palette = {
  background: '#F7F3EC',
  accent: '#D9B7A5',
  surface: '#FFFCF8',
  soft: '#EFE3DA',
  border: '#E8DCD1',
  text: '#3F302B',
  muted: '#7D6B62',
  accentInk: '#805444',
  white: '#FFFFFF',
  success: '#526B53',
  successSurface: '#EAF0E6',
  error: '#B13F35',
  errorSurface: '#F8E6E1',
  warning: '#805E25',
  warningSurface: '#F5EBD6',
  scrim: 'rgba(63,48,43,0.48)',
  imageScrim: 'rgba(63,48,43,0.68)',
  shadow: 'rgba(63,48,43,0.08)',
} as const;

const warmTheme = {
  text: Palette.text,
  background: Palette.background,
  backgroundElement: Palette.surface,
  backgroundSelected: Palette.accent,
  textSecondary: Palette.muted,
} as const;

export const Colors = { light: warmTheme, dark: warmTheme } as const;

export const trainerPlaceholder = {
  uri: `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320"><rect width="320" height="320" rx="36" fill="#EFE3DA"/><circle cx="160" cy="121" r="42" fill="none" stroke="#805444" stroke-width="6"/><path d="M78 249c0-49 37-80 82-80s82 31 82 80" fill="none" stroke="#805444" stroke-width="6" stroke-linecap="round"/></svg>')}`,
};

export const studioMark = {
  uri: `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#F7F3EC"/><g fill="none" stroke="#805444" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M32 45C18 35 23 21 32 13c9 8 14 22 0 32Z"/><path d="M32 45C17 46 10 37 9 27c11 0 21 6 23 18Zm0 0c15 1 22-8 23-18-11 0-21 6-23 18Z"/><path d="M18 51h28"/></g></svg>')}`,
};

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

export const AuthColors = {
  background: Palette.background,
  surfaceLowest: Palette.background,
  surfaceLow: Palette.surface,
  surface: Palette.surface,
  surfaceHigh: Palette.soft,
  surfaceHighest: Palette.soft,
  lime: Palette.accent,
  text: Palette.text,
  muted: Palette.muted,
  border: Palette.border,
  mint: Palette.accentInk,
  cyan: Palette.accentInk,
  success: Palette.success,
  error: Palette.error,
} as const;

export const AuthSpacing = { xs: 8, sm: 12, md: 16, lg: 24, xl: 32 } as const;
export const AuthRadius = { sm: 4, md: 8, lg: 12, xl: 16, full: 9999 } as const;
