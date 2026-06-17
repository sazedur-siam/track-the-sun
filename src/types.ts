/**
 * Shared TypeScript types and interfaces for TrackTheSun app
 */

export interface Location {
  lat: number;
  lng: number;
  name: string;
}

export interface RouteWaypoint {
  lat: number;
  lng: number;
  timestamp: Date;
  bearing?: number;
}

/** Side of the vehicle, relative to the direction of travel. */
export type Side = "left" | "right" | "neutral";

export interface SunSplit {
  leftPercentage: number;
  rightPercentage: number;
  details: WaypointSunData[];
  recommendation: Side;
  hasDirectSunlight: boolean;
}

export interface WaypointSunData {
  waypoint: RouteWaypoint;
  sunAzimuth: number;
  busHeading: number;
  relativeAngle: number;
  side: Side;
  sunAltitude: number;
}

export type SunAvoidance = "avoid" | "seek";
