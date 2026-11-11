/**
 * Share
 *
 * Builds the text and link for sharing a result. The link carries only
 * locations, time and mode; the result screen recomputes the route from them
 * (see routeStore), so it works on a fresh install or a new browser tab.
 */

import { Location, SunAvoidance } from "@/src/types";
import { SunExposureResult } from "./sunCalcService";

type Translate = (key: string, params?: Record<string, string | number>) => string;

/** First part of a geocoded name: "Chattogram, Chittagong City, …" → "Chattogram". */
export function shortName(name: string, maxLength = 40): string {
  const first = (name.split(",")[0] ?? "").trim() || name.trim();
  return first.length > maxLength ? `${first.slice(0, maxLength - 1)}…` : first;
}

/** Query params for a shared `/route-result` link (no routeId: the receiver refetches). */
export function buildShareQueryParams(
  from: Location,
  to: Location,
  departureTime: Date,
  mode: SunAvoidance,
): Record<string, string> {
  return {
    fromName: shortName(from.name),
    fromLat: from.lat.toFixed(5),
    fromLng: from.lng.toFixed(5),
    toName: shortName(to.name),
    toLat: to.lat.toFixed(5),
    toLng: to.lng.toFixed(5),
    departureTime: departureTime.toISOString(),
    mode,
  };
}

/** `${base}/route-result?…`; a single trailing slash on the base is dropped. */
export function buildShareUrl(base: string, params: Record<string, string>): string {
  const query = new URLSearchParams(params).toString();
  return `${base.replace(/\/$/, "")}/route-result?${query}`;
}

/** The human part of the shared message, translated. */
export function buildShareMessage(
  t: Translate,
  from: Location,
  to: Location,
  departureTime: string,
  sun: Pick<SunExposureResult, "recommendation" | "mode" | "leftPercentage" | "rightPercentage">,
): string {
  const base = { from: shortName(from.name), to: shortName(to.name), time: departureTime };
  if (sun.recommendation === "neutral") return t("share.message.neutral", base);

  const seek = sun.mode === "seek";
  const sunSide = seek ? sun.recommendation : sun.recommendation === "left" ? "right" : "left";
  const percent = sunSide === "left" ? sun.leftPercentage : sun.rightPercentage;
  return t(seek ? "share.message.seek" : "share.message.avoid", {
    ...base,
    side: t(`side.${sun.recommendation}`),
    sunSide: t(`side.${sunSide}`),
    percent,
  });
}
