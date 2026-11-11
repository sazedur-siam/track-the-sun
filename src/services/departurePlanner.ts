/**
 * Departure Planner
 *
 * "Best time to leave": re-runs the sun calculation for a range of departure
 * times around the chosen one. The route geometry and duration are reused,
 * only the timestamps shift, so no extra network requests are needed.
 */

import { RouteWaypoint, SunAvoidance } from "@/src/types";
import { Route } from "./routingService";
import { calculateSunExposure, Side } from "./sunCalcService";

export interface DepartureSlot {
  departure: Date;
  leftIntensity: number;
  rightIntensity: number;
  /** Sun on the sunnier side (0–100): lower is better when avoiding. */
  score: number;
  hasSun: boolean;
  recommendation: Side;
}

export interface ScanOptions {
  /** Minutes before and after the chosen departure to scan. */
  windowMinutes?: number;
  stepMinutes?: number;
  mode?: SunAvoidance;
  /** Thin the route to points at least this far apart (speed). */
  sampleSpacingMeters?: number;
}

export interface DepartureWindow {
  start: Date;
  end: Date;
  score: number;
}

/** Move every timestamp so the trip starts at `departure`. */
export function shiftRoute(route: Route, departure: Date): Route {
  const first = route.waypoints[0]?.timestamp.getTime() ?? departure.getTime();
  const delta = departure.getTime() - first;
  return {
    ...route,
    waypoints: route.waypoints.map((w) => ({
      ...w,
      timestamp: new Date(w.timestamp.getTime() + delta),
    })),
  };
}

function distanceMeters(a: RouteWaypoint, b: RouteWaypoint): number {
  const R = 6371e3;
  const φ1 = (a.lat * Math.PI) / 180;
  const φ2 = (b.lat * Math.PI) / 180;
  const Δφ = ((b.lat - a.lat) * Math.PI) / 180;
  const Δλ = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/** Keep the endpoints and every point at least `spacing` metres from the last kept one. */
export function downsampleWaypoints(
  waypoints: RouteWaypoint[],
  spacing = 500,
): RouteWaypoint[] {
  if (waypoints.length <= 2) return waypoints.slice();
  const kept: RouteWaypoint[] = [waypoints[0]];
  for (let i = 1; i < waypoints.length - 1; i++) {
    if (distanceMeters(kept[kept.length - 1], waypoints[i]) >= spacing) {
      kept.push(waypoints[i]);
    }
  }
  kept.push(waypoints[waypoints.length - 1]);
  return kept;
}

/** Sun exposure for departures every `stepMinutes` within ±`windowMinutes`. */
export function scanDepartures(
  route: Route,
  center: Date,
  {
    windowMinutes = 180,
    stepMinutes = 15,
    mode = "avoid",
    sampleSpacingMeters = 500,
  }: ScanOptions = {},
): DepartureSlot[] {
  if (route.waypoints.length < 2) return [];
  const sampled: Route = {
    ...route,
    waypoints: downsampleWaypoints(route.waypoints, sampleSpacingMeters),
  };

  const slots: DepartureSlot[] = [];
  for (let offset = -windowMinutes; offset <= windowMinutes; offset += stepMinutes) {
    const departure = new Date(center.getTime() + offset * 60_000);
    const result = calculateSunExposure(shiftRoute(sampled, departure).waypoints, mode);
    slots.push({
      departure,
      leftIntensity: result.leftIntensity,
      rightIntensity: result.rightIntensity,
      score: Math.max(result.leftIntensity, result.rightIntensity),
      hasSun: result.hasDirectSunlight,
      recommendation: result.recommendation,
    });
  }
  return slots;
}

/**
 * The best departure window among slots with sun: the longest run of
 * consecutive slots within `tolerance` points of the best score (lowest when
 * avoiding, highest when seeking). Null when no slot has sun.
 */
export function bestWindow(
  slots: DepartureSlot[],
  mode: SunAvoidance = "avoid",
  tolerance = 5,
): DepartureWindow | null {
  const sunny = slots.filter((s) => s.hasSun);
  if (sunny.length === 0) return null;

  const target =
    mode === "seek"
      ? Math.max(...sunny.map((s) => s.score))
      : Math.min(...sunny.map((s) => s.score));
  const good = (s: DepartureSlot) => s.hasSun && Math.abs(s.score - target) <= tolerance;

  let best: { from: number; to: number } | null = null;
  let runStart = -1;
  for (let i = 0; i <= slots.length; i++) {
    if (i < slots.length && good(slots[i])) {
      if (runStart === -1) runStart = i;
      continue;
    }
    if (runStart !== -1) {
      const run = { from: runStart, to: i - 1 };
      if (!best || run.to - run.from > best.to - best.from) best = run;
      runStart = -1;
    }
  }
  if (!best) return null;

  const window = slots.slice(best.from, best.to + 1);
  const score = Math.round(window.reduce((sum, s) => sum + s.score, 0) / window.length);
  return { start: slots[best.from].departure, end: slots[best.to].departure, score };
}
