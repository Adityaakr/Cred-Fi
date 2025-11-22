import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, BORDER_RADIUS, SPACING, FONT_SIZES } from '../theme/colors';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'gold';
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  style,
}) => {
  return (
    <View style={[styles.badge, styles[variant], style]}>
      <Text style={[styles.text, styles[`${variant}Text`]]}>
        {children}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    alignSelf: 'flex-start',
  },
  
  default: {
    backgroundColor: COLORS.accent,
  },
  success: {
    backgroundColor: COLORS.successLight,
  },
  error: {
    backgroundColor: COLORS.errorLight,
  },
  warning: {
    backgroundColor: `${COLORS.warning}20`,
  },
  gold: {
    backgroundColor: `${COLORS.primary}20`,
    borderWidth: 1,
    borderColor: `${COLORS.primary}30`,
  },
  
  text: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  defaultText: {
    color: COLORS.textSecondary,
  },
  successText: {
    color: COLORS.success,
  },
  errorText: {
    color: COLORS.error,
  },
  warningText: {
    color: COLORS.warning,
  },
  goldText: {
    color: COLORS.primary,
  },
});
