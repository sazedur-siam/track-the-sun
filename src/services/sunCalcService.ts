/**
 * Sun Calculation Service
 * Uses the suncalc library to calculate sun position
 */

import { RouteWaypoint } from "@/src/types";
import * as SunCalc from "suncalc";
import { calculateBearing } from "./routingService";

export interface WaypointSunData {
  waypoint: RouteWaypoint;
  sunAzimuth: number;
  busHeading: number;
  relativeAngle: number;
  side: "east" | "west" | "neutral";
  sunAltitude: number;
  distance: number;
}

export interface SunExposureResult {
  eastPercentage: number;
  westPercentage: number;
  recommendation: "east" | "west" | "neutral";
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
 * Determine which side of the vehicle the sun is on
 * @param relativeAngle - Angle between sun and vehicle heading (-180 to +180)
 */
function determineSide(relativeAngle: number): "east" | "west" | "neutral" {
  const absAngle = Math.abs(relativeAngle);

  // If sun is behind or ahead (not much side exposure)
  if (absAngle < 30 || absAngle > 150) {
    return "neutral";
  }

  // Right side (east-facing when heading north)
  if (relativeAngle > 0) {
    return "east";
  }

  // Left side (west-facing when heading north)
  return "west";
}

/**
 * Calculate sun exposure for entire route
 * @param waypoints - Array of route waypoints with timestamps
 * @returns Sun exposure analysis with percentages and recommendation
 */
export function calculateSunExposure(
  waypoints: RouteWaypoint[],
): SunExposureResult {
  if (waypoints.length < 2) {
    return {
      eastPercentage: 0,
      westPercentage: 0,
      recommendation: "neutral",
      hasDirectSunlight: false,
      waypointDetails: [],
      summary: "Route too short to analyze",
    };
  }

  const details: WaypointSunData[] = [];
  let totalEastDistance = 0;
  let totalWestDistance = 0;
  let totalNeutralDistance = 0;
  let hasSunlight = false;

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
    const isSunUp = sunAltitude > 0;
    if (isSunUp) hasSunlight = true;

    // Calculate relative angle
    const relativeAngle = normalizeAngle(sunAzimuth - busHeading);

    // Determine which side
    const side = isSunUp ? determineSide(relativeAngle) : "neutral";

    // Calculate segment distance
    const distance = calculateDistance(
      current.lat,
      current.lng,
      next.lat,
      next.lng,
    );

    // Add to totals
    if (side === "east") {
      totalEastDistance += distance;
    } else if (side === "west") {
      totalWestDistance += distance;
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
    });
  }

  // Calculate percentages
  const totalDistance =
    totalEastDistance + totalWestDistance + totalNeutralDistance;
  const eastPercentage =
    totalDistance > 0
      ? Math.round((totalEastDistance / totalDistance) * 100)
      : 0;
  const westPercentage =
    totalDistance > 0
      ? Math.round((totalWestDistance / totalDistance) * 100)
      : 0;

  // Determine recommendation (sit on opposite side to avoid sun)
  let recommendation: "east" | "west" | "neutral" = "neutral";
  if (!hasSunlight) {
    recommendation = "neutral";
  } else if (eastPercentage > westPercentage + 10) {
    recommendation = "west"; // Sit on west to avoid east sun
  } else if (westPercentage > eastPercentage + 10) {
    recommendation = "east"; // Sit on east to avoid west sun
  }

  // Generate summary
  let summary = "";
  if (!hasSunlight) {
    summary =
      "No direct sunlight during this journey (nighttime or low sun angle)";
  } else if (recommendation === "neutral") {
    summary = "Sun exposure is balanced - either side is fine";
  } else {
    const avoidSide = recommendation === "east" ? "west" : "east";
    const exposurePercent =
      recommendation === "east" ? westPercentage : eastPercentage;
    summary = `Sit on the ${recommendation} side to avoid ${exposurePercent}% sun exposure from the ${avoidSide}`;
  }

  return {
    eastPercentage,
    westPercentage,
    recommendation,
    hasDirectSunlight: hasSunlight,
    waypointDetails: details,
    summary,
  };
}
