import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { COLORS, BORDER_RADIUS, SPACING, FONT_SIZES } from '../theme/colors';

interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  style,
  textStyle,
  disabled = false,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        styles[variant],
        styles[size],
        disabled && styles.disabled,
        style,
      ]}
      activeOpacity={0.7}
    >
      <Text style={[styles.text, styles[`${variant}Text`], styles[`${size}Text`], textStyle]}>
        {children}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  
  // Variants
  primary: {
    backgroundColor: COLORS.primary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  
  // Sizes
  sm: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  md: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  lg: {
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.lg,
  },
  
  // Text styles
  text: {
    fontWeight: '600',
  },
  primaryText: {
    color: COLORS.text,
  },
  outlineText: {
    color: COLORS.text,
  },
  ghostText: {
    color: COLORS.primary,
  },
  smText: {
    fontSize: FONT_SIZES.sm,
  },
  mdText: {
    fontSize: FONT_SIZES.md,
  },
  lgText: {
    fontSize: FONT_SIZES.lg,
  },
  
  disabled: {
    opacity: 0.5,
  },
});
