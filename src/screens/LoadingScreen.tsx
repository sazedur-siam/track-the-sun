import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import Animated, {
      useAnimatedStyle,
      useSharedValue,
      withRepeat,
      withSequence,
      withTiming,
} from 'react-native-reanimated';

interface LoadingScreenProps {
  onLoadComplete?: () => void;
}

export default function LoadingScreen({ onLoadComplete }: LoadingScreenProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    // Animate sun icon
    scale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      false
    );

    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0.5, { duration: 1000 })
      ),
      -1,
      false
    );

    // Simulate loading time (2 seconds)
    const timer = setTimeout(() => {
      if (onLoadComplete) {
        onLoadComplete();
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [onLoadComplete, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  return (
    <ThemedView style={styles.container}>
      <Animated.View style={[styles.iconContainer, animatedStyle]}>
        <ThemedText style={styles.sunIcon}>☀️</ThemedText>
      </Animated.View>
      <ThemedText type="title" style={styles.title}>
        TrackTheSun
      </ThemedText>
      <ThemedText style={styles.subtitle}>
        Find the cool side of your journey
      </ThemedText>
      <ActivityIndicator size="large" color="#FFA500" style={styles.spinner} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    marginBottom: 20,
  },
  sunIcon: {
    fontSize: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 40,
    textAlign: 'center',
  },
  spinner: {
    marginTop: 20,
  },
});
