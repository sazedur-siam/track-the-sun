import { WaypointSunData } from '../sunCalcService';
import { buildTimeline, sideRuns } from '../timeline';

const T0 = new Date('2026-11-11T02:00:00Z').getTime();
const MIN = 60_000;

/** Build fake segment data from [side, minutes] pairs laid end to end. */
function segments(spec: [WaypointSunData['side'], number][]): WaypointSunData[] {
  let t = T0;
  return spec.map(([side, minutes]) => {
    const start = new Date(t);
    t += minutes * MIN;
    return {
      waypoint: { lat: 0, lng: 0, timestamp: start },
      endTimestamp: new Date(t),
      side,
      sunAzimuth: 0,
      busHeading: 0,
      relativeAngle: 0,
      sunAltitude: 30,
      distance: 1000,
      intensity: 0.5,
      glare: false,
    };
  });
}

const summary = (runs: ReturnType<typeof buildTimeline>) =>
  runs.map((r) => `${r.side}:${(r.end.getTime() - r.start.getTime()) / MIN}`);

describe('buildTimeline', () => {
  it('returns no runs for no segments', () => {
    expect(buildTimeline([])).toEqual([]);
  });

  it('merges consecutive segments on the same side', () => {
    const runs = buildTimeline(segments([['right', 10], ['right', 15], ['left', 20], ['left', 5]]));
    expect(summary(runs)).toEqual(['right:25', 'left:25']);
  });

  it('absorbs short flips (e.g. at junctions) into the longer neighbour', () => {
    const runs = buildTimeline(
      segments([['right', 30], ['left', 1], ['right', 20], ['neutral', 1], ['left', 40]])
    );
    expect(summary(runs)).toEqual(['right:52', 'left:40']);
  });

  it('bridges short "no side sun" gaps inside one sunny stretch', () => {
    const runs = buildTimeline(
      segments([['right', 40], ['neutral', 6], ['right', 50], ['neutral', 30], ['right', 40]])
    );
    // The 6-minute gap is absorbed; the 30-minute one is real and stays.
    expect(summary(runs)).toEqual(['right:96', 'neutral:30', 'right:40']);
  });

  it('keeps runs that are long enough', () => {
    const runs = buildTimeline(segments([['left', 3], ['right', 3], ['left', 3]]), { minRunSeconds: 120 });
    expect(runs).toHaveLength(3);
  });

  it('caps the number of runs', () => {
    const spec: [WaypointSunData['side'], number][] = [];
    for (let i = 0; i < 30; i++) spec.push([i % 2 ? 'left' : 'right', 5 + (i % 3)]);
    const runs = buildTimeline(segments(spec), { maxRuns: 6 });
    expect(runs.length).toBeLessThanOrEqual(6);
  });

  it('always covers the whole trip without gaps', () => {
    const spec: [WaypointSunData['side'], number][] = [
      ['neutral', 4], ['right', 1], ['right', 12], ['left', 1], ['neutral', 2], ['left', 30], ['right', 1],
    ];
    const runs = buildTimeline(segments(spec));
    const total = spec.reduce((sum, [, m]) => sum + m, 0);

    expect(runs[0].start.getTime()).toBe(T0);
    expect(runs[runs.length - 1].end.getTime()).toBe(T0 + total * MIN);
    for (let i = 1; i < runs.length; i++) {
      expect(runs[i].start.getTime()).toBe(runs[i - 1].end.getTime());
      expect(runs[i].side).not.toBe(runs[i - 1].side);
    }
  });

  it('sideRuns drops the neutral stretches', () => {
    const runs = buildTimeline(segments([['neutral', 10], ['right', 10], ['neutral', 10]]));
    expect(sideRuns(runs).map((r) => r.side)).toEqual(['right']);
  });
});
