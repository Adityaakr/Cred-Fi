/**
 * Test Income Verification Component
 * Quick demo version that bypasses Vouch and calls contract directly
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { ethers } from 'ethers';

interface TestIncomeVerificationProps {
  walletAddress: string;
  onVerificationComplete: () => void;
}

export const TestIncomeVerification: React.FC<TestIncomeVerificationProps> = ({
  walletAddress,
  onVerificationComplete,
}) => {
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);

  const testVerify = async (incomeBucket: number) => {
    try {
      setLoading(true);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const verifierAddress = '0x8b00dEE5209e73F1D92bE834223D3497c57b4263';
      const verifierABI = [
        'function submitIncomeProofSimplified(address user, uint256 incomeBucket, bytes32 proofHash) external',
      ];

      const verifier = new ethers.Contract(verifierAddress, verifierABI, signer);
      const proofHash = ethers.id('test-proof-' + Date.now());

      console.log('🧪 Test verification:', { walletAddress, incomeBucket, proofHash });

      const tx = await verifier.submitIncomeProofSimplified(
        walletAddress,
        incomeBucket,
        proofHash
      );

      console.log('⏳ Transaction sent:', tx.hash);
      setTxHash(tx.hash);

      await tx.wait();

      console.log('✅ Verified onchain!');
      setVerified(true);
      
      Alert.alert(
        '✅ Income Verified!',
        `Monthly Income: $${incomeBucket}\nCredit Limit: $${incomeBucket * 3}\n\nTransaction confirmed onchain!`,
        [
          {
            text: 'View on PolygonScan',
            onPress: () => Linking.openURL(`https://polygonscan.com/tx/${tx.hash}`),
          },
          { text: 'OK', onPress: onVerificationComplete },
        ]
      );

      onVerificationComplete();
    } catch (error: any) {
      console.error('Error:', error);
      Alert.alert('Error', error.message || 'Failed to verify');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="flask-outline" size={24} color={COLORS.primary} />
        <Text style={styles.title}>Test Income Verification</Text>
      </View>

      {verified ? (
        <View style={styles.successContainer}>
          <Ionicons name="checkmark-circle" size={48} color={COLORS.success} />
          <Text style={styles.successText}>✅ Verified Onchain!</Text>
          {txHash && (
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => Linking.openURL(`https://polygonscan.com/tx/${txHash}`)}
            >
              <Ionicons name="open-outline" size={16} color={COLORS.primary} />
              <Text style={styles.linkText}>View Transaction</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <>
          <Text style={styles.description}>
            Quick test: Verify income directly onchain (bypasses Vouch for demo)
          </Text>

          <View style={styles.buttonGrid}>
            <TouchableOpacity
              style={[styles.testButton, loading && styles.buttonDisabled]}
              onPress={() => testVerify(500)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Text style={styles.buttonTitle}>$500/month</Text>
                  <Text style={styles.buttonSubtitle}>→ $1,500 credit</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.testButton, loading && styles.buttonDisabled]}
              onPress={() => testVerify(1000)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Text style={styles.buttonTitle}>$1,000/month</Text>
                  <Text style={styles.buttonSubtitle}>→ $3,000 credit</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.testButton, loading && styles.buttonDisabled]}
              onPress={() => testVerify(2000)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Text style={styles.buttonTitle}>$2,000/month</Text>
                  <Text style={styles.buttonSubtitle}>→ $6,000 credit</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.note}>
            💡 For production: Use Vouch to verify real income from bank/payroll APIs
          </Text>
        </>
      )}
    </View>
  );
};

const styles = {
  container: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.text,
  },
  description: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  buttonGrid: {
    gap: 12,
  },
  testButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center' as const,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 4,
  },
  buttonSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  note: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 16,
    fontStyle: 'italic' as const,
    textAlign: 'center' as const,
  },
  successContainer: {
    alignItems: 'center' as const,
    padding: 20,
  },
  successText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.success,
    marginTop: 12,
    marginBottom: 16,
  },
  linkButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    padding: 8,
  },
  linkText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500' as const,
  },
};
