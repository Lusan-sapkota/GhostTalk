/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const palette = {
  cyan: "#00CFFF",
  purple: "#5B47FF",
  magenta: "#FF5EC4",
  violet: "#B384FF",
  paleCyan: "#78EEF4",
};

export const Colors = {
  light: {
    text: '#11181C',
    background: palette.paleCyan,
    tint: palette.cyan,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: palette.cyan,
    primary: palette.cyan,
    secondary: palette.purple,
    accent: palette.magenta,
    highlight: palette.violet,
    ...palette,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: palette.purple,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: palette.purple,
    primary: palette.purple,
    secondary: palette.cyan,
    accent: palette.magenta,
    highlight: palette.violet,
    ...palette,
  },
};
