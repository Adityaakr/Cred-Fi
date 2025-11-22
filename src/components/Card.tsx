import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, BORDER_RADIUS, SHADOWS, SPACING } from '../theme/colors';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  dark?: boolean;
  gradient?: boolean;
  shadow?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  style, 
  dark = false,
  gradient = false,
  shadow = true,
}) => {
  if (gradient) {
    return (
      <LinearGradient
        colors={[COLORS.cardDark, COLORS.cardDarkSecondary, COLORS.cardDarkTertiary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.card,
          shadow && SHADOWS.xl,
          style,
        ]}
      >
        {children}
      </LinearGradient>
    );
  }

  return (
    <View
      style={[
        styles.card,
        dark && styles.cardDark,
        shadow && SHADOWS.md,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardDark: {
    backgroundColor: COLORS.cardDark,
    borderColor: 'transparent',
  },
});
