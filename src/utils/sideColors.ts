import { Colors } from '@/constants/theme';
import { Side } from '@/src/services/sunCalcService';

type Theme = (typeof Colors)['light'];

/**
 * One color per side of the vehicle, shared by the timeline and the map:
 * amber = sun on the left, sky blue = sun on the right, slate grey = neither
 * (dark enough to stay visible on map tiles).
 */
export function sideColor(theme: Theme, side: Side): string {
  if (side === 'left') return theme.primary;
  if (side === 'right') return theme.secondary;
  return theme.textMuted;
}
