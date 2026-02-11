import { ThemedText } from '@/components/themed-text';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Reanimated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

interface AnimatedProgressCircleProps {
  percentage: number;
  size?: number;
  color: string;
  label: string;
  delay?: number;
  textColor?: string;
  isHot?: boolean;
  isCold?: boolean;
}

const Snowflake = ({ size, index }: { size: number, index: number }) => {
    const y = useSharedValue(-size/2);
    const x = useSharedValue(0);
    const opacity = useSharedValue(0);
    const scale = useSharedValue(0);

    useEffect(() => {
       const duration = 2000 + Math.random() * 1500;
       const startDelay = index * 800;
       
       y.value = withDelay(startDelay, withRepeat(
         withTiming(size * 0.8, { duration, easing: Easing.linear }), 
         -1,
         false
       ));

       x.value = withDelay(startDelay, withRepeat(
         withSequence(
            withTiming(15, { duration: duration/2 }),
            withTiming(-15, { duration: duration/2 })
         ),
         -1,
         false
       ));

       opacity.value = withDelay(startDelay, withRepeat(
         withSequence(
            withTiming(0, { duration: 0 }),
            withTiming(0.8, { duration: 300 }),
            withTiming(0, { duration: duration - 300 })
         ),
         -1,
         false
       ));
       
       scale.value = withDelay(startDelay, withRepeat(
         withSequence(
           withTiming(0.4 + Math.random() * 0.4, { duration: duration/2 }),
           withTiming(0.2, { duration: duration/2 })
         ),
         -1,
         false
       ));
    }, []);

    const style = useAnimatedStyle(() => ({
        transform: [{ translateY: y.value }, { translateX: x.value }, { scale: scale.value }],
        opacity: opacity.value
    }));

    return (
        <Reanimated.View 
        style={[{ position: 'absolute', top: -size/4 }, style]}
        >
        <MaterialCommunityIcons name="snowflake" size={size/3} color="#0891B2" />
        </Reanimated.View>
    );
};

const FreezeEffect = ({ size }: { size: number }) => {
  const pulse = useSharedValue(1);
  const rotate = useSharedValue(0);

  useEffect(() => {
    // Pulse
    pulse.value = withRepeat(
        withSequence(
            withTiming(1.1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
            withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
    );
    
    // Rotate slowly
    rotate.value = withRepeat(
        withTiming(360, { duration: 20000, easing: Easing.linear }),
        -1,
        false
    );
  }, []);

  const iconStyle = useAnimatedStyle(() => ({
      transform: [
          { scale: pulse.value },
          { rotate: `${rotate.value}deg` }
      ]
  }));

  return (
    <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', zIndex: -1 }]}>
         {/* Main Background Snowflake */}
         <Reanimated.View style={[{ position: 'absolute' }, iconStyle]}>
             <MaterialCommunityIcons name="snowflake" size={size * 1.4} color="#A5F3FC" style={{ opacity: 0.5 }} />
         </Reanimated.View>

          {/* Inner Snowflake for intensity */}
         <Reanimated.View style={[{ position: 'absolute' }, iconStyle]}>
             <MaterialCommunityIcons name="snowflake" size={size * 1.0} color="#67E8F9" style={{ opacity: 0.3 }} />
         </Reanimated.View>
         
         {[0, 1, 2, 3].map((i) => (
             <Snowflake key={i} size={size} index={i} />
         ))}
    </View>
  )
}

const Spark = ({ size, index }: { size: number, index: number }) => {
    const y = useSharedValue(0);
    const x = useSharedValue(0);
    const opacity = useSharedValue(0);
    const scale = useSharedValue(0);

    useEffect(() => {
      const duration = 1500 + Math.random() * 1000;
      const startDelay = index * 600;

      y.value = withDelay(startDelay, withRepeat(
        withTiming(-size * 1.2, { duration, easing: Easing.out(Easing.quad) }),
        -1,
        false
      ));
      
      x.value = withDelay(startDelay, withRepeat(
        withSequence(
           withTiming(15, { duration: duration/2 }), 
           withTiming(-15, { duration: duration/2 })
        ),
        -1, 
        false
      ));

      opacity.value = withDelay(startDelay, withRepeat(
        withSequence(
           withTiming(1, { duration: 200 }), 
           withTiming(0, { duration: duration - 200 })
        ),
        -1,
        false
      ));

      scale.value = withDelay(startDelay, withRepeat(
        withSequence(
           withTiming(1, { duration: 200 }),
           withTiming(0.2, { duration: duration - 200 })
        ),
        -1,
        false
      ));
    }, []);

    const sparkStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: y.value }, 
            { translateX: x.value },
            { scale: scale.value }
        ],
        opacity: opacity.value
    }));

    return (
        <Reanimated.View 
            style={[
                { 
                    position: 'absolute',
                    width: 8, height: 8, 
                    borderRadius: 4, 
                    backgroundColor: '#FFD700', // Gold/Yellow Sparks
                    bottom: size/2 
                },
                sparkStyle
            ]} 
        />
    );
};


const FlameEffect = ({ size }: { size: number }) => {
  // Main Flame Animation
  const flameScale = useSharedValue(1);
  const flameOpacity = useSharedValue(0.8);
  
  useEffect(() => {
    // 1. Main Flame Pulse
    flameScale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    
    flameOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 500, easing: Easing.ease }),
        withTiming(0.7, { duration: 500, easing: Easing.ease })
      ),
      -1,
      true
    );
  }, []);

  const flameStyle = useAnimatedStyle(() => ({
    transform: [
        { scale: flameScale.value },
        { translateY: -size * 0.1 } // Shift slightly up
    ],
    opacity: flameOpacity.value,
  }));
  
  return (
    <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', zIndex: -1 }]}>
      {/* Big Background Flame */}
      <Reanimated.View
          style={[
              { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
              flameStyle
          ]}
      >
        <MaterialCommunityIcons
          name="fire"
          size={size * 1.5}
          color="#EF4444" // Red-Hot Core
          style={{ opacity: 0.8 }}
        />
      </Reanimated.View>
      
      {/* Inner Orange Flame overlay to create depth */}
      <Reanimated.View
          style={[
              { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
              flameStyle
          ]}
      >
       <MaterialCommunityIcons
        name="fire"
        size={size * 1.2}
        color="#FF9500" // Orange inner
      />
      </Reanimated.View>
      
      {/* Rising Sparks */}
      {[0, 1, 2].map((i) => (
          <Spark key={i} size={size} index={i} />
      ))}
    </View>
  );
};

export function AnimatedProgressCircle({
  percentage,
  size = 100,
  color,
  label,
  delay = 0,
  textColor = '#fff',
  isHot = false,
  isCold = false,
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

  // Calculate wrapper size to accommodate animations (flame/ice are 1.5x size)
  const wrapperSize = size * 2;
  
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
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          {/* Larger container to prevent clipping of animations */}
          <View style={{ width: wrapperSize, height: wrapperSize, alignItems: 'center', justifyContent: 'center' }}>
             {/* Effects use absolute positioning to center themselves */}
             <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
                {isHot && <FlameEffect size={size} />}
                {isCold && <FreezeEffect size={size} />}
             </View>
             
             {/* Circle positioned at center */}
             <View
                style={[
                  styles.circle,
                  {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: color,
                    borderWidth: (isHot || isCold) ? 2 : 0,
                    borderColor: '#FFFFFF40',
                    zIndex: 10
                  },
                ]}
              >
                <ThemedText style={[styles.percentageText, { color: textColor }]}>{percentage}%</ThemedText>
              </View>
          </View>
      </View>
      
      <ThemedText style={[
          styles.label, 
          isHot && { color: '#EF4444', fontWeight: '800' },
          isCold && { color: '#0891B2', fontWeight: '800' }
      ]}>
        {isHot ? '🔥 ' : ''}{isCold ? '❄️ ' : ''}{label}
      </ThemedText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'visible', // Ensure animations don't get clipped
  },
  circle: {
    justifyContent: 'center',
    alignItems: 'center',
    // Removed marginBottom to align effects correctly
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
    fontSize: 24, // Optimized font size for smaller circles
    fontWeight: 'bold',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.8,
    marginTop: 12,
  },
});
