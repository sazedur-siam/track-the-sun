import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
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
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const getIntensity = (percentage: number) => {
    if (percentage > 70) return 0.8;
    if (percentage > 40) return 0.5;
    if (percentage > 10) return 0.2;
    return 0.05;
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
           <View style={[
              styles.busSide,
              styles.sideOutline,
              {
                borderColor: recommendation === 'west' ? theme.secondary : theme.border,
                borderWidth: recommendation === 'west' ? 3 : 1,
                backgroundColor: 'transparent'
              }
           ]}>
              <View style={[
                StyleSheet.absoluteFill, 
                { 
                  backgroundColor: theme.primary, 
                  opacity: westIntensity, 
                  borderRadius: 6 
                }
              ]} />
              {westPercentage > 0 && (
                <ThemedText style={styles.sunIcon}>
                  {westPercentage > 50 ? '☀️☀️' : '☀️'}
                </ThemedText>
              )}
           </View>

          {recommendation === 'west' && (
            <ThemedText style={[styles.recommendBadge, { color: theme.secondary }]}>✓ Sit here</ThemedText>
          )}
        </View>

        {/* Bus Body */}
        <View style={styles.busBody}>
          <View style={[styles.busFront, { backgroundColor: theme.primary }]} />
          <View style={[styles.busMiddle, { backgroundColor: theme.primary }]}>
            <View style={[styles.window, { backgroundColor: '#E2E8F0' }]} />
            <View style={[styles.window, { backgroundColor: '#E2E8F0' }]} />
            <View style={[styles.window, { backgroundColor: '#E2E8F0' }]} />
          </View>
          <View style={[styles.busBack, { backgroundColor: theme.primary }]} />
          <ThemedText style={styles.busLabel}>🚌</ThemedText>
        </View>

        {/* East Side (Right) */}
        <View style={styles.sideContainer}>
          <ThemedText style={styles.sideLabel}>East</ThemedText>
           <View style={[
              styles.busSide,
              styles.sideOutline,
              {
                borderColor: recommendation === 'east' ? theme.secondary : theme.border,
                borderWidth: recommendation === 'east' ? 3 : 1,
                backgroundColor: 'transparent'
              }
           ]}>
              <View style={[
                StyleSheet.absoluteFill, 
                { 
                  backgroundColor: theme.primary, 
                  opacity: eastIntensity, 
                  borderRadius: 6 
                }
              ]} />
              {/* Sun Icon Logic */}
              {eastPercentage > 0 && (
                <ThemedText style={styles.sunIcon}>
                  {eastPercentage > 50 ? '☀️☀️' : '☀️'}
                </ThemedText>
              )}
           </View>
          {recommendation === 'east' && (
            <ThemedText style={[styles.recommendBadge, { color: theme.secondary }]}>✓ Sit here</ThemedText>
          )}
        </View>
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.primary }]} />
          <ThemedText style={styles.legendText}>Sun intensity (Yellow)</ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.borderDot, { borderColor: theme.secondary }]} />
          <ThemedText style={styles.legendText}>Recommended Seat</ThemedText>
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
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sideOutline: {
    borderStyle: 'solid',
  },
  sunIcon: {
    fontSize: 24,
    zIndex: 1,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  recommendBadge: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
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
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  busMiddle: {
    width: 70,
    height: 80,
    gap: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  window: {
    width: 50,
    height: 16,
    borderRadius: 4,
  },
  busBack: {
    width: 70,
    height: 20,
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
    alignItems: 'center', 
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
  borderDot: {
    width: 14,
    height: 14,
    borderRadius: 4,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  legendText: {
    fontSize: 14,
    opacity: 0.7,
  },
});
