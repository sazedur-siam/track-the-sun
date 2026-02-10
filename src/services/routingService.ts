/**
 * Routing Service
 * Uses OSRM API to fetch routes between locations
 * Phase 2: Full route fetching and waypoint processing will be implemented here
 */

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
 * Fetch route between two locations using OSRM
 * @param origin - Starting location
 * @param destination - Ending location
 * @returns Route with waypoints
 */
export async function fetchRoute(
  origin: Location,
  destination: Location,
): Promise<Route | null> {
  // TODO: Phase 2 - Implement OSRM API integration
  console.log("fetchRoute called with:", origin, destination);
  return null;
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
