/**
 * Route Store
 *
 * In-memory hand-off of computed routes between screens.
 *
 * A route can hold thousands of waypoints, which is far too much to serialize
 * into expo-router URL params. Screens put the route here and navigate with a
 * short `routeId`. The result screen reads it back. If the entry is missing
 * (web refresh, deep link, app restart), the result screen re-fetches the route
 * from the small location/time params instead.
 */

import { Location } from "@/src/types";
import { Route } from "./routingService";

/** How many routes to keep around (enough for back/forward navigation). */
const MAX_ENTRIES = 5;

const routes = new Map<string, Route>();
let counter = 0;

/** Store a route and return the id to pass as a navigation param. */
export function putRoute(route: Route): string {
  counter += 1;
  const id = `${Date.now().toString(36)}-${counter}`;
  routes.set(id, route);

  // Evict oldest entries (Map preserves insertion order).
  while (routes.size > MAX_ENTRIES) {
    const oldest = routes.keys().next().value;
    if (oldest === undefined) break;
    routes.delete(oldest);
  }
  return id;
}

/** Look up a stored route, or undefined if it was evicted / never stored. */
export function getRoute(id: string | undefined | null): Route | undefined {
  return id ? routes.get(id) : undefined;
}

/** Test helper: drop every stored route. */
export function clearRoutes(): void {
  routes.clear();
}

/** URL-safe params for `/route-result`. All values are strings. */
export type RouteResultParams = {
  routeId: string;
  fromName: string;
  fromLat: string;
  fromLng: string;
  toName: string;
  toLat: string;
  toLng: string;
  departureTime: string;
};

/** Build the small, serializable param set for the result screen. */
export function buildRouteResultParams(
  routeId: string,
  from: Location,
  to: Location,
  departureTime: Date,
): RouteResultParams {
  return {
    routeId,
    fromName: from.name,
    fromLat: String(from.lat),
    fromLng: String(from.lng),
    toName: to.name,
    toLat: String(to.lat),
    toLng: String(to.lng),
    departureTime: departureTime.toISOString(),
  };
}

/** Parse result-screen params back into locations and a departure time. */
export function parseRouteResultParams(params: Record<string, unknown>): {
  routeId: string | undefined;
  from: Location | null;
  to: Location | null;
  departureTime: Date;
} {
  const str = (key: string): string | undefined => {
    const value = params[key];
    if (Array.isArray(value)) return value[0];
    return typeof value === "string" ? value : undefined;
  };

  const toLocation = (prefix: "from" | "to"): Location | null => {
    const rawLat = str(`${prefix}Lat`);
    const rawLng = str(`${prefix}Lng`);
    if (!rawLat || !rawLng) return null;
    const lat = Number(rawLat);
    const lng = Number(rawLng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng, name: str(`${prefix}Name`) ?? "" };
  };

  const rawTime = str("departureTime");
  const parsedTime = rawTime ? new Date(rawTime) : new Date();
  const departureTime = Number.isNaN(parsedTime.getTime()) ? new Date() : parsedTime;

  return {
    routeId: str("routeId"),
    from: toLocation("from"),
    to: toLocation("to"),
    departureTime,
  };
}
