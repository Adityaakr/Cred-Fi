/**
 * Vouch (Wise) Balance Verification Component
 * Uses Vouch attestation for proof of total balance
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, Linking, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../theme/colors';

interface VouchBalanceVerificationProps {
  walletAddress: string;
  onVerificationComplete: (balance: number) => void;
}

// Vouch attestation UID for Wise balance proof
const VOUCH_ATTESTATION_UID = '4a443312-1e92-4080-b0e5-3d5a1a46930b';

export const VouchBalanceVerification: React.FC<VouchBalanceVerificationProps> = ({
  walletAddress,
  onVerificationComplete,
}) => {
  const [status, setStatus] = useState<'idle' | 'verifying' | 'verified'>('idle');
  const [balance, setBalance] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const verifyBalance = async () => {
    try {
      setStatus('verifying');
      setError(null);
      console.log('🔐 Verifying Wise balance via Vouch...');
      console.log('📋 Attestation UID:', VOUCH_ATTESTATION_UID);

      // Call Vouch API to verify attestation
      const response = await fetch('https://api.vouch.io/v1/attestations/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          attestationUid: VOUCH_ATTESTATION_UID,
          walletAddress: walletAddress,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to verify Vouch attestation');
      }

      const data = await response.json();
      console.log('✅ Vouch attestation verified:', data);

      // Extract balance from attestation data
      const verifiedBalance = data.attestation?.data?.totalBalance || 0;
      setBalance(verifiedBalance);
      setStatus('verified');

      Alert.alert(
        '✅ Balance Verified',
        `Your Wise balance of $${verifiedBalance.toLocaleString()} has been verified via Vouch!`,
        [
          {
            text: 'Continue',
            onPress: () => onVerificationComplete(verifiedBalance),
          },
        ]
      );
    } catch (err: any) {
      console.error('❌ Vouch verification failed:', err);
      setError(err.message || 'Verification failed');
      setStatus('idle');
      Alert.alert(
        '❌ Verification Failed',
        'Could not verify your Wise balance. Please try again or contact support.',
        [{ text: 'OK' }]
      );
    }
  };

  const openVouchDocs = () => {
    Linking.openURL('https://docs.vouch.io/attestations');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="shield-checkmark" size={32} color={COLORS.primary} />
        <Text style={styles.title}>Vouch Balance Verification</Text>
        <Text style={styles.subtitle}>
          Verify your Wise account balance using Vouch attestation
        </Text>
      </View>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={20} color={COLORS.primary} />
        <Text style={styles.infoText}>
          Vouch provides cryptographic proof of your Wise balance without sharing sensitive data.
        </Text>
      </View>

      <View style={styles.attestationBox}>
        <Text style={styles.attestationLabel}>Attestation UID:</Text>
        <Text style={styles.attestationUid}>{VOUCH_ATTESTATION_UID}</Text>
      </View>

      {balance !== null && status === 'verified' && (
        <View style={styles.resultBox}>
          <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
          <Text style={styles.resultText}>
            Verified Balance: ${balance.toLocaleString()}
          </Text>
        </View>
      )}

      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={20} color={COLORS.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.button,
          status === 'verifying' && styles.buttonDisabled,
        ]}
        onPress={verifyBalance}
        disabled={status === 'verifying'}
      >
        {status === 'verifying' ? (
          <>
            <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.buttonText}>Verifying...</Text>
          </>
        ) : (
          <>
            <Ionicons name="shield-checkmark" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.buttonText}>
              {status === 'verified' ? 'Verify Again' : 'Verify Balance'}
            </Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.linkButton} onPress={openVouchDocs}>
        <Text style={styles.linkText}>Learn more about Vouch</Text>
        <Ionicons name="open-outline" size={16} color={COLORS.primary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: `${COLORS.primary}10`,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    marginLeft: SPACING.sm,
  },
  attestationBox: {
    backgroundColor: COLORS.backgroundSecondary,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  attestationLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  attestationUid: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    fontFamily: 'monospace',
  },
  resultBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.success}10`,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  resultText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.success,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.error}10`,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  errorText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.error,
    marginLeft: SPACING.sm,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.sm,
  },
  linkText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    marginRight: SPACING.xs,
  },
});
