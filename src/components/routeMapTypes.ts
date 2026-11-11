import { LatLng, SideSegment } from '@/src/utils/geometry';
import { StyleProp, ViewStyle } from 'react-native';

export interface RouteMapProps {
  segments: SideSegment[];
  start: LatLng;
  end: LatLng;
  /** Allow pan/zoom (full-screen view). The card preview is static. */
  interactive?: boolean;
  style?: StyleProp<ViewStyle>;
}
