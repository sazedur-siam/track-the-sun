import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { sideColor } from '@/src/utils/sideColors';
import 'leaflet/dist/leaflet.css';
import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { RouteMapProps } from './routeMapTypes';

type Leaflet = typeof import('leaflet');

/**
 * Web route map using Leaflet + OpenStreetMap tiles.
 * Leaflet touches `window` on import, so it is loaded lazily in an effect
 * (keeps Expo's static web rendering working).
 */
export default function RouteMap({ segments, start, end, interactive = false, style }: RouteMapProps) {
  const theme = Colors[useColorScheme() ?? 'light'];
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    let map: import('leaflet').Map | undefined;

    (async () => {
      const mod = await import('leaflet');
      const L: Leaflet = (mod as unknown as { default?: Leaflet }).default ?? mod;
      if (cancelled || !containerRef.current) return;

      map = L.map(containerRef.current, {
        zoomControl: interactive,
        dragging: interactive,
        touchZoom: interactive,
        scrollWheelZoom: interactive,
        doubleClickZoom: interactive,
        boxZoom: interactive,
        keyboard: interactive,
      });
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      const bounds: [number, number][] = [];
      for (const segment of segments) {
        const latLngs = segment.coordinates.map((c) => [c.latitude, c.longitude] as [number, number]);
        bounds.push(...latLngs);
        L.polyline(latLngs, {
          color: sideColor(theme, segment.side),
          weight: 5,
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(map);
      }

      const pin = (point: { latitude: number; longitude: number }, color: string) =>
        L.circleMarker([point.latitude, point.longitude], {
          radius: 7,
          color: '#FFFFFF',
          weight: 2,
          fillColor: color,
          fillOpacity: 1,
        }).addTo(map!);
      pin(start, theme.secondary);
      pin(end, theme.primary);

      if (bounds.length > 1) map.fitBounds(L.latLngBounds(bounds), { padding: [24, 24] });
      else map.setView([start.latitude, start.longitude], 13);
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [segments, start, end, interactive, theme]);

  return (
    <View style={[styles.container, style]}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
});
