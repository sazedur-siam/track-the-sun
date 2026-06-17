import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import BusDiagram from '@/src/components/BusDiagram';
import { useTranslation } from '@/src/i18n/LanguageProvider';
import { saveFavoriteRoute } from '@/src/services/favoritesService';
import { formatDistance, formatDuration, Route } from '@/src/services/routingService';
import { calculateSunExposure } from '@/src/services/sunCalcService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useRef } from 'react';
import { Alert, Animated, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function RouteResultScreen() {
  const params = useLocalSearchParams();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const { t } = useTranslation();

  const fromName = params.fromName as string;
  const toName = params.toName as string;

  // Parse the route once per param change instead of on every render.
  const route = useMemo<Route | null>(() => {
    if (!params.route) return null;
    try {
      const parsed = JSON.parse(params.route as string);
      if (parsed.waypoints) {
        parsed.waypoints = parsed.waypoints.map((wp: any) => ({
          ...wp,
          timestamp: new Date(wp.timestamp),
        }));
      }
      return parsed;
    } catch (e) {
      console.error('Failed to parse route:', e);
      return null;
    }
  }, [params.route]);

  const departureTime = useMemo(
    () => (params.departureTime ? new Date(params.departureTime as string) : new Date()),
    [params.departureTime]
  );

  const sunData = useMemo(
    () => (route?.waypoints ? calculateSunExposure(route.waypoints) : null),
    [route]
  );

  useEffect(() => {
    if (!sunData) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 450,
      useNativeDriver: true,
    }).start();
  }, [sunData, fadeAnim]);

  const handleSaveRoute = async () => {
    if (!route?.waypoints?.length) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const from = {
      lat: route.waypoints[0].lat,
      lng: route.waypoints[0].lng,
      name: fromName || 'Start Location',
    };
    const to = {
      lat: route.waypoints[route.waypoints.length - 1].lat,
      lng: route.waypoints[route.waypoints.length - 1].lng,
      name: toName || 'Destination',
    };

    try {
      await saveFavoriteRoute(from, to);
      Alert.alert(t('result.savedTitle'), t('result.savedMsg'));
    } catch {
      Alert.alert(t('common.error'), t('result.saveErrorMsg'));
    }
  };

  if (!route || !sunData) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="map-marker-off" size={48} color={theme.textMuted} />
          <ThemedText type="title" style={styles.errorTitle}>
            {t('result.noRouteTitle')}
          </ThemedText>
          <ThemedText style={[styles.errorText, { color: theme.textSecondary }]}>
            {t('result.noRouteText')}
          </ThemedText>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: theme.primary, shadowColor: theme.shadow }, Shadows.md]}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={t('result.goBackA11y')}
          >
            <ThemedText style={[styles.backButtonText, { color: theme.onPrimary }]}>{t('result.goBack')}</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  const arrivalTime = new Date(departureTime.getTime() + route.duration * 1000);
  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${displayHours}:${displayMinutes} ${ampm}`;
  };

  const recommends = sunData.recommendation !== 'neutral';
  const sitIcon = sunData.recommendation === 'left' ? 'arrow-left-bold' : 'arrow-right-bold';

  // Build the localized recommendation summary from structured fields.
  let summary: string;
  if (!sunData.hasDirectSunlight) {
    summary = t('result.summaryNoSun');
  } else if (!recommends) {
    summary = t('result.summaryBalanced');
  } else {
    const sunSide = sunData.recommendation === 'left' ? 'right' : 'left';
    const percent = sunSide === 'left' ? sunData.leftPercentage : sunData.rightPercentage;
    const params2 = {
      sit: t(`side.${sunData.recommendation}`),
      sun: t(`side.${sunSide}`),
      percent,
    };
    summary = sunData.sunnySideCompass
      ? t('result.summaryRecommend', {
          ...params2,
          facing: t(`compassFull.${sunData.sunnySideCompass}`),
        })
      : t('result.summaryRecommendNoFacing', params2);
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Hero recommendation */}
          {!sunData.hasDirectSunlight ? (
            <View style={[styles.hero, { backgroundColor: theme.card, shadowColor: theme.shadow }, Shadows.md]}>
              <ThemedText style={styles.heroEmoji}>🌙</ThemedText>
              <ThemedText type="subtitle" style={styles.heroTitle}>
                {t('result.eitherSide')}
              </ThemedText>
              <ThemedText style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
                {summary}
              </ThemedText>
            </View>
          ) : recommends ? (
            <View style={[styles.hero, { backgroundColor: theme.primary, shadowColor: theme.shadow }, Shadows.lg]}>
              <ThemedText style={[styles.heroLabel, { color: theme.onPrimary }]}>{t('result.recommendedSeat')}</ThemedText>
              <View style={styles.heroSeatRow}>
                <MaterialCommunityIcons name={sitIcon} size={36} color={theme.onPrimary} />
                <ThemedText style={[styles.heroSeat, { color: theme.onPrimary }]}>
                  {t('result.sitOnSide', { side: t(`side.${sunData.recommendation}`) })}
                </ThemedText>
              </View>
              <ThemedText style={[styles.heroSubtitle, { color: theme.onPrimary, opacity: 0.85 }]}>
                {summary}
              </ThemedText>
            </View>
          ) : (
            <View style={[styles.hero, { backgroundColor: theme.card, shadowColor: theme.shadow }, Shadows.md]}>
              <ThemedText style={styles.heroEmoji}>⚖️</ThemedText>
              <ThemedText type="subtitle" style={styles.heroTitle}>
                {t('result.balancedExposure')}
              </ThemedText>
              <ThemedText style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
                {summary}
              </ThemedText>
            </View>
          )}

          {/* Sun on each side */}
          {sunData.hasDirectSunlight && (
            <View style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.shadow }, Shadows.sm]}>
              <ThemedText type="subtitle" style={styles.cardTitle}>
                {t('result.sunEachSide')}
              </ThemedText>

              <BusDiagram
                leftPercentage={sunData.leftPercentage}
                rightPercentage={sunData.rightPercentage}
                recommendation={sunData.recommendation}
                sunnySide={sunData.sunnySide}
                sunnySideCompass={sunData.sunnySideCompass}
              />
            </View>
          )}

          {/* Journey details */}
          <View style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.shadow }, Shadows.sm]}>
            <ThemedText type="subtitle" style={styles.cardTitle}>
              {t('result.journey')}
            </ThemedText>

            <View style={styles.journeyRow}>
              <MaterialCommunityIcons name="circle-outline" size={18} color={theme.secondary} />
              <ThemedText style={[styles.journeyText, { color: theme.text }]} numberOfLines={2}>
                {fromName}
              </ThemedText>
            </View>
            <View style={[styles.journeyConnector, { backgroundColor: theme.border }]} />
            <View style={styles.journeyRow}>
              <MaterialCommunityIcons name="map-marker" size={18} color={theme.primary} />
              <ThemedText style={[styles.journeyText, { color: theme.text }]} numberOfLines={2}>
                {toName}
              </ThemedText>
            </View>

            <View style={[styles.statsGrid, { borderTopColor: theme.separator }]}>
              <View style={styles.statItem}>
                <ThemedText style={[styles.statValue, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit>
                  {formatDistance(route.distance, { km: t('units.km'), m: t('units.m') })}
                </ThemedText>
                <ThemedText style={[styles.statLabel, { color: theme.textMuted }]}>{t('result.distance')}</ThemedText>
              </View>
              <View style={[styles.statDivider, { backgroundColor: theme.separator }]} />
              <View style={styles.statItem}>
                <ThemedText style={[styles.statValue, { color: theme.primary }]} numberOfLines={1} adjustsFontSizeToFit>
                  {formatDuration(route.duration, { hour: t('units.hour'), min: t('units.min') })}
                </ThemedText>
                <ThemedText style={[styles.statLabel, { color: theme.textMuted }]}>{t('result.travelTime')}</ThemedText>
              </View>
              <View style={[styles.statDivider, { backgroundColor: theme.separator }]} />
              <View style={styles.statItem}>
                <ThemedText style={[styles.statValue, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit>
                  {formatTime(departureTime)}
                </ThemedText>
                <ThemedText style={[styles.statLabel, { color: theme.textMuted }]}>{t('result.departure')}</ThemedText>
              </View>
              <View style={[styles.statDivider, { backgroundColor: theme.separator }]} />
              <View style={styles.statItem}>
                <ThemedText style={[styles.statValue, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit>
                  {formatTime(arrivalTime)}
                </ThemedText>
                <ThemedText style={[styles.statLabel, { color: theme.textMuted }]}>{t('result.arrival')}</ThemedText>
              </View>
            </View>

            <ThemedText style={[styles.disclaimerText, { color: theme.textMuted }]}>
              {t('result.disclaimer')}
            </ThemedText>
          </View>
        </Animated.View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.secondaryButton, { backgroundColor: theme.inputBackground }]}
            onPress={handleSaveRoute}
            accessibilityRole="button"
            accessibilityLabel={t('result.saveA11y')}
          >
            <MaterialCommunityIcons name="bookmark-outline" size={20} color={theme.text} />
            <ThemedText style={[styles.secondaryButtonText, { color: theme.text }]}>{t('common.save')}</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: theme.primary, shadowColor: theme.shadow }, Shadows.md]}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={t('result.newSearchA11y')}
          >
            <ThemedText style={[styles.backButtonText, { color: theme.onPrimary }]}>{t('result.newSearch')}</ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl + Spacing.lg,
  },
  hero: {
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  heroEmoji: {
    fontSize: 40,
    marginBottom: Spacing.sm,
  },
  heroLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: Spacing.sm,
    opacity: 0.8,
  },
  heroSeatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  heroSeat: {
    fontSize: 22,
    fontWeight: '800',
    flexShrink: 1,
  },
  heroTitle: {
    marginBottom: Spacing.xs,
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  card: {
    padding: Spacing.xl,
    borderRadius: Radius.xl,
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  journeyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  journeyConnector: {
    width: 2,
    height: 18,
    marginLeft: 8,
    marginVertical: 2,
  },
  journeyText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 32,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  disclaimerText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: Spacing.lg,
    lineHeight: 17,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 18,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.lg,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  errorContainer: {
    flex: 1,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 400,
    gap: Spacing.md,
  },
  errorTitle: {
    textAlign: 'center',
  },
  errorText: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
});
