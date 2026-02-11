import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
      Easing,
      useAnimatedStyle,
      useSharedValue,
      withRepeat,
      withTiming,
} from 'react-native-reanimated';

export default function SunAnimation() {
  const colorScheme = useColorScheme();
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const primaryColor = Colors[colorScheme ?? 'light'].primary;

  useEffect(() => {
    // Continuous rotation
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 20000,
        easing: Easing.linear,
      }),
      -1, // Infinite
      false
    );

    // Breathing scale effect
    scale.value = withRepeat(
      withTiming(1.1, {
        duration: 2000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1, // Infinite
      true // Reverse
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: `${rotation.value}deg` },
        { scale: scale.value },
      ],
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.sunContainer, animatedStyle]}>
        {/* Core Sun */}
        <View style={[styles.core, { backgroundColor: primaryColor }]} />
        
        {/* Rays */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
          <View
            key={angle}
            style={[
              styles.ray,
              {
                backgroundColor: primaryColor,
                transform: [{ rotate: `${angle}deg` }, { translateY: -40 }],
              },
            ]}
          />
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    marginBottom: 20,
    marginTop: 10,
  },
  sunContainer: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  core: {
    width: 60,
    height: 60,
    borderRadius: 30,
    zIndex: 1,
  },
  ray: {
    position: 'absolute',
    width: 8,
    height: 20,
    borderRadius: 4,
  },
});
