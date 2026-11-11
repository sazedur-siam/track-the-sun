import { ThemedText } from '@/components/themed-text';
import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTranslation } from '@/src/i18n/LanguageProvider';
import { Side } from '@/src/services/sunCalcService';
import { googleMapsDirectionsUrl, nativeMapAvailable } from '@/src/utils/mapSupport';
import { sideColor } from '@/src/utils/sideColors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import React, { useState } from 'react';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RouteMap from './RouteMap';
import { RouteMapProps } from './routeMapTypes';

const LEGEND: Side[] = ['left', 'right', 'neutral'];

/** Result-screen card: static map preview + legend, expandable to an interactive full-screen map. */
export default function RouteMapCard(props: Omit<RouteMapProps, 'interactive' | 'style'>) {
  const theme = Colors[useColorScheme() ?? 'light'];
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  // No safe in-app map in this build (Android without a Maps key): offer
  // Google Maps instead of rendering a MapView that would crash the app.
  if (!nativeMapAvailable()) {
    return (
      <View style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.shadow }, Shadows.sm]}>
        <ThemedText type="subtitle">{t('map.title')}</ThemedText>
        <ThemedText style={[styles.unavailableText, { color: theme.textSecondary }]}>
          {t('map.unavailable')}
        </ThemedText>
        <TouchableOpacity
          style={[styles.openButton, { backgroundColor: theme.inputBackground }]}
          onPress={() => Linking.openURL(googleMapsDirectionsUrl(props.start, props.end))}
          accessibilityRole="link"
          accessibilityLabel={t('map.openGoogleMaps')}
        >
          <MaterialCommunityIcons name="google-maps" size={18} color={theme.text} />
          <ThemedText style={[styles.openButtonText, { color: theme.text }]}>{t('map.openGoogleMaps')}</ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  const legend = (
    <View style={styles.legend}>
      {LEGEND.map((side) => (
        <View key={side} style={styles.legendItem}>
          <View style={[styles.swatch, { backgroundColor: sideColor(theme, side) }]} />
          <ThemedText style={[styles.legendText, { color: theme.textSecondary }]}>{t(`timeline.${side}`)}</ThemedText>
        </View>
      ))}
    </View>
  );

  return (
    <View style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.shadow }, Shadows.sm]}>
      <View style={styles.header}>
        <ThemedText type="subtitle">{t('map.title')}</ThemedText>
        <TouchableOpacity
          style={[styles.expandButton, { backgroundColor: theme.inputBackground }]}
          onPress={() => setExpanded(true)}
          accessibilityRole="button"
          accessibilityLabel={t('map.expand')}
          hitSlop={8}
        >
          <MaterialCommunityIcons name="arrow-expand" size={18} color={theme.text} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setExpanded(true)}
        accessibilityRole="button"
        accessibilityLabel={t('map.expand')}
        style={[styles.preview, { backgroundColor: theme.inputBackground }]}
      >
        {/* pointerEvents none: the preview is a tap target, not a map to drag. */}
        <View style={styles.previewInner}>
          <RouteMap {...props} />
        </View>
      </TouchableOpacity>

      {legend}

      <Modal visible={expanded} animationType="slide" onRequestClose={() => setExpanded(false)}>
        <SafeAreaView style={[styles.fill, { backgroundColor: theme.background }]}>
          <View style={styles.modalHeader}>
            <ThemedText type="subtitle">{t('map.title')}</ThemedText>
            <TouchableOpacity
              onPress={() => setExpanded(false)}
              accessibilityRole="button"
              accessibilityLabel={t('map.close')}
              hitSlop={8}
            >
              <MaterialCommunityIcons name="close" size={26} color={theme.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.fill}>{expanded && <RouteMap {...props} interactive />}</View>
          <View style={styles.modalLegend}>{legend}</View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  expandButton: {
    padding: Spacing.sm,
    borderRadius: Radius.sm,
  },
  preview: {
    height: 220,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  fill: {
    flex: 1,
  },
  previewInner: {
    flex: 1,
    pointerEvents: 'none',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  swatch: {
    width: 18,
    height: 5,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  unavailableText: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: Spacing.sm,
  },
  openButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    marginTop: Spacing.md,
  },
  openButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  modalLegend: {
    paddingBottom: Spacing.lg,
  },
});
