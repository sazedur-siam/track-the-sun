import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Route, formatDistance, formatDuration } from '@/src/services/routingService';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function RouteResultScreen() {
  const params = useLocalSearchParams();
  
  // Parse route data from params
  const route: Route = params.route ? JSON.parse(params.route as string) : null;
  const fromName = params.fromName as string;
  const toName = params.toName as string;
  const departureTime = params.departureTime ? new Date(params.departureTime as string) : new Date();

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

  const arrivalTime = new Date(
    departureTime.getTime() + route.duration * 1000
  );

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
            🗺️ Route Found
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Phase 3 will calculate sun exposure
          </ThemedText>
        </View>

        {/* Route Summary Card */}
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

        {/* Time & Distance Card */}
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

        {/* Waypoints Info */}
        <View style={styles.card}>
          <ThemedText type="subtitle" style={styles.cardTitle}>
            🛣️ Route Information
          </ThemedText>
          <ThemedText style={styles.infoText}>
            Route contains {route.waypoints.length} waypoints
          </ThemedText>
          <ThemedText style={styles.infoText}>
            Ready for sun exposure calculation (Phase 3)
          </ThemedText>
        </View>

        {/* Coming Soon Banner */}
        <View style={styles.comingSoonCard}>
          <ThemedText style={styles.comingSoonTitle}>☀️ Coming in Phase 3</ThemedText>
          <ThemedText style={styles.comingSoonText}>
            • Sun position calculation for each waypoint
          </ThemedText>
          <ThemedText style={styles.comingSoonText}>
            • East vs West side exposure percentage
          </ThemedText>
          <ThemedText style={styles.comingSoonText}>
            • Recommendation on which side to sit
          </ThemedText>
        </View>

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
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
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
  infoText: {
    fontSize: 16,
    marginBottom: 8,
    opacity: 0.8,
  },
  comingSoonCard: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 204, 0, 0.1)',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 204, 0, 0.3)',
  },
  comingSoonTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#FF9500',
  },
  comingSoonText: {
    fontSize: 15,
    marginBottom: 6,
    opacity: 0.8,
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
