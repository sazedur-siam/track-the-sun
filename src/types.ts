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

export interface SunSplit {
  eastPercentage: number;
  westPercentage: number;
  details: WaypointSunData[];
  recommendation: "east" | "west" | "neutral";
  hasDirectSunlight: boolean;
}

export interface WaypointSunData {
  waypoint: RouteWaypoint;
  sunAzimuth: number;
  busHeading: number;
  relativeAngle: number;
  side: "east" | "west" | "neutral";
  sunAltitude: number;
}

export type SunAvoidance = "avoid" | "seek";
