import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import BusDiagram from '@/src/components/BusDiagram';
import ExposureTimeline from '@/src/components/ExposureTimeline';
import { useTranslation } from '@/src/i18n/LanguageProvider';
import { saveFavoriteRoute } from '@/src/services/favoritesService';
import { getRoute, parseRouteResultParams, RouteResultParams } from '@/src/services/routeStore';
import { formatDistance, formatDuration, Route } from '@/src/services/routingService';
import { planRoute } from '@/src/services/settingsService';
import { calculateSunExposure } from '@/src/services/sunCalcService';
import { buildTimeline } from '@/src/services/timeline';
import { formatClock } from '@/src/utils/time';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function RouteResultScreen() {
  const {
    routeId,
    fromName,
    fromLat,
    fromLng,
    toName,
    toLat,
    toLng,
    departureTime: departureParam,
    mode: modeParam,
  } = useLocalSearchParams<RouteResultParams>();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const { t } = useTranslation();

  // Locations + time come from small URL params; the heavy route itself is
  // handed over in memory via routeStore (see src/services/routeStore.ts).
  const { from, to, departureTime, mode } = useMemo(
    () =>
      parseRouteResultParams({
        fromName,
        fromLat,
        fromLng,
        toName,
        toLat,
        toLng,
        departureTime: departureParam,
        mode: modeParam,
      }),
    [fromName, fromLat, fromLng, toName, toLat, toLng, departureParam, modeParam]
  );

  const storedRoute = useMemo(() => getRoute(routeId), [routeId]);

  // Fallback: the store is empty after a web refresh, deep link or app restart,
  // so recompute the route from the params.
  const fetchKey = `${fromLat},${fromLng}|${toLat},${toLng}|${departureParam}`;
  const [fetched, setFetched] = useState<{ key: string; route: Route | null } | null>(null);
  useEffect(() => {
    if (storedRoute || !from || !to) return;
    let cancelled = false;
    planRoute(from, to, departureTime).then((result) => {
      if (!cancelled) setFetched({ key: fetchKey, route: result });
    });
    return () => {
      cancelled = true;
    };
  }, [storedRoute, from, to, departureTime, fetchKey]);

  const fetchedRoute = fetched?.key === fetchKey ? fetched.route : undefined;
  const isFetching = !storedRoute && !!from && !!to && fetchedRoute === undefined;
  const route: Route | null = storedRoute ?? fetchedRoute ?? null;

  const sunData = useMemo(
    () => (route?.waypoints ? calculateSunExposure(route.waypoints, mode) : null),
    [route, mode]
  );

  const timeline = useMemo(() => (sunData ? buildTimeline(sunData.waypointDetails) : []), [sunData]);

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

    // Prefer the locations the user picked; fall back to the route's endpoints.
    const first = route.waypoints[0];
    const last = route.waypoints[route.waypoints.length - 1];
    const saveFrom = from ?? { lat: first.lat, lng: first.lng, name: 'Start Location' };
    const saveTo = to ?? { lat: last.lat, lng: last.lng, name: 'Destination' };

    try {
      await saveFavoriteRoute(saveFrom, saveTo, undefined, departureTime, mode);
      Alert.alert(t('result.savedTitle'), t('result.savedMsg'));
    } catch {
      Alert.alert(t('common.error'), t('result.saveErrorMsg'));
    }
  };

  if (isFetching) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText style={[styles.errorText, { color: theme.textSecondary }]}>{t('home.tracingSun')}</ThemedText>
        </View>
      </ThemedView>
    );
  }

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

  const recommends = sunData.recommendation !== 'neutral';
  const sitIcon = sunData.recommendation === 'left' ? 'arrow-left-bold' : 'arrow-right-bold';

  // Build the localized recommendation summary from structured fields.
  let summary: string;
  if (!sunData.hasDirectSunlight) {
    summary = t('result.summaryNoSun');
  } else if (!recommends) {
    summary = t(sunData.neutralReason === 'overhead' ? 'result.summaryOverhead' : 'result.summaryBalanced');
  } else {
    const seek = sunData.mode === 'seek';
    // Avoid: the sun is on the other side. Seek: the sun is on the seat's side.
    const sunSide = seek ? sunData.recommendation : sunData.recommendation === 'left' ? 'right' : 'left';
    const percent = sunSide === 'left' ? sunData.leftPercentage : sunData.rightPercentage;
    const params2 = {
      sit: t(`side.${sunData.recommendation}`),
      sun: t(`side.${sunSide}`),
      percent,
    };
    const key = seek ? 'result.summarySeek' : 'result.summaryRecommend';
    summary = sunData.sunnySideCompass
      ? t(key, { ...params2, facing: t(`compassFull.${sunData.sunnySideCompass}`) })
      : t(`${key}NoFacing`, params2);
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Google failed → we fell back to OSRM */}
          {route.fallback && (
            <View style={[styles.fallbackBanner, { backgroundColor: theme.accentSoft }]} accessibilityRole="alert">
              <MaterialCommunityIcons name="alert-outline" size={22} color={theme.warning} />
              <View style={styles.fallbackBody}>
                <ThemedText style={[styles.fallbackTitle, { color: theme.text }]}>{t('result.fallbackTitle')}</ThemedText>
                <ThemedText style={[styles.fallbackText, { color: theme.textSecondary }]}>
                  {t('result.fallbackMsg', { reason: t(`routingError.${route.fallback.reason}`) })}
                </ThemedText>
                <TouchableOpacity
                  onPress={() => router.push('/settings')}
                  accessibilityRole="button"
                  accessibilityLabel={t('result.openSettings')}
                  hitSlop={8}
                >
                  <ThemedText style={[styles.fallbackLink, { color: theme.secondary }]}>
                    {t('result.openSettings')}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          )}

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

              {sunData.sunnySideStrength && sunData.sunnySide !== 'neutral' && (
                <View style={[styles.insightRow, { backgroundColor: theme.inputBackground }]}>
                  <MaterialCommunityIcons name="white-balance-sunny" size={18} color={theme.primary} />
                  <ThemedText style={[styles.insightText, { color: theme.text }]}>
                    {t(`result.strength.${sunData.sunnySideStrength}`, { side: t(`side.${sunData.sunnySide}`) })}
                  </ThemedText>
                </View>
              )}

              {sunData.glare && (
                <View style={[styles.insightRow, { backgroundColor: theme.accentSoft }]}>
                  <MaterialCommunityIcons name="weather-sunny-alert" size={18} color={theme.warning} />
                  <ThemedText style={[styles.insightText, { color: theme.text }]}>
                    {t('result.glare', {
                      side: t(`side.${sunData.glare.side}`),
                      start: formatClock(sunData.glare.start),
                      end: formatClock(sunData.glare.end),
                    })}
                  </ThemedText>
                </View>
              )}
            </View>
          )}

          {/* Sun along the way (hidden for night or very short trips) */}
          {sunData.hasDirectSunlight && route.duration >= 300 && timeline.length > 0 && (
            <View style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.shadow }, Shadows.sm]}>
              <ThemedText type="subtitle" style={styles.cardTitle}>
                {t('timeline.title')}
              </ThemedText>
              <ExposureTimeline runs={timeline} />
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
                  {formatClock(departureTime)}
                </ThemedText>
                <ThemedText style={[styles.statLabel, { color: theme.textMuted }]}>{t('result.departure')}</ThemedText>
              </View>
              <View style={[styles.statDivider, { backgroundColor: theme.separator }]} />
              <View style={styles.statItem}>
                <ThemedText style={[styles.statValue, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit>
                  {formatClock(arrivalTime)}
                </ThemedText>
                <ThemedText style={[styles.statLabel, { color: theme.textMuted }]}>{t('result.arrival')}</ThemedText>
              </View>
            </View>

            <View style={styles.sourceRow}>
              <MaterialCommunityIcons
                name={route.provider === 'google' ? 'google-maps' : 'map-outline'}
                size={14}
                color={theme.textMuted}
              />
              <ThemedText style={[styles.sourceText, { color: theme.textMuted }]}>
                {t('result.routeBy', { provider: t(`provider.${route.provider}`) })}
                {route.trafficAware ? ` · ${t('result.liveTraffic')}` : ''}
              </ThemedText>
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
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginTop: Spacing.md,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  fallbackBanner: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    marginBottom: Spacing.lg,
  },
  fallbackBody: {
    flex: 1,
    gap: Spacing.xs,
  },
  fallbackTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  fallbackText: {
    fontSize: 14,
    lineHeight: 20,
  },
  fallbackLink: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: Spacing.xs,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.md,
  },
  sourceText: {
    fontSize: 12,
    fontWeight: '600',
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
