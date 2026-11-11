import { bestWindow, DepartureSlot, downsampleWaypoints, scanDepartures, shiftRoute } from '../departurePlanner';
import { Route } from '../routingService';

const T0 = new Date('2026-12-21T04:00:00Z'); // 10:00 in Dhaka

/** Eastbound straight route in Dhaka: `points` waypoints, ~2.2 km apart, 1 h total. */
function eastbound(points = 41): Route {
  return {
    distance: 0,
    duration: 3600,
    provider: 'osrm',
    trafficAware: false,
    waypoints: Array.from({ length: points }, (_, i) => ({
      lat: 23.8,
      lng: 90.0 + i * 0.02,
      timestamp: new Date(T0.getTime() + (3600_000 * i) / (points - 1)),
    })),
  };
}

const slot = (minutes: number, score: number, hasSun = true): DepartureSlot => ({
  departure: new Date(T0.getTime() + minutes * 60_000),
  leftIntensity: 0,
  rightIntensity: score,
  score,
  hasSun,
  recommendation: 'left',
});

describe('shiftRoute', () => {
  it('moves the trip to the new departure and keeps the gaps', () => {
    const route = eastbound(5);
    const later = new Date(T0.getTime() + 90 * 60_000);
    const shifted = shiftRoute(route, later);

    expect(shifted.waypoints[0].timestamp.getTime()).toBe(later.getTime());
    shifted.waypoints.forEach((w, i) => {
      expect(w.timestamp.getTime() - route.waypoints[i].timestamp.getTime()).toBe(90 * 60_000);
      expect(w.lat).toBe(route.waypoints[i].lat);
    });
    // The original is untouched.
    expect(route.waypoints[0].timestamp.getTime()).toBe(T0.getTime());
  });
});

describe('downsampleWaypoints', () => {
  it('keeps both endpoints and drops points closer than the spacing', () => {
    const route = eastbound(41); // ~2 km apart
    const sampled = downsampleWaypoints(route.waypoints, 5000);
    expect(sampled[0]).toBe(route.waypoints[0]);
    expect(sampled[sampled.length - 1]).toBe(route.waypoints[40]);
    expect(sampled.length).toBeLessThan(20);
  });

  it('returns short lists unchanged', () => {
    const two = eastbound(2).waypoints;
    expect(downsampleWaypoints(two, 1e9)).toEqual(two);
  });
});

describe('scanDepartures', () => {
  it('returns one slot per step across the window, centred on the departure', () => {
    const slots = scanDepartures(eastbound(), T0, { windowMinutes: 60, stepMinutes: 15 });
    expect(slots).toHaveLength(9);
    expect(slots[4].departure.getTime()).toBe(T0.getTime());
    expect(slots[0].departure.getTime()).toBe(T0.getTime() - 60 * 60_000);
  });

  it('matches the normal calculation for the chosen departure', () => {
    const slots = scanDepartures(eastbound(), T0, { windowMinutes: 0 });
    // Eastbound around 10:00 in December: southern sun on the right.
    expect(slots[0].recommendation).toBe('left');
    expect(slots[0].rightIntensity).toBeGreaterThan(slots[0].leftIntensity);
    expect(slots[0].score).toBe(slots[0].rightIntensity);
  });

  it('marks night departures as having no sun', () => {
    const midnight = new Date('2026-12-21T18:00:00Z');
    const slots = scanDepartures(eastbound(), midnight, { windowMinutes: 30 });
    slots.forEach((s) => expect(s.hasSun).toBe(false));
  });

  it('flips the recommendation in seek mode', () => {
    const [avoid] = scanDepartures(eastbound(), T0, { windowMinutes: 0 });
    const [seek] = scanDepartures(eastbound(), T0, { windowMinutes: 0, mode: 'seek' });
    expect(avoid.recommendation).toBe('left');
    expect(seek.recommendation).toBe('right');
  });

  it('is fast enough for long routes', () => {
    // ~5,000 points over ~500 km.
    const long: Route = {
      ...eastbound(),
      waypoints: Array.from({ length: 5000 }, (_, i) => ({
        lat: 23.8,
        lng: 88 + i * 0.001,
        timestamp: new Date(T0.getTime() + i * 4000),
      })),
    };
    const startedAt = Date.now();
    const slots = scanDepartures(long, T0);
    expect(slots).toHaveLength(25);
    expect(Date.now() - startedAt).toBeLessThan(1000);
  });
});

describe('bestWindow', () => {
  it('finds the lowest-sun stretch when avoiding', () => {
    const slots = [slot(0, 60), slot(15, 30), slot(30, 12), slot(45, 10), slot(60, 14), slot(75, 50)];
    const best = bestWindow(slots, 'avoid');
    expect(best?.start.getTime()).toBe(slots[2].departure.getTime());
    expect(best?.end.getTime()).toBe(slots[4].departure.getTime());
    expect(best?.score).toBe(12);
  });

  it('finds the highest-sun stretch when seeking', () => {
    const slots = [slot(0, 60), slot(15, 70), slot(30, 72), slot(45, 20)];
    const best = bestWindow(slots, 'seek');
    expect(best?.start.getTime()).toBe(slots[1].departure.getTime());
    expect(best?.end.getTime()).toBe(slots[2].departure.getTime());
  });

  it('ignores night slots, even though they have no sun', () => {
    const slots = [slot(0, 0, false), slot(15, 0, false), slot(30, 40), slot(45, 25)];
    const best = bestWindow(slots, 'avoid');
    expect(best?.start.getTime()).toBe(slots[3].departure.getTime());
  });

  it('returns null when no slot has sun', () => {
    expect(bestWindow([slot(0, 0, false)], 'avoid')).toBeNull();
    expect(bestWindow([], 'avoid')).toBeNull();
  });

  it('prefers the longest qualifying stretch', () => {
    const slots = [slot(0, 10), slot(15, 40), slot(30, 11), slot(45, 12), slot(60, 13)];
    const best = bestWindow(slots, 'avoid');
    expect(best?.start.getTime()).toBe(slots[2].departure.getTime());
  });
});
