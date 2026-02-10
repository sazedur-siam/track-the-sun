import { Location } from "@/src/types";
import AsyncStorage from "@react-native-async-storage/async-storage";

const FAVORITES_KEY = "@trackthesun_favorites";

export interface FavoriteRoute {
  id: string;
  fromLocation: Location;
  toLocation: Location;
  name: string;
  createdAt: string;
}

export async function saveFavoriteRoute(
  fromLocation: Location,
  toLocation: Location,
  name?: string,
): Promise<void> {
  try {
    const favorites = await getFavoriteRoutes();
    const newFavorite: FavoriteRoute = {
      id: Date.now().toString(),
      fromLocation,
      toLocation,
      name: name || `${fromLocation.name} → ${toLocation.name}`,
      createdAt: new Date().toISOString(),
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
