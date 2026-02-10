/**
 * Geocoding Service
 * Uses Nominatim/OpenStreetMap API for location search and geocoding
 * Phase 1: Location search and autocomplete will be implemented here
 */

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
  // TODO: Phase 1 - Implement Nominatim API integration
  // Remember to add debouncing and rate limiting (1 req/sec)
  console.log("searchLocation called with:", query);
  return [];
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
  // TODO: Phase 1 - Implement reverse geocoding
  console.log("reverseGeocode called with:", lat, lng);
  return null;
}
