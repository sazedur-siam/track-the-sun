import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTranslation } from '@/src/i18n/LanguageProvider';
import { sideColor } from '@/src/utils/sideColors';
import React, { useCallback, useMemo, useRef } from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker, Polyline, Region } from 'react-native-maps';
import { RouteMapProps } from './routeMapTypes';

const EDGE_PADDING = { top: 40, right: 40, bottom: 40, left: 40 };

/**
 * Native route map (Apple Maps on iOS, Google Maps on Android).
 * Web uses RouteMap.web.tsx (Leaflet) because react-native-maps has no web support.
 */
export default function RouteMap({ segments, start, end, interactive = false, style }: RouteMapProps) {
  const scheme = useColorScheme();
  const theme = Colors[scheme ?? 'light'];
  const { t } = useTranslation();
  const mapRef = useRef<MapView>(null);

  const coordinates = useMemo(() => segments.flatMap((s) => s.coordinates), [segments]);

  // Start roughly framed (no flash at 0,0), then fit precisely once ready.
  const initialRegion = useMemo<Region>(() => {
    let [minLat, maxLat, minLng, maxLng] = [start.latitude, start.latitude, start.longitude, start.longitude];
    for (const c of coordinates) {
      minLat = Math.min(minLat, c.latitude);
      maxLat = Math.max(maxLat, c.latitude);
      minLng = Math.min(minLng, c.longitude);
      maxLng = Math.max(maxLng, c.longitude);
    }
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max((maxLat - minLat) * 1.4, 0.01),
      longitudeDelta: Math.max((maxLng - minLng) * 1.4, 0.01),
    };
  }, [coordinates, start]);

  const fit = useCallback(() => {
    if (coordinates.length > 1) {
      mapRef.current?.fitToCoordinates(coordinates, { edgePadding: EDGE_PADDING, animated: false });
    }
  }, [coordinates]);

  return (
    <MapView
      ref={mapRef}
      style={[styles.map, style]}
      initialRegion={initialRegion}
      onMapReady={fit}
      scrollEnabled={interactive}
      zoomEnabled={interactive}
      rotateEnabled={false}
      pitchEnabled={false}
      toolbarEnabled={false}
      userInterfaceStyle={scheme === 'dark' ? 'dark' : 'light'}
    >
      {segments.map((segment, i) => (
        <Polyline
          key={`${segment.side}-${i}`}
          coordinates={segment.coordinates}
          strokeColor={sideColor(theme, segment.side)}
          strokeWidth={5}
          lineCap="round"
          lineJoin="round"
        />
      ))}
      <Marker coordinate={start} pinColor={theme.secondary} title={t('map.start')} />
      <Marker coordinate={end} pinColor={theme.primary} title={t('map.end')} />
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
