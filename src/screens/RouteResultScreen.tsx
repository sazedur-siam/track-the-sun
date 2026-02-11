import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AnimatedProgressCircle } from '@/src/components/AnimatedProgressCircle';
import BusDiagram from '@/src/components/BusDiagram';
import { saveFavoriteRoute } from '@/src/services/favoritesService';
import { formatDistance, formatDuration, Route } from '@/src/services/routingService';
import { calculateSunExposure, SunExposureResult } from '@/src/services/sunCalcService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function RouteResultScreen() {
  const params = useLocalSearchParams();
  const [sunData, setSunData] = useState<SunExposureResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  
  // Parse route data from params
  let route: Route | null = null;
  try {
    if (params.route) {
      const parsedRoute = JSON.parse(params.route as string);
      // Restore Date objects from strings
      if (parsedRoute.waypoints) {
        parsedRoute.waypoints = parsedRoute.waypoints.map((wp: any) => ({
          ...wp,
          timestamp: new Date(wp.timestamp),
        }));
      }
      route = parsedRoute;
    }
  } catch (e) {
    console.error('Failed to parse route:', e);
  }

  const fromName = params.fromName as string;
  const toName = params.toName as string;
  const departureTime = params.departureTime ? new Date(params.departureTime as string) : new Date();

  useEffect(() => {
    if (route && route.waypoints) {
      setIsCalculating(true);
      // Small delay to show loading state
      setTimeout(() => {
        const result = calculateSunExposure(route.waypoints);
        setSunData(result);
        setIsCalculating(false);
        // Success haptic feedback
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Fade in animation
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start();
      }, 500);
    }
  }, [params.route]);

  const handleSaveRoute = async () => {
    if (!route?.waypoints?.length) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const fromLocation = {
      lat: route.waypoints[0].lat,
      lng: route.waypoints[0].lng,
      name: fromName || "Start Location"
    };

    const toLocation = {
      lat: route.waypoints[route.waypoints.length - 1].lat,
      lng: route.waypoints[route.waypoints.length - 1].lng,
      name: toName || "Destination"
    };

    try {
      await saveFavoriteRoute(fromLocation, toLocation);
      Alert.alert('Saved', 'Route has been added to your favorites.');
    } catch (error) {
      Alert.alert('Error', 'Failed to save route.');
    }
  };

  if (!route) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorContainer}>
          <ThemedText type="title">❌ No Route Found</ThemedText>
          <ThemedText style={styles.errorText}>
            Unable to calculate route. Please try again.
          </ThemedText>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: theme.primary }]}
            onPress={() => router.back()}
          >
            <ThemedText style={styles.backButtonText}>Go Back</ThemedText>
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

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <ThemedText type="title" style={styles.title}>
              Analysis Result
            </ThemedText>
            <TouchableOpacity 
              onPress={handleSaveRoute}
              style={[styles.saveButton, { backgroundColor: theme.card }]}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="bookmark-plus-outline" size={24} color={theme.primary} />
              <ThemedText style={[styles.saveText, { color: theme.primary }]}>Save</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {isCalculating ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <ThemedText style={styles.loadingText}>
              Calculating sun position...
            </ThemedText>
          </View>
        ) : sunData ? (
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* Sun Exposure Results */}
            <View style={[styles.card, { borderColor: theme.primary, borderWidth: 2 }]}>
              <ThemedText type="subtitle" style={styles.cardTitle}>
                Direct Sun Percentage
              </ThemedText>

              {sunData.hasDirectSunlight ? (
                <>
                  <View style={styles.percentageContainer}>
                    <AnimatedProgressCircle
                      percentage={sunData.eastPercentage}
                      color={theme.primary}
                      textColor="#111827"
                      label="East Side"
                      delay={100}
                      size={80}
                      isHot={sunData.eastPercentage > sunData.westPercentage}
                      isCold={sunData.eastPercentage < sunData.westPercentage}
                    />

                    <ThemedText style={styles.percentageVs}>vs</ThemedText>

                    <AnimatedProgressCircle
                      percentage={sunData.westPercentage}
                      color={theme.secondary}
                      textColor={colorScheme === 'dark' ? '#111827' : '#FFFFFF'}
                      label="West Side"
                      delay={500}
                      size={80}
                      isHot={sunData.westPercentage > sunData.eastPercentage}
                      isCold={sunData.westPercentage < sunData.eastPercentage}
                    />
                  </View>

                  {/* Recommendation */}
                  {sunData.recommendation !== 'neutral' && (
                    <View style={[styles.recommendationBox, { backgroundColor: theme.card }]}>
                      <ThemedText style={styles.recommendationIcon}>✨</ThemedText>
                      <ThemedText style={[styles.recommendationTitle, { color: theme.primary }]}>
                        Recommendation
                      </ThemedText>
                      <ThemedText style={styles.recommendationText}>
                        {sunData.summary}
                      </ThemedText>
                    </View>
                  )}

                  {sunData.recommendation === 'neutral' && (
                    <View style={[styles.recommendationBox, { backgroundColor: theme.card }]}>
                      <ThemedText style={styles.neutralText}>
                        {sunData.summary}
                      </ThemedText>
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.noSunCard}>
                  <ThemedText style={styles.noSunIcon}>🌙</ThemedText>
                  <ThemedText style={styles.noSunText}>
                    {sunData.summary}
                  </ThemedText>
                </View>
              )}
            </View>

            {/* Bus Diagram */}
            {sunData.hasDirectSunlight && (
              <View style={[styles.card, { backgroundColor: theme.card }]}>
                <BusDiagram
                  eastPercentage={sunData.eastPercentage}
                  westPercentage={sunData.westPercentage}
                  recommendation={sunData.recommendation}
                />
              </View>
            )}

            {/* Route Details */}
            <View style={[styles.card, { backgroundColor: theme.card }]}>
              <ThemedText type="subtitle" style={styles.cardTitle}>
                📍 Journey Details
              </ThemedText>
              
              <View style={styles.locationRow}>
                <ThemedText style={styles.label}>From</ThemedText>
                <ThemedText style={styles.value} numberOfLines={2}>
                  {fromName}
                </ThemedText>
              </View>

              <View style={styles.locationRow}>
                <ThemedText style={styles.label}>To</ThemedText>
                <ThemedText style={styles.value} numberOfLines={2}>
                  {toName}
                </ThemedText>
              </View>
            </View>

            {/* Time & Distance */}
            <View style={[styles.card, { backgroundColor: theme.card }]}>
              <ThemedText type="subtitle" style={styles.cardTitle}>
                ⏱️ Time & Distance
              </ThemedText>

              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <ThemedText style={[styles.statValue, { color: theme.primary }]}>
                    {formatDistance(route.distance)}
                  </ThemedText>
                  <ThemedText style={styles.statLabel}>Distance</ThemedText>
                </View>

                <View style={styles.statItem}>
                  <ThemedText style={[styles.statValue, { color: theme.secondary }]}>
                    {formatDuration(route.duration)}
                  </ThemedText>
                  <ThemedText style={styles.statLabel}>Est. Duration*</ThemedText>
                </View>
              </View>

              <ThemedText style={styles.disclaimerText}>
                *Duration is estimated based on typical speeds and does not account for real-time traffic conditions.
              </ThemedText>

              <View style={[styles.timeRow, { borderTopColor: theme.border }]}>
                <View style={styles.timeItem}>
                  <ThemedText style={styles.timeLabel}>Departure</ThemedText>
                  <ThemedText style={styles.timeValue}>
                    {formatTime(departureTime)}
                  </ThemedText>
                </View>

                <ThemedText style={styles.timeArrow}>→</ThemedText>

                <View style={styles.timeItem}>
                  <ThemedText style={styles.timeLabel}>Arrival</ThemedText>
                  <ThemedText style={styles.timeValue}>
                    {formatTime(arrivalTime)}
                  </ThemedText>
                </View>
              </View>
            </View>
          </Animated.View>
        ) : null}

        {/* Back Button */}
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: theme.secondary }]}
          onPress={() => router.back()}
        >
          <ThemedText style={[styles.backButtonText, { color: colorScheme === 'dark' ? '#111827' : '#FFFFFF' }]}>
            Start New Search
          </ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 40,
    paddingBottom: 60,
  },
  header: {
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  saveText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  loadingContainer: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 20,
    opacity: 0.7,
  },
  card: {
    padding: 24,
    borderRadius: 24,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  cardTitle: {
    fontSize: 18,
    marginBottom: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  percentageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 20,
    overflow: 'visible',
  },
  percentageVs: {
    fontSize: 28,
    opacity: 0.5,
    fontWeight: '600',
  },
  recommendationBox: {
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
  },
  recommendationIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  recommendationTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.9,
  },
  neutralText: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
  },
  noSunCard: {
    padding: 30,
    alignItems: 'center',
  },
  noSunIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  noSunText: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 24,
  },
  locationRow: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    opacity: 0.5,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
    fontWeight: '700',
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 13,
    opacity: 0.7,
    marginTop: 4,
  },
  disclaimerText: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
  },
  timeItem: {
    flex: 1,
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  timeArrow: {
    fontSize: 20,
    marginHorizontal: 10,
    opacity: 0.3,
  },
  backButton: {
    paddingVertical: 20,
    borderRadius: 20,
    marginTop: 10,
    alignItems: 'center',
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  backButtonText: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  errorContainer: {
    padding: 24,    
    alignItems: 'center'
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 16,
    opacity: 0.7
  }
});
