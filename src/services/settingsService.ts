/**
 * Settings Service
 *
 * User preferences for routing, persisted in AsyncStorage:
 *  - which route provider to try first (OSRM or Google)
 *  - an optional Google Maps API key entered in the app, which overrides the
 *    built-in key from `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` (handy when the
 *    built-in key expires or runs out of quota)
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { SunAvoidance } from "@/src/types";
import { fetchRoute, Location, Route, RoutingProvider } from "./routingService";

const SETTINGS_KEY = "@trackthesun_settings";

export interface AppSettings {
  routingProvider: RoutingProvider;
  /** Key entered by the user in Settings; null means "use the built-in key". */
  googleApiKey: string | null;
  /** Last chosen sun preference on the Home screen. */
  sunMode: SunAvoidance;
}

/**
 * Key baked in at build time from `.env.local` / EAS env.
 * NOTE: must be written as `process.env.EXPO_PUBLIC_…` literally so Expo can
 * inline it into the bundle.
 */
export function getBuiltInGoogleKey(): string | null {
  const key = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
  return key ? key : null;
}

/** Defaults: Google when a built-in key exists, otherwise OSRM. */
export function defaultSettings(): AppSettings {
  return {
    routingProvider: getBuiltInGoogleKey() ? "google" : "osrm",
    googleApiKey: null,
    sunMode: "avoid",
  };
}

export async function getSettings(): Promise<AppSettings> {
  const defaults = defaultSettings();
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaults;
    const saved = JSON.parse(raw) as Partial<AppSettings>;
    return {
      routingProvider:
        saved.routingProvider === "google" || saved.routingProvider === "osrm"
          ? saved.routingProvider
          : defaults.routingProvider,
      googleApiKey:
        typeof saved.googleApiKey === "string" && saved.googleApiKey.trim()
          ? saved.googleApiKey.trim()
          : null,
      sunMode: saved.sunMode === "seek" ? "seek" : "avoid",
    };
  } catch (error) {
    console.error("Error loading settings:", error);
    return defaults;
  }
}

export async function updateSettings(
  changes: Partial<AppSettings>,
): Promise<AppSettings> {
  const next = { ...(await getSettings()), ...changes };
  if (next.googleApiKey !== null) {
    next.googleApiKey = next.googleApiKey.trim() || null;
  }
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  return next;
}

/** The key that will actually be used: the user's key, else the built-in one. */
export function effectiveGoogleKey(settings: AppSettings): string | null {
  return settings.googleApiKey ?? getBuiltInGoogleKey();
}

/** Where the effective key comes from, for display. */
export function googleKeySource(
  settings: AppSettings,
): "user" | "builtIn" | "none" {
  if (settings.googleApiKey) return "user";
  return getBuiltInGoogleKey() ? "builtIn" : "none";
}

/** Show only the start and end of a key, e.g. "AIza…OCVc". */
export function maskKey(key: string | null | undefined): string {
  if (!key) return "";
  if (key.length <= 10) return "•".repeat(key.length);
  return `${key.slice(0, 4)}…${key.slice(-4)}`;
}

/**
 * Fetch a route using the user's saved provider and key.
 * Screens should call this instead of `fetchRoute` directly.
 */
export async function planRoute(
  origin: Location,
  destination: Location,
  departureTime: Date,
): Promise<Route | null> {
  const settings = await getSettings();
  return fetchRoute(origin, destination, departureTime, {
    provider: settings.routingProvider,
    googleApiKey: effectiveGoogleKey(settings),
  });
}
