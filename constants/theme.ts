/**
 * Design tokens for TrackTheSun — "Refined Sunrise".
 *
 * A single source of truth for color, spacing, radius, shadow and typography.
 * Prefer these tokens over hardcoded values so light/dark mode stays
 * consistent and accessible.
 *
 *   const theme = Colors[useColorScheme() ?? 'light'];
 *   <View style={{ backgroundColor: theme.card, padding: Spacing.lg }} />
 */

import { Platform } from "react-native";

const tintColorLight = "#F59E0B"; // Amber 500
const tintColorDark = "#FBBF24"; // Amber 400

export const Colors = {
  light: {
    // Surfaces
    background: "#FBFBFD",
    card: "#FFFFFF",
    inputBackground: "#F1F3F7",

    // Text
    text: "#0F172A", // Slate 900
    textSecondary: "#64748B", // Slate 500
    textMuted: "#94A3B8", // Slate 400
    placeholder: "#94A3B8",

    // Brand / accents
    primary: "#F59E0B", // Amber — main CTA
    onPrimary: "#1A1206", // High-contrast ink on amber
    secondary: "#0284C7", // Sky 600 — secondary actions
    onSecondary: "#FFFFFF",
    accentSoft: "#FEF3C7", // Amber 100 — soft highlight bg

    // Semantic
    success: "#16A34A",
    warning: "#D97706",
    danger: "#EF4444",

    // Lines & effects
    border: "#E5E7EB",
    separator: "#EEF0F3",
    shadow: "#0F172A",
    overlay: "rgba(15, 23, 42, 0.45)",

    // Template compatibility (themed-text/view, tab bar, icons)
    tint: tintColorLight,
    icon: "#64748B",
    tabIconDefault: "#94A3B8",
    tabIconSelected: tintColorLight,
  },
  dark: {
    // Surfaces
    background: "#0B1120",
    card: "#1B2433",
    inputBackground: "#0F1A2B",

    // Text
    text: "#E8EAED",
    textSecondary: "#94A3B8",
    textMuted: "#64748B",
    placeholder: "#64748B",

    // Brand / accents
    primary: "#FBBF24", // Brighter amber for dark surfaces
    onPrimary: "#1A1206",
    secondary: "#38BDF8", // Sky 400
    onSecondary: "#062B43", // Dark navy ink on bright sky
    accentSoft: "rgba(251, 191, 36, 0.14)",

    // Semantic
    success: "#22C55E",
    warning: "#FBBF24",
    danger: "#F87171",

    // Lines & effects
    border: "#2C3A52",
    separator: "#233044",
    shadow: "#000000",
    overlay: "rgba(0, 0, 0, 0.6)",

    // Template compatibility
    tint: tintColorDark,
    icon: "#94A3B8",
    tabIconDefault: "#64748B",
    tabIconSelected: tintColorDark,
  },
};

export type ThemeColors = typeof Colors.light;

/** 4px spacing scale. */
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

/** Corner radius scale. */
export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

/** Type scale (size / lineHeight / weight). */
export const Typography = {
  display: { fontSize: 32, lineHeight: 38, fontWeight: "800" as const },
  title: { fontSize: 26, lineHeight: 32, fontWeight: "800" as const },
  subtitle: { fontSize: 18, lineHeight: 24, fontWeight: "700" as const },
  body: { fontSize: 16, lineHeight: 24, fontWeight: "400" as const },
  bodyStrong: { fontSize: 16, lineHeight: 24, fontWeight: "600" as const },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: "500" as const },
  label: { fontSize: 12, lineHeight: 16, fontWeight: "700" as const },
} as const;

/**
 * Elevation presets. Spread into a style and override `shadowColor` with
 * `theme.shadow` for correct dark-mode shadows.
 */
export const Shadows = {
  sm: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  lg: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
} as const;

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
