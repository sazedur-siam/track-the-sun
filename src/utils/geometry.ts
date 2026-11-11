/**
 * Geometry helpers for drawing routes on a map.
 */

import { Side, WaypointSunData } from "@/src/services/sunCalcService";

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface SideSegment {
  side: Side;
  coordinates: LatLng[];
}

/** Perpendicular distance (metres) from p to the segment a–b, on a local flat projection. */
function perpendicularDistance(p: LatLng, a: LatLng, b: LatLng): number {
  const metersPerDegLat = 111_320;
  const metersPerDegLng = 111_320 * Math.cos((a.latitude * Math.PI) / 180);
  const toXY = (q: LatLng) => [
    (q.longitude - a.longitude) * metersPerDegLng,
    (q.latitude - a.latitude) * metersPerDegLat,
  ];
  const [px, py] = toXY(p);
  const [bx, by] = toXY(b);
  const lengthSq = bx * bx + by * by;
  if (lengthSq === 0) return Math.hypot(px, py);
  const t = Math.max(0, Math.min(1, (px * bx + py * by) / lengthSq));
  return Math.hypot(px - t * bx, py - t * by);
}

/**
 * Douglas–Peucker simplification: drop points that deviate less than
 * `toleranceMeters` from the simplified line. Endpoints are always kept.
 */
export function simplifyPath(points: LatLng[], toleranceMeters = 15): LatLng[] {
  if (points.length <= 2) return points.slice();

  const keep = new Array<boolean>(points.length).fill(false);
  keep[0] = true;
  keep[points.length - 1] = true;

  // Iterative to avoid deep recursion on long routes.
  const stack: [number, number][] = [[0, points.length - 1]];
  while (stack.length) {
    const [start, end] = stack.pop()!;
    let maxDistance = 0;
    let index = -1;
    for (let i = start + 1; i < end; i++) {
      const d = perpendicularDistance(points[i], points[start], points[end]);
      if (d > maxDistance) {
        maxDistance = d;
        index = i;
      }
    }
    if (index !== -1 && maxDistance > toleranceMeters) {
      keep[index] = true;
      stack.push([start, index], [index, end]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

/**
 * Split a route into map polylines by which side the sun is on.
 *
 * `details[i]` describes the segment from `waypoints[i]` to `waypoints[i + 1]`.
 * Runs shorter than `minRunMeters` (or `minRunFraction` of the route, if
 * longer) are merged into the previous run so winding roads don't produce
 * hundreds of tiny lines. Neighbouring runs share their
 * boundary point, so the drawn line has no gaps.
 */
export function buildSideSegments(
  waypoints: { lat: number; lng: number }[],
  details: WaypointSunData[],
  { minRunMeters = 300, minRunFraction = 0.01, toleranceMeters = 15 } = {},
): SideSegment[] {
  const count = Math.min(details.length, waypoints.length - 1);
  if (count <= 0) return [];

  let totalMeters = 0;
  for (let i = 0; i < count; i++) totalMeters += details[i].distance;
  const minRun = Math.max(minRunMeters, totalMeters * minRunFraction);

  // Group segment indices into runs of the same side, with their length.
  type Run = { side: Side; from: number; to: number; meters: number };
  const runs: Run[] = [];
  for (let i = 0; i < count; i++) {
    const { side, distance } = details[i];
    const last = runs[runs.length - 1];
    if (last && last.side === side) {
      last.to = i;
      last.meters += distance;
    } else {
      runs.push({ side, from: i, to: i, meters: distance });
    }
  }

  // Merge short runs into the previous one (or the next, for the first run).
  const merged: Run[] = [];
  for (const run of runs) {
    const last = merged[merged.length - 1];
    if (last && (run.meters < minRun || last.side === run.side)) {
      last.to = run.to;
      last.meters += run.meters;
    } else {
      merged.push({ ...run });
    }
  }
  if (merged.length > 1 && merged[0].meters < minRun) {
    merged[1].from = merged[0].from;
    merged[1].meters += merged[0].meters;
    merged.shift();
  }

  return merged.map((run) => ({
    side: run.side,
    coordinates: simplifyPath(
      waypoints
        .slice(run.from, run.to + 2)
        .map((w) => ({ latitude: w.lat, longitude: w.lng })),
      toleranceMeters,
    ),
  }));
}
