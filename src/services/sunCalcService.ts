/**
 * Sun Calculation Service
 * Uses the suncalc library to calculate sun position
 */

import { RouteWaypoint, SunAvoidance } from "@/src/types";
import * as SunCalc from "suncalc";
import { calculateBearing } from "./routingService";

/** Which side of the vehicle, relative to the direction of travel. */
export type Side = "left" | "right" | "neutral";

/** 8-point compass direction. */
export type Compass = "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW";

/**
 * Minimum sun altitude (degrees) to count as "direct sunlight".
 * Kept at 0 (geometric horizon) on purpose: low-angle sun produces the
 * *worst* glare/heat into side windows, which is exactly what riders want
 * to avoid — so we must not discard it.
 */
const MIN_SUN_ALTITUDE = 0;

/** Margin (percentage points) one side must lead by to earn a recommendation. */
const RECOMMENDATION_MARGIN = 10;

/** Below this sun altitude (degrees), side sun counts as glare. */
const GLARE_MAX_ALTITUDE = 15;

/** Minimum side factor (|sin| of the sun's angle to travel) for glare. */
const GLARE_MIN_SIDE_FACTOR = 0.7;

/** How hard the sun hits the sunny side, from its average intensity there. */
export type SunStrength = "strong" | "moderate" | "mild";

/** A stretch of low, side-on sun (glare) during the trip. */
export interface GlareWindow {
  side: "left" | "right";
  start: Date;
  end: Date;
}

export interface WaypointSunData {
  waypoint: RouteWaypoint;
  sunAzimuth: number;
  busHeading: number;
  relativeAngle: number;
  /** Side of the vehicle the sun falls on, relative to travel direction. */
  side: Side;
  sunAltitude: number;
  distance: number;
  /** When the vehicle reaches the end of this segment. */
  endTimestamp: Date;
  /**
   * How much sun comes through a side window on this segment, 0–1:
   * |sin(angle to travel)| × cos(sun altitude). 1 = low sun exactly side-on.
   */
  intensity: number;
  /** Low, side-on sun on this segment. */
  glare: boolean;
}

export interface SunExposureResult {
  /** Share of the journey (by distance) with sun on the left of travel. */
  leftPercentage: number;
  /** Share of the journey (by distance) with sun on the right of travel. */
  rightPercentage: number;
  /**
   * Sun intensity on each side (0–100), weighted by sun height and angle:
   * 100 = low sun exactly side-on for the whole trip. Drives the recommendation.
   */
  leftIntensity: number;
  rightIntensity: number;
  /** How strong the sun is on the sunny side, or null with no sunny side. */
  sunnySideStrength: SunStrength | null;
  /** Longest stretch of low, side-on sun, if any. */
  glare: GlareWindow | null;
  /**
   * Why there is no recommendation despite sunlight: the sides are evenly
   * lit ("balanced"), or the sun is mostly overhead ("overhead").
   */
  neutralReason: "balanced" | "overhead" | null;
  /**
   * Side the rider should SIT on: opposite the sunny side when avoiding the
   * sun, the sunny side itself when seeking it.
   */
  recommendation: Side;
  /** Whether the rider wants to avoid or get the sun. */
  mode: SunAvoidance;
  /** Side the sun is predominantly on during the journey. */
  sunnySide: Side;
  /** Compass direction the sunny side faces (circular-mean of sun azimuth). */
  sunnySideCompass: Compass | null;
  hasDirectSunlight: boolean;
  waypointDetails: WaypointSunData[];
  summary: string;
}

/**
 * Calculate sun position at a given location and time
 */
export function getSunPosition(lat: number, lng: number, date: Date) {
  return SunCalc.getPosition(date, lat, lng);
}

/**
 * Get sun azimuth (direction) in degrees
 * 0° = North, 90° = East, 180° = South, 270° = West
 */
export function getSunAzimuth(lat: number, lng: number, date: Date): number {
  const position = getSunPosition(lat, lng, date);
  const azimuthDegrees = ((position.azimuth * 180) / Math.PI + 180) % 360;
  return azimuthDegrees;
}

/**
 * Check if the sun is above the horizon
 */
export function isSunAboveHorizon(
  lat: number,
  lng: number,
  date: Date,
): boolean {
  const position = getSunPosition(lat, lng, date);
  return position.altitude > 0;
}

/**
 * Calculate distance between two points in meters
 */
function calculateDistance(
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
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Normalize angle to -180 to +180 range
 */
function normalizeAngle(angle: number): number {
  while (angle > 180) angle -= 360;
  while (angle < -180) angle += 360;
  return angle;
}

/**
 * Determine which side of the vehicle the sun falls on, relative to the
 * direction of travel.
 * @param relativeAngle - Sun azimuth minus travel heading (-180 to +180)
 *
 * A positive angle means the sun is clockwise from the heading — i.e. on the
 * rider's RIGHT. Near 0 (sun ahead) or near ±180 (sun behind) there is little
 * side exposure, so we report "neutral".
 */
function determineSide(relativeAngle: number): Side {
  const absAngle = Math.abs(relativeAngle);

  if (absAngle < 30 || absAngle > 150) {
    return "neutral";
  }

  return relativeAngle > 0 ? "right" : "left";
}

const COMPASS_POINTS: Compass[] = [
  "N",
  "NE",
  "E",
  "SE",
  "S",
  "SW",
  "W",
  "NW",
];

const COMPASS_NAMES: Record<Compass, string> = {
  N: "north",
  NE: "northeast",
  E: "east",
  SE: "southeast",
  S: "south",
  SW: "southwest",
  W: "west",
  NW: "northwest",
};

/** Human-readable name for a compass point, e.g. "northeast". */
export function compassName(compass: Compass): string {
  return COMPASS_NAMES[compass];
}

/** Snap a 0–360 azimuth to the nearest 8-point compass direction. */
function azimuthToCompass(azimuth: number): Compass {
  const index = Math.round((((azimuth % 360) + 360) % 360) / 45) % 8;
  return COMPASS_POINTS[index];
}

/**
 * Calculate sun exposure for entire route
 * @param waypoints - Array of route waypoints with timestamps
 * @returns Sun exposure analysis with percentages and recommendation
 */
export function calculateSunExposure(
  waypoints: RouteWaypoint[],
  mode: SunAvoidance = "avoid",
): SunExposureResult {
  if (waypoints.length < 2) {
    return {
      leftPercentage: 0,
      rightPercentage: 0,
      leftIntensity: 0,
      rightIntensity: 0,
      sunnySideStrength: null,
      glare: null,
      neutralReason: null,
      recommendation: "neutral",
      mode,
      sunnySide: "neutral",
      sunnySideCompass: null,
      hasDirectSunlight: false,
      waypointDetails: [],
      summary: "Route too short to analyze",
    };
  }

  const details: WaypointSunData[] = [];
  let totalLeftDistance = 0;
  let totalRightDistance = 0;
  let totalNeutralDistance = 0;
  let hasSunlight = false;

  // Intensity-weighted exposure (distance × intensity) per side.
  let leftExposure = 0;
  let rightExposure = 0;

  // Circular accumulators (weighted by distance) for the sun azimuth on each
  // side, so we can report the compass direction the sunny side faces.
  let leftSin = 0;
  let leftCos = 0;
  let rightSin = 0;
  let rightCos = 0;

  // Process each segment (waypoint to next waypoint)
  for (let i = 0; i < waypoints.length - 1; i++) {
    const current = waypoints[i];
    const next = waypoints[i + 1];

    // Calculate bus heading
    const busHeading = calculateBearing(
      current.lat,
      current.lng,
      next.lat,
      next.lng,
    );

    // Calculate sun position
    const sunAzimuth = getSunAzimuth(
      current.lat,
      current.lng,
      current.timestamp,
    );
    const position = getSunPosition(
      current.lat,
      current.lng,
      current.timestamp,
    );
    const sunAltitude = (position.altitude * 180) / Math.PI;

    // Check if sun is above horizon
    const isSunUp = sunAltitude > MIN_SUN_ALTITUDE;
    if (isSunUp) hasSunlight = true;

    // Calculate relative angle
    const relativeAngle = normalizeAngle(sunAzimuth - busHeading);

    // Determine which side
    const side = isSunUp ? determineSide(relativeAngle) : "neutral";

    // How much of the sun actually comes through a side window
    const signedSide = Math.sin((relativeAngle * Math.PI) / 180); // + right, − left
    const sideFactor = Math.abs(signedSide);
    const heightFactor = isSunUp ? Math.cos((sunAltitude * Math.PI) / 180) : 0;
    const intensity = sideFactor * heightFactor;
    const glare =
      isSunUp &&
      sunAltitude < GLARE_MAX_ALTITUDE &&
      sideFactor > GLARE_MIN_SIDE_FACTOR;

    // Calculate segment distance
    const distance = calculateDistance(
      current.lat,
      current.lng,
      next.lat,
      next.lng,
    );

    if (signedSide > 0) rightExposure += distance * intensity;
    else leftExposure += distance * intensity;

    // Add to totals and accumulate the sun direction for the relevant side
    const azimuthRad = (sunAzimuth * Math.PI) / 180;
    if (side === "left") {
      totalLeftDistance += distance;
      leftSin += distance * Math.sin(azimuthRad);
      leftCos += distance * Math.cos(azimuthRad);
    } else if (side === "right") {
      totalRightDistance += distance;
      rightSin += distance * Math.sin(azimuthRad);
      rightCos += distance * Math.cos(azimuthRad);
    } else {
      totalNeutralDistance += distance;
    }

    details.push({
      waypoint: current,
      sunAzimuth,
      busHeading,
      relativeAngle,
      side,
      sunAltitude,
      distance,
      endTimestamp: next.timestamp,
      intensity,
      glare,
    });
  }

  // Calculate percentages
  const totalDistance =
    totalLeftDistance + totalRightDistance + totalNeutralDistance;
  const leftPercentage =
    totalDistance > 0
      ? Math.round((totalLeftDistance / totalDistance) * 100)
      : 0;
  const rightPercentage =
    totalDistance > 0
      ? Math.round((totalRightDistance / totalDistance) * 100)
      : 0;

  const leftIntensity =
    totalDistance > 0 ? Math.round((leftExposure / totalDistance) * 100) : 0;
  const rightIntensity =
    totalDistance > 0 ? Math.round((rightExposure / totalDistance) * 100) : 0;

  // Which side is sunnier (by intensity), and the compass direction it faces
  let sunnySide: Side = "neutral";
  let sunnySideCompass: Compass | null = null;
  if (hasSunlight && leftExposure !== rightExposure) {
    sunnySide = leftExposure > rightExposure ? "left" : "right";
    const [sin, cos] =
      sunnySide === "left" ? [leftSin, leftCos] : [rightSin, rightCos];
    if (sin !== 0 || cos !== 0) {
      sunnySideCompass = azimuthToCompass((Math.atan2(sin, cos) * 180) / Math.PI);
    }
  }

  // Recommendation: a side only counts as sunnier with a clear margin.
  // Avoid → sit opposite the sunnier side. Seek → sit on it.
  let clearlySunnier: Side = "neutral";
  if (hasSunlight) {
    if (rightIntensity > leftIntensity + RECOMMENDATION_MARGIN) {
      clearlySunnier = "right";
    } else if (leftIntensity > rightIntensity + RECOMMENDATION_MARGIN) {
      clearlySunnier = "left";
    }
  }
  const recommendation: Side =
    clearlySunnier === "neutral" || mode === "seek"
      ? clearlySunnier
      : clearlySunnier === "left"
        ? "right"
        : "left";

  // Why no recommendation: one side IS sunnier by distance, but the sun is
  // mostly high overhead, so little of it comes through the side windows.
  let neutralReason: SunExposureResult["neutralReason"] = null;
  if (hasSunlight && recommendation === "neutral") {
    neutralReason =
      Math.abs(leftPercentage - rightPercentage) > RECOMMENDATION_MARGIN
        ? "overhead"
        : "balanced";
  }

  const sunnySideStrength =
    sunnySide === "neutral" ? null : strengthOf(details, sunnySide);
  const glare = longestGlare(details);

  // Generate summary
  let summary = "";
  if (!hasSunlight) {
    summary =
      "No direct sunlight during this journey (nighttime or low sun angle)";
  } else if (neutralReason === "overhead") {
    summary =
      "The sun is mostly high overhead, so little comes through the side windows - either side is fine";
  } else if (recommendation === "neutral") {
    summary = "Sun exposure is balanced - either side is fine";
  } else {
    const sunSide = clearlySunnier;
    const exposurePercent =
      sunSide === "left" ? leftPercentage : rightPercentage;
    const facing = sunnySideCompass
      ? ` (facing ${compassName(sunnySideCompass)})`
      : "";
    summary =
      mode === "seek"
        ? `Sit on the ${recommendation} side — it gets the sun${facing} for ${exposurePercent}% of the trip`
        : `Sit on the ${recommendation} side — the sun is mostly on your ${sunSide}${facing} for ${exposurePercent}% of the trip`;
  }

  return {
    leftPercentage,
    rightPercentage,
    leftIntensity,
    rightIntensity,
    sunnySideStrength,
    glare,
    neutralReason,
    recommendation,
    mode,
    sunnySide,
    sunnySideCompass,
    hasDirectSunlight: hasSunlight,
    waypointDetails: details,
    summary,
  };
}

/**
 * Average intensity on one side over the segments where the sun is on that
 * side, bucketed: strong ≥ 0.6, moderate ≥ 0.35, otherwise mild.
 */
function strengthOf(details: WaypointSunData[], side: Side): SunStrength | null {
  let weighted = 0;
  let distance = 0;
  for (const d of details) {
    if (d.side !== side) continue;
    weighted += d.intensity * d.distance;
    distance += d.distance;
  }
  if (distance === 0) return null;
  const average = weighted / distance;
  if (average >= 0.6) return "strong";
  if (average >= 0.35) return "moderate";
  return "mild";
}

/** Longest run of consecutive glare segments on the same side. */
function longestGlare(details: WaypointSunData[]): GlareWindow | null {
  let best: GlareWindow | null = null;
  let current: GlareWindow | null = null;
  const length = (w: GlareWindow) => w.end.getTime() - w.start.getTime();

  for (const d of details) {
    const side = d.side === "left" || d.side === "right" ? d.side : null;
    if (d.glare && side) {
      if (current && current.side === side) {
        current.end = d.endTimestamp;
      } else {
        current = { side, start: d.waypoint.timestamp, end: d.endTimestamp };
      }
      if (!best || length(current) > length(best)) best = { ...current };
    } else {
      current = null;
    }
  }
  return best;
}
