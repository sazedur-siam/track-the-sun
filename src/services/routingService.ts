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
export function decodePolyline(encoded: string): [number, number][] {
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

    // Cumulative distance along the route, so timestamps track real progress.
    // (Polyline points are NOT equidistant, so interpolating by index would
    // misplace *when* the vehicle is at each point.)
    const cumulativeDistances: number[] = [0];
    for (let i = 1; i < coordinates.length; i++) {
      const [prevLat, prevLng] = coordinates[i - 1];
      const [lat, lng] = coordinates[i];
      const segment = haversineDistance(prevLat, prevLng, lat, lng);
      cumulativeDistances.push(cumulativeDistances[i - 1] + segment);
    }
    const totalGeometryDistance =
      cumulativeDistances[cumulativeDistances.length - 1] || 0;

    // Create waypoints with timestamps based on distance progress
    const waypoints: RouteWaypoint[] = coordinates.map((coord, index) => {
      const progress =
        totalGeometryDistance > 0
          ? cumulativeDistances[index] / totalGeometryDistance
          : 0;
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
 * Great-circle distance between two points, in meters (haversine).
 */
function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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
 * @param units - Localized unit labels (defaults to English "km"/"m")
 * @returns Formatted string (e.g., "5.2 km" or "850 m")
 */
export function formatDistance(
  meters: number,
  units: { km: string; m: string } = { km: 'km', m: 'm' },
): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} ${units.km}`;
  }
  return `${Math.round(meters)} ${units.m}`;
}

/**
 * Format duration for display
 * @param seconds - Duration in seconds
 * @param units - Localized unit labels (defaults to English "h"/"m")
 * @returns Formatted string (e.g., "1h 23m" or "15m")
 */
export function formatDuration(
  seconds: number,
  units: { hour: string; min: string } = { hour: 'h', min: 'm' },
): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}${units.hour} ${minutes}${units.min}`;
  }
  return `${minutes}${units.min}`;
}
