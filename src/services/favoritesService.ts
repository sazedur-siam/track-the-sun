import { Location, SunAvoidance } from "@/src/types";
import AsyncStorage from "@react-native-async-storage/async-storage";

const FAVORITES_KEY = "@trackthesun_favorites";

export interface FavoriteRoute {
  id: string;
  fromLocation: Location;
  toLocation: Location;
  name: string;
  createdAt: string;
  /**
   * Usual departure time of day, "HH:mm" (24h, local time). Optional for
   * backwards compatibility with routes saved before this field existed.
   */
  departureTime?: string;
  /** Sun preference for this route; missing means "avoid". */
  mode?: SunAvoidance;
}

/** Format a date as a local "HH:mm" time of day. */
export function toTimeOfDay(date: Date): string {
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

/**
 * Resolve a saved "HH:mm" time of day to a Date on the same calendar day as
 * `now`. Falls back to `now` when the value is missing or malformed.
 */
export function resolveDepartureTime(
  timeOfDay: string | undefined,
  now: Date = new Date(),
): Date {
  const match = timeOfDay?.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return new Date(now);
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return new Date(now);
  const result = new Date(now);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

export async function saveFavoriteRoute(
  fromLocation: Location,
  toLocation: Location,
  name?: string,
  departureTime?: Date,
  mode?: SunAvoidance,
): Promise<void> {
  try {
    const favorites = await getFavoriteRoutes();
    const newFavorite: FavoriteRoute = {
      // Timestamp + random suffix: saves in the same millisecond must not collide.
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
      fromLocation,
      toLocation,
      name: name || `${fromLocation.name} → ${toLocation.name}`,
      createdAt: new Date().toISOString(),
      ...(departureTime ? { departureTime: toTimeOfDay(departureTime) } : {}),
      ...(mode === "seek" ? { mode } : {}),
    };

    favorites.push(newFavorite);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  } catch (error) {
    console.error("Error saving favorite route:", error);
    throw error;
  }
}

export async function getFavoriteRoutes(): Promise<FavoriteRoute[]> {
  try {
    const data = await AsyncStorage.getItem(FAVORITES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error loading favorite routes:", error);
    return [];
  }
}

export async function deleteFavoriteRoute(id: string): Promise<void> {
  try {
    const favorites = await getFavoriteRoutes();
    const filtered = favorites.filter((fav) => fav.id !== id);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Error deleting favorite route:", error);
    throw error;
  }
}
