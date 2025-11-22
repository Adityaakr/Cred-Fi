import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/colors';

const { width, height } = Dimensions.get('window');

export function AnimatedBackground() {
  const float1 = useRef(new Animated.Value(0)).current;
  const float2 = useRef(new Animated.Value(0)).current;
  const float3 = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Floating animation for geometric shapes
    const floatAnim1 = Animated.loop(
      Animated.sequence([
        Animated.timing(float1, {
          toValue: 1,
          duration: 8000,
          useNativeDriver: true,
        }),
        Animated.timing(float1, {
          toValue: 0,
          duration: 8000,
          useNativeDriver: true,
        }),
      ])
    );

    const floatAnim2 = Animated.loop(
      Animated.sequence([
        Animated.timing(float2, {
          toValue: 1,
          duration: 6000,
          useNativeDriver: true,
        }),
        Animated.timing(float2, {
          toValue: 0,
          duration: 6000,
          useNativeDriver: true,
        }),
      ])
    );

    const floatAnim3 = Animated.loop(
      Animated.sequence([
        Animated.timing(float3, {
          toValue: 1,
          duration: 10000,
          useNativeDriver: true,
        }),
        Animated.timing(float3, {
          toValue: 0,
          duration: 10000,
          useNativeDriver: true,
        }),
      ])
    );

    // Pulse animation for glow effect
    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.2,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );

    floatAnim1.start();
    floatAnim2.start();
    floatAnim3.start();
    pulseAnim.start();

    return () => {
      floatAnim1.stop();
      floatAnim2.stop();
      floatAnim3.stop();
      pulseAnim.stop();
    };
  }, []);

  const translateY1 = float1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -50],
  });

  const translateY2 = float2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 30],
  });

  const translateY3 = float3.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -40],
  });

  const rotate1 = float1.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const rotate2 = float2.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-360deg'],
  });

  return (
    <View style={styles.container}>
      {/* Base gradient - Light theme */}
      <LinearGradient
        colors={[COLORS.backgroundTertiary, COLORS.backgroundSecondary, COLORS.background]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Grid pattern overlay */}
      <View style={styles.grid} />

      {/* Floating geometric shapes */}
      <Animated.View
        style={[
          styles.shape1,
          {
            transform: [
              { translateY: translateY1 },
              { rotate: rotate1 },
              { scale: pulse },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={[COLORS.primaryGlow, 'transparent']}
          style={styles.shapeGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.shape2,
          {
            transform: [
              { translateY: translateY2 },
              { rotate: rotate2 },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={[COLORS.accentBright + '40', 'transparent']}
          style={styles.shapeGradient}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.shape3,
          {
            transform: [
              { translateY: translateY3 },
            ],
          },
        ]}
      >
        <View style={styles.hexagon} />
      </Animated.View>

      {/* Glow effects */}
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  grid: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    opacity: 0.15,
  },
  shape1: {
    position: 'absolute',
    top: height * 0.1,
    right: width * 0.1,
    width: 200,
    height: 200,
  },
  shape2: {
    position: 'absolute',
    bottom: height * 0.2,
    left: -50,
    width: 250,
    height: 250,
  },
  shape3: {
    position: 'absolute',
    top: height * 0.5,
    left: width * 0.7,
    width: 150,
    height: 150,
  },
  shapeGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  hexagon: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.primaryGlow,
    transform: [{ rotate: '30deg' }],
    borderRadius: 10,
  },
  glowTop: {
    position: 'absolute',
    top: -100,
    left: width * 0.3,
    width: 300,
    height: 300,
    backgroundColor: COLORS.primary,
    opacity: 0.05,
    borderRadius: 150,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 100,
  },
  glowBottom: {
    position: 'absolute',
    bottom: -150,
    right: width * 0.2,
    width: 400,
    height: 400,
    backgroundColor: COLORS.accentBright,
    opacity: 0.03,
    borderRadius: 200,
    shadowColor: COLORS.accentBright,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 100,
  },
});
