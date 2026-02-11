/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from "react-native";

const tintColorLight = "#FFB703"; // Sun Yellow
const tintColorDark = "#FFB703";

// 4-Color Modern Palette
const Palette = {
  primary: "#FFB703", // Warm Sun Yellow
  secondary: "#023047", // Deep Sky Blue (Dark)
  secondaryLight: "#8ECAE6", // Light Blue for Dark Mode
  danger: "#EF4444", // Modern Red
  surfaceLight: "#FFFFFF",
  surfaceDark: "#0F172A", // Slate 900
  textLight: "#111827", // Gray 900
  textDark: "#F3F4F6", // Gray 100
  borderLight: "#E5E7EB",
  borderDark: "#374151",
};

export const Colors = {
  light: {
    text: Palette.textLight,
    background: Palette.surfaceLight,
    tint: tintColorLight,
    icon: "#6B7280",
    tabIconDefault: "#9CA3AF",
    tabIconSelected: tintColorLight,
    primary: Palette.primary,
    secondary: Palette.secondary,
    danger: Palette.danger,
    card: "#F9FAFB",
    border: Palette.borderLight,
  },
  dark: {
    text: Palette.textDark,
    background: Palette.surfaceDark,
    tint: tintColorDark,
    icon: "#9CA3AF",
    tabIconDefault: "#6B7280",
    tabIconSelected: tintColorDark,
    primary: Palette.primary,
    secondary: Palette.secondaryLight,
    danger: Palette.danger,
    card: "#1E293B",
    border: Palette.borderDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
