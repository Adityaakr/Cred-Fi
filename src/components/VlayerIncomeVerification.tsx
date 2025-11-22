/**
 * vlayer Income Verification Component
 * Uses vlayer Web Prover Server for proof generation and verification
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { ethers } from 'ethers';

interface VlayerIncomeVerificationProps {
  walletAddress: string;
  onVerificationComplete: () => void;
}

export const VlayerIncomeVerification: React.FC<VlayerIncomeVerificationProps> = ({
  walletAddress,
  onVerificationComplete,
}) => {
  const [status, setStatus] = useState<'idle' | 'proving' | 'verifying' | 'submitting' | 'verified'>('idle');
  const [proof, setProof] = useState<any>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const generateAndVerifyProof = async (incomeAmount: number) => {
    try {
      // Step 1: Generate Web Proof using vlayer
      setStatus('proving');
      console.log('🔐 Step 1: Generating Web Proof via vlayer...');

      const proveResponse = await fetch('/api/vlayer/prove-income', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          incomeAmount,
        }),
      });

      if (!proveResponse.ok) {
        throw new Error('Failed to generate proof');
      }

      const proveData = await proveResponse.json();
      console.log('✅ Web Proof generated:', proveData);

      // Step 2: Verify proof using vlayer
      setStatus('verifying');
      console.log('🔍 Step 2: Verifying proof via vlayer...');

      const verifyResponse = await fetch('/api/vlayer/verify-income', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proof: proveData.proof,
          publicInputs: proveData.publicInputs,
        }),
      });

      if (!verifyResponse.ok) {
        throw new Error('Proof verification failed');
      }

      const verifyData = await verifyResponse.json();
      console.log('✅ Proof verified by vlayer:', verifyData);

      setProof(proveData);

      // Step 3: Submit to blockchain
      await submitToBlockchain(proveData);

    } catch (error: any) {
      console.error('❌ Error:', error);
      Alert.alert('Error', error.message || 'Failed to generate/verify proof');
      setStatus('idle');
    }
  };

  const submitToBlockchain = async (proofData: any) => {
    try {
      setStatus('submitting');
      console.log('📝 Step 3: Submitting to blockchain...');

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const verifierAddress = '0x8b00dEE5209e73F1D92bE834223D3497c57b4263';
      const verifierABI = [
        'function submitIncomeProofSimplified(address user, uint256 incomeBucket, bytes32 proofHash) external',
      ];

      const verifier = new ethers.Contract(verifierAddress, verifierABI, signer);
      
      const incomeBucket = proofData.publicInputs.incomeBucket;
      const proofHash = ethers.id(proofData.proof);

      console.log('📝 Submitting proof onchain:', {
        user: walletAddress,
        incomeBucket,
        proofHash,
      });

      const tx = await verifier.submitIncomeProofSimplified(
        walletAddress,
        incomeBucket,
        proofHash
      );

      console.log('⏳ Transaction sent:', tx.hash);
      setTxHash(tx.hash);

      await tx.wait();

      console.log('✅ Proof verified onchain!');
      setStatus('verified');
      
      Alert.alert(
        '✅ Verified with vlayer!',
        `Income: $${incomeBucket}/month\nCredit Limit: $${incomeBucket * 3}\n\nProof generated and verified by vlayer Web Prover Server!`,
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
      console.error('❌ Error submitting to blockchain:', error);
      Alert.alert('Error', error.message || 'Failed to submit proof onchain');
      setStatus('idle');
    }
  };

  const renderStatus = () => {
    switch (status) {
      case 'proving':
        return (
          <View style={styles.statusContainer}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.statusText}>Generating Web Proof via vlayer...</Text>
          </View>
        );
      case 'verifying':
        return (
          <View style={styles.statusContainer}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.statusText}>Verifying proof via vlayer...</Text>
          </View>
        );
      case 'submitting':
        return (
          <View style={styles.statusContainer}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.statusText}>Submitting to blockchain...</Text>
          </View>
        );
      case 'verified':
        return (
          <View style={styles.successContainer}>
            <Ionicons name="checkmark-circle" size={48} color={COLORS.success} />
            <Text style={styles.successText}>✅ Verified with vlayer!</Text>
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
        );
      default:
        return null;
    }
  };

  const isLoading = status !== 'idle' && status !== 'verified';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="shield-checkmark-outline" size={24} color={COLORS.primary} />
        <Text style={styles.title}>Income Verification (vlayer)</Text>
      </View>

      <View style={styles.badge}>
        <Ionicons name="flash" size={16} color={COLORS.primary} />
        <Text style={styles.badgeText}>Powered by vlayer Web Prover Server</Text>
      </View>

      {renderStatus()}

      {status === 'idle' && (
        <>
          <Text style={styles.description}>
            Verify your income using vlayer's Web Proof technology. Your data stays private with zero-knowledge proofs.
          </Text>

          <View style={styles.buttonGrid}>
            <TouchableOpacity
              style={[styles.verifyButton, isLoading && styles.buttonDisabled]}
              onPress={() => generateAndVerifyProof(500)}
              disabled={isLoading}
            >
              <Text style={styles.buttonTitle}>$500/month</Text>
              <Text style={styles.buttonSubtitle}>→ $1,500 credit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.verifyButton, isLoading && styles.buttonDisabled]}
              onPress={() => generateAndVerifyProof(1000)}
              disabled={isLoading}
            >
              <Text style={styles.buttonTitle}>$1,000/month</Text>
              <Text style={styles.buttonSubtitle}>→ $3,000 credit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.verifyButton, isLoading && styles.buttonDisabled]}
              onPress={() => generateAndVerifyProof(2000)}
              disabled={isLoading}
            >
              <Text style={styles.buttonTitle}>$2,000/month</Text>
              <Text style={styles.buttonSubtitle}>→ $6,000 credit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.steps}>
            <Text style={styles.stepsTitle}>How it works:</Text>
            <Text style={styles.stepText}>1. 🔐 Generate Web Proof (POST /prove)</Text>
            <Text style={styles.stepText}>2. 🔍 Verify with vlayer (POST /verify)</Text>
            <Text style={styles.stepText}>3. ✅ Submit to blockchain</Text>
          </View>
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
    borderColor: COLORS.primary + '40',
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.text,
  },
  badge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start' as const,
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600' as const,
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
  verifyButton: {
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
  steps: {
    marginTop: 16,
    padding: 12,
    backgroundColor: COLORS.background,
    borderRadius: 8,
  },
  stepsTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: COLORS.text,
    marginBottom: 8,
  },
  stepText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    padding: 12,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500' as const,
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
