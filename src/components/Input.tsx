import React from 'react';
import { TextInput, StyleSheet, TextInputProps } from 'react-native';
import { COLORS, BORDER_RADIUS, SPACING, FONT_SIZES } from '../theme/colors';

interface InputProps extends TextInputProps {
  large?: boolean;
}

export const Input: React.FC<InputProps> = ({ large = false, style, ...props }) => {
  return (
    <TextInput
      style={[styles.input, large && styles.large, style]}
      placeholderTextColor={COLORS.textMuted}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  input: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  large: {
    fontSize: FONT_SIZES.lg,
    paddingVertical: SPACING.lg,
  },
});
