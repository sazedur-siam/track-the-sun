import { ThemedText } from '@/components/themed-text';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface BusDiagramProps {
  eastPercentage: number;
  westPercentage: number;
  recommendation: 'east' | 'west' | 'neutral';
}

export default function BusDiagram({
  eastPercentage,
  westPercentage,
  recommendation,
}: BusDiagramProps) {
  const getIntensity = (percentage: number) => {
    if (percentage > 70) return 1;
    if (percentage > 40) return 0.6;
    if (percentage > 10) return 0.3;
    return 0.1;
  };

  const eastIntensity = getIntensity(eastPercentage);
  const westIntensity = getIntensity(westPercentage);

  return (
    <View style={styles.container}>
      <ThemedText style={styles.label}>Bus Side View</ThemedText>
      
      <View style={styles.busContainer}>
        {/* West Side (Left) */}
        <View style={styles.sideContainer}>
          <ThemedText style={styles.sideLabel}>West</ThemedText>
          <View
            style={[
              styles.busSide,
              styles.westSide,
              {
                backgroundColor: `rgba(92, 200, 250, ${westIntensity})`,
                borderColor: recommendation === 'west' ? '#34C759' : 'transparent',
                borderWidth: recommendation === 'west' ? 3 : 2,
              },
            ]}
          >
            {westPercentage > 0 && (
              <ThemedText style={styles.sunIcon}>
                {westPercentage > 50 ? '☀️☀️' : '☀️'}
              </ThemedText>
            )}
          </View>
          {recommendation === 'west' && (
            <ThemedText style={styles.recommendBadge}>✓ Sit here</ThemedText>
          )}
        </View>

        {/* Bus Body */}
        <View style={styles.busBody}>
          <View style={styles.busFront} />
          <View style={styles.busMiddle}>
            <View style={styles.window} />
            <View style={styles.window} />
            <View style={styles.window} />
          </View>
          <View style={styles.busBack} />
          <ThemedText style={styles.busLabel}>🚌</ThemedText>
        </View>

        {/* East Side (Right) */}
        <View style={styles.sideContainer}>
          <ThemedText style={styles.sideLabel}>East</ThemedText>
          <View
            style={[
              styles.busSide,
              styles.eastSide,
              {
                backgroundColor: `rgba(255, 149, 0, ${eastIntensity})`,
                borderColor: recommendation === 'east' ? '#34C759' : 'transparent',
                borderWidth: recommendation === 'east' ? 3 : 2,
              },
            ]}
          >
            {eastPercentage > 0 && (
              <ThemedText style={styles.sunIcon}>
                {eastPercentage > 50 ? '☀️☀️' : '☀️'}
              </ThemedText>
            )}
          </View>
          {recommendation === 'east' && (
            <ThemedText style={styles.recommendBadge}>✓ Sit here</ThemedText>
          )}
        </View>
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FF9500' }]} />
          <ThemedText style={styles.legendText}>East sun exposure</ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#5AC8FA' }]} />
          <ThemedText style={styles.legendText}>West sun exposure</ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  busContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  sideContainer: {
    alignItems: 'center',
    gap: 8,
  },
  sideLabel: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.6,
  },
  busSide: {
    width: 60,
    height: 120,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  westSide: {
    borderColor: '#5AC8FA',
  },
  eastSide: {
    borderColor: '#FF9500',
  },
  sunIcon: {
    fontSize: 24,
  },
  recommendBadge: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '700',
  },
  busBody: {
    width: 80,
    height: 140,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  busFront: {
    width: 70,
    height: 20,
    backgroundColor: '#FFD60A',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  busMiddle: {
    width: 70,
    height: 80,
    backgroundColor: '#FFD60A',
    gap: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  window: {
    width: 50,
    height: 16,
    backgroundColor: '#87CEEB',
    borderRadius: 4,
  },
  busBack: {
    width: 70,
    height: 20,
    backgroundColor: '#FFD60A',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  busLabel: {
    fontSize: 28,
    position: 'absolute',
    top: '45%',
  },
  legend: {
    marginTop: 20,
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 14,
    opacity: 0.7,
  },
});
