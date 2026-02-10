import { ThemedText } from '@/components/themed-text';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

interface AnimatedProgressCircleProps {
  percentage: number;
  size?: number;
  color: string;
  label: string;
  delay?: number;
}

export function AnimatedProgressCircle({
  percentage,
  size = 100,
  color,
  label,
  delay = 0,
}: AnimatedProgressCircleProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        delay,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        delay,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, opacityAnim, delay]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
          },
        ]}
      >
        <ThemedText style={styles.percentageText}>{percentage}%</ThemedText>
      </View>
      <ThemedText style={styles.label}>{label}</ThemedText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  circle: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  percentageText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.8,
  },
});
