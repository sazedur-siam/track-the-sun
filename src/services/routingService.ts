/**
 * Routing Service
 * Uses OSRM API to fetch routes between locations
 */

const OSRM_BASE_URL = "https://router.project-osrm.org";

export interface Location {
  lat: number;
  lng: number;
  name?: string;
}

export interface RouteWaypoint {
  lat: number;
  lng: number;
  timestamp: Date;
}

export interface Route {
  waypoints: RouteWaypoint[];
  distance: number; // in meters
  duration: number; // in seconds
}

/**
 * Decode OSRM polyline to coordinates
 * @param encoded - Encoded polyline string
 * @returns Array of [lat, lng] coordinates
 */
function decodePolyline(encoded: string): [number, number][] {
  const coordinates: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;

    // Decode latitude
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    shift = 0;
    result = 0;

    // Decode longitude
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    coordinates.push([lat / 1e5, lng / 1e5]);
  }

  return coordinates;
}

/**
 * Fetch route between two locations using OSRM
 * @param origin - Starting location
 * @param destination - Ending location
 * @param departureTime - Time of departure
 * @returns Route with waypoints and timestamps
 */
export async function fetchRoute(
  origin: Location,
  destination: Location,
  departureTime: Date = new Date(),
): Promise<Route | null> {
  try {
    // Build OSRM request URL
    const url = `${OSRM_BASE_URL}/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=polyline`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Failed to fetch route");
    }

    const data = await response.json();

    if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
      throw new Error("No route found");
    }

    const route = data.routes[0];
    const distance = route.distance; // meters
    const duration = route.duration; // seconds
    const geometry = route.geometry;

    // Decode polyline to get coordinates
    const coordinates = decodePolyline(geometry);

    // Create waypoints with timestamps
    const waypoints: RouteWaypoint[] = coordinates.map((coord, index) => {
      // Calculate time offset for this waypoint
      const progress = index / (coordinates.length - 1);
      const timeOffset = progress * duration * 1000; // milliseconds
      const timestamp = new Date(departureTime.getTime() + timeOffset);

      return {
        lat: coord[0],
        lng: coord[1],
        timestamp,
      };
    });

    return {
      waypoints,
      distance,
      duration,
    };
  } catch (error) {
    console.error("Routing error:", error);
    return null;
  }
}

/**
 * Calculate bearing between two points
 * @param lat1 - Start latitude
 * @param lng1 - Start longitude
 * @param lat2 - End latitude
 * @param lng2 - End longitude
 * @returns Bearing in degrees
 */
export function calculateBearing(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);
  const bearing = ((θ * 180) / Math.PI + 360) % 360;

  return bearing;
}

/**
 * Format distance for display
 * @param meters - Distance in meters
 * @returns Formatted string (e.g., "5.2 km" or "850 m")
 */
export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}

/**
 * Format duration for display
 * @param seconds - Duration in seconds
 * @returns Formatted string (e.g., "1h 23m" or "15m")
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}
