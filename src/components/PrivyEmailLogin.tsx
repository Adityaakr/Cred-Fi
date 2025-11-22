import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useLoginWithEmail } from '@privy-io/expo';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../theme/colors';

interface PrivyEmailLoginProps {
  onSuccess: () => void;
}

export function PrivyEmailLogin({ onSuccess }: PrivyEmailLoginProps) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { sendCode, loginWithCode } = useLoginWithEmail({
    onError: (error) => {
      Alert.alert('Error', error.message || 'Authentication failed');
      setIsLoading(false);
    },
    onLoginSuccess: () => {
      onSuccess();
    },
  });

  const handleSendCode = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    try {
      setIsLoading(true);
      await sendCode({ email });
      setCodeSent(true);
      Alert.alert('Code Sent!', 'Check your email for the verification code');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!code) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }

    try {
      setIsLoading(true);
      await loginWithCode({ code, email });
      // onSuccess will be called by onLoginSuccess callback
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to verify code');
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="mail" size={64} color={COLORS.primary} />
      </View>

      <Text style={styles.title}>Login with Email</Text>
      <Text style={styles.subtitle}>
        {codeSent
          ? 'Enter the code sent to your email'
          : 'Enter your email to receive a login code'}
      </Text>

      {!codeSent ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="your@email.com"
            placeholderTextColor={COLORS.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
          />

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSendCode}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.text} />
            ) : (
              <>
                <Ionicons name="send" size={20} color={COLORS.text} />
                <Text style={styles.buttonText}>Send Code</Text>
              </>
            )}
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TextInput
            style={styles.input}
            placeholder="Enter 6-digit code"
            placeholderTextColor={COLORS.textSecondary}
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={6}
            editable={!isLoading}
          />

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.text} />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.text} />
                <Text style={styles.buttonText}>Verify & Login</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              setCodeSent(false);
              setCode('');
            }}
            disabled={isLoading}
          >
            <Text style={styles.backButtonText}>← Change Email</Text>
          </TouchableOpacity>
        </>
      )}

      <View style={styles.features}>
        <View style={styles.featureItem}>
          <Ionicons name="shield-checkmark" size={16} color={COLORS.primary} />
          <Text style={styles.featureText}>Secure email authentication</Text>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="wallet" size={16} color={COLORS.primary} />
          <Text style={styles.featureText}>Automatic wallet creation</Text>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="flash" size={16} color={COLORS.primary} />
          <Text style={styles.featureText}>Instant access to usdc</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  input: {
    width: '100%',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  button: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  backButton: {
    paddingVertical: SPACING.sm,
  },
  backButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
  },
  features: {
    marginTop: SPACING.xl,
    gap: SPACING.md,
    width: '100%',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  featureText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
});
