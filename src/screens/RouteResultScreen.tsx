import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AnimatedProgressCircle } from '@/src/components/AnimatedProgressCircle';
import { formatDistance, formatDuration, Route } from '@/src/services/routingService';
import { calculateSunExposure, SunExposureResult } from '@/src/services/sunCalcService';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function RouteResultScreen() {
  const params = useLocalSearchParams();
  const [sunData, setSunData] = useState<SunExposureResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Parse route data from params
  const route: Route = params.route ? JSON.parse(params.route as string) : null;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.route]);

  if (!route) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorContainer}>
          <ThemedText type="title">❌ No Route Found</ThemedText>
          <ThemedText style={styles.errorText}>
            Unable to calculate route. Please try again.
          </ThemedText>
          <TouchableOpacity
            style={styles.backButton}
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
          <ThemedText type="title" style={styles.title}>
            ☀️ Sun Exposure Analysis
          </ThemedText>
        </View>

        {isCalculating ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFA500" />
            <ThemedText style={styles.loadingText}>
              Calculating sun position...
            </ThemedText>
          </View>
        ) : sunData ? (
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* Sun Exposure Results */}
            <View style={styles.sunCard}>
              <ThemedText type="subtitle" style={styles.sunCardTitle}>
                ☀️ Sun Exposure
              </ThemedText>

              {sunData.hasDirectSunlight ? (
                <>
                  <View style={styles.percentageContainer}>
                    <AnimatedProgressCircle
                      percentage={sunData.eastPercentage}
                      color="#FF9500"
                      label="East Side"
                      delay={300}
                    />

                    <ThemedText style={styles.percentageVs}>vs</ThemedText>

                    <AnimatedProgressCircle
                      percentage={sunData.westPercentage}
                      color="#5AC8FA"
                      label="West Side"
                      delay={500}
                    />
                  </View>

                  {/* Recommendation */}
                  {sunData.recommendation !== 'neutral' && (
                    <View style={styles.recommendationCard}>
                      <ThemedText style={styles.recommendationIcon}>💺</ThemedText>
                      <ThemedText style={styles.recommendationTitle}>
                        Recommendation
                      </ThemedText>
                      <ThemedText style={styles.recommendationText}>
                        {sunData.summary}
                      </ThemedText>
                    </View>
                  )}

                  {sunData.recommendation === 'neutral' && (
                    <View style={styles.neutralCard}>
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

            {/* Route Details */}
            <View style={styles.card}>
              <ThemedText type="subtitle" style={styles.cardTitle}>
                📍 Journey Details
              </ThemedText>
              
              <View style={styles.locationRow}>
                <ThemedText style={styles.label}>From:</ThemedText>
                <ThemedText style={styles.value} numberOfLines={2}>
                  {fromName}
                </ThemedText>
              </View>

              <View style={styles.locationRow}>
                <ThemedText style={styles.label}>To:</ThemedText>
                <ThemedText style={styles.value} numberOfLines={2}>
                  {toName}
                </ThemedText>
              </View>
            </View>

            {/* Time & Distance */}
            <View style={styles.card}>
              <ThemedText type="subtitle" style={styles.cardTitle}>
                ⏱️ Time & Distance
              </ThemedText>

              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <ThemedText style={styles.statValue}>
                    {formatDistance(route.distance)}
                  </ThemedText>
                  <ThemedText style={styles.statLabel}>Distance</ThemedText>
                </View>

                <View style={styles.statItem}>
                  <ThemedText style={styles.statValue}>
                    {formatDuration(route.duration)}
                  </ThemedText>
                  <ThemedText style={styles.statLabel}>Duration</ThemedText>
                </View>
              </View>

              <View style={styles.timeRow}>
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
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ThemedText style={styles.backButtonText}>
            ← Plan Another Route
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
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
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
  sunCard: {
    padding: 24,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 165, 0, 0.3)',
  },
  sunCardTitle: {
    fontSize: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  percentageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 24,
  },
  percentageVs: {
    fontSize: 20,
    opacity: 0.5,
    fontWeight: '600',
  },
  recommendationCard: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
    alignItems: 'center',
  },
  recommendationIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  recommendationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#34C759',
  },
  recommendationText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  neutralCard: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(142, 142, 147, 0.15)',
    alignItems: 'center',
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
  card: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    marginBottom: 16,
  },
  locationRow: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
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
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  timeItem: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  timeArrow: {
    fontSize: 24,
    marginHorizontal: 10,
    opacity: 0.5,
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 10,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
});
