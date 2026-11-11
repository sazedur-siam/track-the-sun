import { WaypointSunData } from '@/src/services/sunCalcService';
import { buildSideSegments, LatLng, simplifyPath } from '../geometry';

const pt = (latitude: number, longitude: number): LatLng => ({ latitude, longitude });

describe('simplifyPath', () => {
  it('collapses a straight line to its endpoints', () => {
    const line = Array.from({ length: 50 }, (_, i) => pt(23.8, 90 + i * 0.001));
    expect(simplifyPath(line)).toEqual([line[0], line[49]]);
  });

  it('keeps corners', () => {
    // East for ~1 km, then north for ~1 km.
    const east = Array.from({ length: 10 }, (_, i) => pt(23.8, 90 + i * 0.001));
    const north = Array.from({ length: 10 }, (_, i) => pt(23.8 + (i + 1) * 0.001, 90.009));
    const simplified = simplifyPath([...east, ...north]);
    expect(simplified).toHaveLength(3);
    expect(simplified[1]).toEqual(east[9]);
  });

  it('keeps small wiggles above the tolerance and drops those below', () => {
    const wiggle = [pt(0, 0), pt(0.0001, 0.0005), pt(0, 0.001)]; // ~11 m off the line
    expect(simplifyPath(wiggle, 15)).toHaveLength(2);
    expect(simplifyPath(wiggle, 5)).toHaveLength(3);
  });

  it('returns short paths unchanged', () => {
    expect(simplifyPath([pt(1, 1)])).toEqual([pt(1, 1)]);
  });
});

describe('buildSideSegments', () => {
  /** n waypoints heading east, ~111 m apart, with the given side per segment. */
  const route = (sides: WaypointSunData['side'][]) => {
    const waypoints = Array.from({ length: sides.length + 1 }, (_, i) => ({ lat: 0, lng: i * 0.001 }));
    const details = sides.map(
      (side, i) =>
        ({
          side,
          distance: 111,
          waypoint: { ...waypoints[i], timestamp: new Date(0) },
        }) as WaypointSunData
    );
    return { waypoints, details };
  };

  it('returns nothing for an empty route', () => {
    expect(buildSideSegments([], [])).toEqual([]);
  });

  it('groups consecutive segments by side', () => {
    const { waypoints, details } = route([...Array(5).fill('left'), ...Array(5).fill('right')]);
    const segments = buildSideSegments(waypoints, details);
    expect(segments.map((s) => s.side)).toEqual(['left', 'right']);
  });

  it('shares the boundary point so the line has no gaps', () => {
    const { waypoints, details } = route([...Array(5).fill('left'), ...Array(5).fill('right')]);
    const [left, right] = buildSideSegments(waypoints, details);
    expect(left.coordinates[left.coordinates.length - 1]).toEqual(right.coordinates[0]);
    expect(left.coordinates[0]).toEqual({ latitude: 0, longitude: 0 });
    expect(right.coordinates[right.coordinates.length - 1]).toEqual({ latitude: 0, longitude: 0.01 });
  });

  it('merges runs shorter than the minimum into the previous run', () => {
    // A single 111 m "neutral" blip between two long runs.
    const { waypoints, details } = route([
      ...Array(5).fill('right'),
      'neutral',
      ...Array(5).fill('right'),
      ...Array(5).fill('left'),
    ]);
    const segments = buildSideSegments(waypoints, details, { minRunMeters: 300 });
    expect(segments.map((s) => s.side)).toEqual(['right', 'left']);
  });

  it('scales the minimum run with route length', () => {
    // 100 segments (~11 km): a 2-segment (222 m) blip survives at 1 m minimum
    // but is merged once the minimum grows to 5% of the route (~555 m).
    const sides = [...Array(49).fill('right'), 'left', 'left', ...Array(49).fill('right')];
    const { waypoints, details } = route(sides);
    expect(buildSideSegments(waypoints, details, { minRunMeters: 1, minRunFraction: 0 })).toHaveLength(3);
    expect(buildSideSegments(waypoints, details, { minRunMeters: 1, minRunFraction: 0.05 })).toHaveLength(1);
  });

  it('merges a short first run into the next one', () => {
    const { waypoints, details } = route(['neutral', ...Array(6).fill('left')]);
    const segments = buildSideSegments(waypoints, details, { minRunMeters: 300 });
    expect(segments).toHaveLength(1);
    expect(segments[0].side).toBe('left');
    expect(segments[0].coordinates[0]).toEqual({ latitude: 0, longitude: 0 });
  });
});
