/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#26382f',
    background: '#f2eee5',
    backgroundElement: '#e8e2d4',
    backgroundSelected: '#d7e3c6',
    textSecondary: '#60646C',
  },
  dark: {
    text: '#ffffff',
    background: '#182521',
    backgroundElement: '#26382f',
    backgroundSelected: '#3c5045',
    textSecondary: '#B0B4BA',
  },
} as const;

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
  background: '#182521',
  surfaceLowest: '#101c18',
  surfaceLow: '#20312b',
  surface: '#26382f',
  surfaceHigh: '#30443a',
  surfaceHighest: '#3c5045',
  lime: '#c4d5aa',
  text: '#f2eee5',
  muted: '#b8c4b4',
  border: '#526252',
  mint: '#a8c7b5',
  cyan: '#c7b899',
  success: '#00a572',
  error: '#ffb4ab',
} as const;

export const AuthSpacing = { xs: 8, sm: 12, md: 16, lg: 24, xl: 32 } as const;
export const AuthRadius = { sm: 4, md: 8, lg: 12, xl: 16, full: 9999 } as const;
