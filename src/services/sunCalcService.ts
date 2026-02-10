/**
 * Sun Calculation Service
 * Uses the suncalc library to calculate sun position
 * Phase 3: Core sun position calculation logic will be implemented here
 */

import * as SunCalc from "suncalc";

/**
 * Calculate sun position at a given location and time
 * @param lat - Latitude
 * @param lng - Longitude
 * @param date - Date/time for calculation
 */
export function getSunPosition(lat: number, lng: number, date: Date) {
  return SunCalc.getPosition(date, lat, lng);
}

/**
 * Get sun azimuth (direction) in degrees
 * @param lat - Latitude
 * @param lng - Longitude
 * @param date - Date/time for calculation
 * @returns Azimuth in degrees (0° = North, 90° = East, 180° = South, 270° = West)
 */
export function getSunAzimuth(lat: number, lng: number, date: Date): number {
  const position = getSunPosition(lat, lng, date);
  // Convert from radians to degrees and normalize
  const azimuthDegrees = (position.azimuth * 180) / Math.PI + 180;
  return azimuthDegrees;
}

/**
 * Check if the sun is above the horizon
 * @param lat - Latitude
 * @param lng - Longitude
 * @param date - Date/time for calculation
 */
export function isSunAboveHorizon(
  lat: number,
  lng: number,
  date: Date,
): boolean {
  const position = getSunPosition(lat, lng, date);
  return position.altitude > 0;
}

// TODO: Phase 3 - Implement calculateSunSplit function
// export function calculateSunSplit(waypoints, departureTime) { ... }
