/**
 * Routing Service
 *
 * Fetches a driving route from one of two providers and turns it into
 * timestamped waypoints for the sun calculation:
 *
 *  - "osrm":   free public OSRM server (OpenStreetMap data, no traffic, no key)
 *  - "google": Google Maps Platform Routes API (live traffic, needs an API key)
 *
 * `fetchRoute()` falls back from Google to OSRM automatically, so an expired or
 * over-quota key never blocks the user. The returned route records which
 * provider produced it and why a fallback happened.
 */

const OSRM_BASE_URL = "https://router.project-osrm.org";
const GOOGLE_ROUTES_URL =
  "https://routes.googleapis.com/directions/v2:computeRoutes";

export type RoutingProvider = "osrm" | "google";

/** Why a provider could not return a route. */
export type RoutingErrorCode =
  | "missing_key" // Google selected but no key configured
  | "invalid_key" // key rejected: invalid, deleted/expired, API not enabled, restricted
  | "quota" // rate limit / quota exhausted
  | "no_route" // provider answered, but found no route
  | "network" // request failed (offline, DNS, CORS, …)
  | "server"; // any other provider error

export class RoutingError extends Error {
  constructor(
    public readonly code: RoutingErrorCode,
    message?: string,
  ) {
    super(message ?? code);
    this.name = "RoutingError";
  }
}

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
  /** Provider that produced this route. */
  provider: RoutingProvider;
  /** True when the duration accounts for live/predicted traffic. */
  trafficAware: boolean;
  /** Set when Google was requested but failed and OSRM was used instead. */
  fallback?: { from: RoutingProvider; reason: RoutingErrorCode };
}

export interface FetchRouteOptions {
  /** Provider to try first. Defaults to "osrm". */
  provider?: RoutingProvider;
  /** Google Maps Platform key (Routes API). Required for "google". */
  googleApiKey?: string | null;
  /** Fall back to OSRM when Google fails. Defaults to true. */
  fallbackToOsrm?: boolean;
  /** Injected clock for tests. */
  now?: Date;
}

/**
 * Decode an encoded polyline (precision 5) to coordinates.
 * Both OSRM (`geometries=polyline`) and Google's Routes API use this format.
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
 * Turn route geometry into waypoints with timestamps.
 *
 * Timestamps are interpolated by cumulative distance, not by point index:
 * polyline points are NOT equidistant, so index-based interpolation would
 * misplace *when* the vehicle is at each point.
 */
export function buildWaypoints(
  coordinates: [number, number][],
  duration: number,
  departureTime: Date,
): RouteWaypoint[] {
  const cumulativeDistances: number[] = [0];
  for (let i = 1; i < coordinates.length; i++) {
    const [prevLat, prevLng] = coordinates[i - 1];
    const [lat, lng] = coordinates[i];
    const segment = haversineDistance(prevLat, prevLng, lat, lng);
    cumulativeDistances.push(cumulativeDistances[i - 1] + segment);
  }
  const totalGeometryDistance =
    cumulativeDistances[cumulativeDistances.length - 1] || 0;

  return coordinates.map((coord, index) => {
    const progress =
      totalGeometryDistance > 0
        ? cumulativeDistances[index] / totalGeometryDistance
        : 0;
    const timeOffset = progress * duration * 1000; // milliseconds
    return {
      lat: coord[0],
      lng: coord[1],
      timestamp: new Date(departureTime.getTime() + timeOffset),
    };
  });
}

/**
 * Fetch a route from the public OSRM server.
 * @throws RoutingError
 */
export async function requestOsrmRoute(
  origin: Location,
  destination: Location,
  departureTime: Date,
): Promise<Route> {
  const url = `${OSRM_BASE_URL}/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=polyline`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch (error) {
    throw new RoutingError("network", String(error));
  }

  if (response.status === 429) throw new RoutingError("quota");
  if (!response.ok) {
    throw new RoutingError("server", `OSRM HTTP ${response.status}`);
  }

  const data = await response.json();
  if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
    throw new RoutingError("no_route", data.code);
  }

  const route = data.routes[0];
  const duration: number = route.duration; // seconds
  return {
    waypoints: buildWaypoints(
      decodePolyline(route.geometry),
      duration,
      departureTime,
    ),
    distance: route.distance,
    duration,
    provider: "osrm",
    trafficAware: false,
  };
}

/** Map a Google API error response to a RoutingErrorCode. */
function googleErrorCode(httpStatus: number, body: any): RoutingErrorCode {
  const status: string | undefined = body?.error?.status;
  const reasons: string[] = (body?.error?.details ?? [])
    .map((d: any) => d?.reason)
    .filter(Boolean);

  if (httpStatus === 429 || status === "RESOURCE_EXHAUSTED") return "quota";
  if (
    reasons.some((r) => r.startsWith("API_KEY_")) ||
    httpStatus === 401 ||
    httpStatus === 403 ||
    status === "PERMISSION_DENIED" ||
    status === "UNAUTHENTICATED"
  ) {
    return "invalid_key";
  }
  return "server";
}

/** Parse a protobuf Duration string like "20103s" or "12.5s" into seconds. */
function parseGoogleDuration(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const seconds = parseFloat(value.replace(/s$/, ""));
    if (Number.isFinite(seconds)) return seconds;
  }
  return NaN;
}

/**
 * Fetch a route from the Google Maps Platform Routes API (computeRoutes).
 *
 * Uses live/predicted traffic when departing now or in the future. Google
 * rejects departure times in the past, so those are routed without traffic.
 * @throws RoutingError
 */
export async function requestGoogleRoute(
  origin: Location,
  destination: Location,
  departureTime: Date,
  apiKey: string | null | undefined,
  now: Date = new Date(),
): Promise<Route> {
  const key = apiKey?.trim();
  if (!key) throw new RoutingError("missing_key");

  // Within a minute of "now" counts as now (the user tapped "Now" a moment ago).
  const msAhead = departureTime.getTime() - now.getTime();
  const trafficAware = msAhead > -60_000;

  const body: Record<string, unknown> = {
    origin: {
      location: { latLng: { latitude: origin.lat, longitude: origin.lng } },
    },
    destination: {
      location: {
        latLng: { latitude: destination.lat, longitude: destination.lng },
      },
    },
    travelMode: "DRIVE",
    routingPreference: trafficAware ? "TRAFFIC_AWARE" : "TRAFFIC_UNAWARE",
    polylineQuality: "HIGH_QUALITY",
    polylineEncoding: "ENCODED_POLYLINE",
  };
  if (trafficAware && msAhead > 60_000) {
    body.departureTime = departureTime.toISOString();
  }

  let response: Response;
  try {
    response = await fetch(GOOGLE_ROUTES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask":
          "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline",
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    throw new RoutingError("network", String(error));
  }

  let data: any = null;
  try {
    data = await response.json();
  } catch {
    // Non-JSON body; handled below.
  }

  if (!response.ok) {
    throw new RoutingError(
      googleErrorCode(response.status, data),
      data?.error?.message ?? `Google HTTP ${response.status}`,
    );
  }

  const route = data?.routes?.[0];
  const encoded: string | undefined = route?.polyline?.encodedPolyline;
  if (!route || !encoded) throw new RoutingError("no_route");

  const duration = parseGoogleDuration(route.duration);
  if (!Number.isFinite(duration)) {
    throw new RoutingError("server", "Missing duration");
  }

  return {
    waypoints: buildWaypoints(decodePolyline(encoded), duration, departureTime),
    distance: route.distanceMeters ?? 0,
    duration,
    provider: "google",
    trafficAware,
  };
}

/**
 * Check that a Google key works, with one small, traffic-unaware request
 * (the cheapest Routes API tier).
 */
export async function testGoogleApiKey(
  apiKey: string,
): Promise<{ ok: true } | { ok: false; code: RoutingErrorCode }> {
  try {
    // Two points ~1 km apart in central Dhaka; a past time keeps it traffic-unaware.
    await requestGoogleRoute(
      { lat: 23.7808, lng: 90.4067 },
      { lat: 23.7738, lng: 90.4005 },
      new Date(0),
      apiKey,
    );
    return { ok: true };
  } catch (error) {
    const code = error instanceof RoutingError ? error.code : "server";
    // A key that reaches Google and gets "no route" is still a valid key.
    return code === "no_route" ? { ok: true } : { ok: false, code };
  }
}

/**
 * Fetch a route with the chosen provider, falling back from Google to OSRM.
 * @returns The route, or null when no provider could produce one
 */
export async function fetchRoute(
  origin: Location,
  destination: Location,
  departureTime: Date = new Date(),
  options: FetchRouteOptions = {},
): Promise<Route | null> {
  const { provider = "osrm", googleApiKey, fallbackToOsrm = true, now } = options;

  if (provider === "google") {
    try {
      return await requestGoogleRoute(
        origin,
        destination,
        departureTime,
        googleApiKey,
        now,
      );
    } catch (error) {
      const reason: RoutingErrorCode =
        error instanceof RoutingError ? error.code : "server";
      console.warn(`Google routing failed (${reason}); falling back to OSRM.`);
      if (!fallbackToOsrm) return null;
      try {
        const route = await requestOsrmRoute(origin, destination, departureTime);
        return { ...route, fallback: { from: "google", reason } };
      } catch (osrmError) {
        console.error("Routing error:", osrmError);
        return null;
      }
    }
  }

  try {
    return await requestOsrmRoute(origin, destination, departureTime);
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
