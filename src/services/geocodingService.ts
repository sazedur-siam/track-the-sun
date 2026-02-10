/**
 * Geocoding Service
 * Uses Nominatim/OpenStreetMap API for location search and geocoding
 */

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";

export interface SearchResult {
  displayName: string;
  lat: number;
  lng: number;
  type?: string;
}

/**
 * Search for locations using Nominatim API
 * @param query - Search query string
 * @returns Array of search results
 */
export async function searchLocation(query: string): Promise<SearchResult[]> {
  if (!query || query.trim().length < 3) {
    return [];
  }

  try {
    const response = await fetch(
      `${NOMINATIM_BASE_URL}/search?` +
        new URLSearchParams({
          q: query,
          format: "json",
          limit: "5",
          addressdetails: "1",
        }),
      {
        headers: {
          "User-Agent": "TrackTheSun/1.0",
        },
      },
    );

    if (!response.ok) {
      throw new Error("Search failed");
    }

    const data = await response.json();

    return data.map((item: any) => ({
      displayName: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      type: item.type,
    }));
  } catch (error) {
    console.error("Geocoding error:", error);
    return [];
  }
}

/**
 * Reverse geocode coordinates to get address
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns Location name/address
 */
export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<string | null> {
  try {
    const response = await fetch(
      `${NOMINATIM_BASE_URL}/reverse?` +
        new URLSearchParams({
          lat: lat.toString(),
          lon: lng.toString(),
          format: "json",
        }),
      {
        headers: {
          "User-Agent": "TrackTheSun/1.0",
        },
      },
    );

    if (!response.ok) {
      throw new Error("Reverse geocoding failed");
    }

    const data = await response.json();
    return data.display_name || null;
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return null;
  }
}
