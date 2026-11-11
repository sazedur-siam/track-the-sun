/**
 * Timeline
 *
 * Turns per-segment sun data into a short list of time ranges ("runs")
 * saying which side the sun is on during each part of the trip.
 */

import { Side, WaypointSunData } from "./sunCalcService";

export interface TimelineRun {
  side: Side;
  start: Date;
  end: Date;
}

export interface TimelineOptions {
  /**
   * Sun-side runs shorter than this are absorbed into a neighbour (removes
   * junction noise). Grows to 2% of the trip on long trips.
   */
  minRunSeconds?: number;
  /**
   * "No side sun" gaps shorter than this are absorbed too: a brief turn
   * towards the sun should not split one long sunny stretch. Grows to 5% of
   * the trip on long trips.
   */
  minNeutralSeconds?: number;
  /** Upper bound on the number of runs returned. */
  maxRuns?: number;
}

const duration = (run: TimelineRun) => run.end.getTime() - run.start.getTime();

/** Merge neighbouring runs that are on the same side. */
function mergeSameSide(runs: TimelineRun[]): TimelineRun[] {
  const merged: TimelineRun[] = [];
  for (const run of runs) {
    const last = merged[merged.length - 1];
    if (last && last.side === run.side) {
      last.end = run.end;
    } else {
      merged.push({ ...run });
    }
  }
  return merged;
}

/** Absorb the run at `index` into its longer neighbour. */
function absorb(runs: TimelineRun[], index: number): TimelineRun[] {
  const prev = runs[index - 1];
  const next = runs[index + 1];
  const target =
    prev && next ? (duration(prev) >= duration(next) ? prev : next) : (prev ?? next);
  if (!target) return runs;

  const run = runs[index];
  const result = runs.map((r) =>
    r === target
      ? {
          side: r.side,
          start: new Date(Math.min(r.start.getTime(), run.start.getTime())),
          end: new Date(Math.max(r.end.getTime(), run.end.getTime())),
        }
      : r,
  );
  result.splice(index, 1);
  return mergeSameSide(result);
}

function shortestIndex(
  runs: TimelineRun[],
  include: (run: TimelineRun) => boolean = () => true,
): number {
  let best = -1;
  for (let i = 0; i < runs.length; i++) {
    if (!include(runs[i])) continue;
    if (best === -1 || duration(runs[i]) < duration(runs[best])) best = i;
  }
  return best;
}

/**
 * Build the sun-side timeline for a trip.
 * The runs are contiguous and cover exactly the trip's first to last timestamp.
 */
export function buildTimeline(
  details: WaypointSunData[],
  { minRunSeconds = 120, minNeutralSeconds = 600, maxRuns = 12 }: TimelineOptions = {},
): TimelineRun[] {
  let runs = mergeSameSide(
    details
      .filter((d) => d.endTimestamp.getTime() > d.waypoint.timestamp.getTime())
      .map((d) => ({ side: d.side, start: d.waypoint.timestamp, end: d.endTimestamp })),
  );

  if (runs.length === 0) return runs;
  const total = runs[runs.length - 1].end.getTime() - runs[0].start.getTime();
  const minRun = Math.max(minRunSeconds * 1000, total * 0.02);
  const minNeutral = Math.max(minNeutralSeconds * 1000, total * 0.05);
  const tooShort = (run: TimelineRun) =>
    duration(run) < (run.side === "neutral" ? minNeutral : minRun);

  // Remove noise: absorb the shortest too-short run until none are left.
  while (runs.length > 1) {
    const i = shortestIndex(runs, tooShort);
    if (i === -1) break;
    runs = absorb(runs, i);
  }

  // Keep the bar readable.
  while (runs.length > maxRuns) {
    runs = absorb(runs, shortestIndex(runs));
  }

  return runs;
}

/** Runs where the sun is on a side (for the textual summary). */
export function sideRuns(runs: TimelineRun[]): TimelineRun[] {
  return runs.filter((r) => r.side === "left" || r.side === "right");
}
