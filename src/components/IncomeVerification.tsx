/**
 * Income Verification Component
 * Integrates Vouch/vlayer for human income verification
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { ethers } from 'ethers';

interface IncomeVerificationProps {
  walletAddress: string;
  onVerificationComplete: () => void;
}

export const IncomeVerification: React.FC<IncomeVerificationProps> = ({
  walletAddress,
  onVerificationComplete,
}) => {
  const [status, setStatus] = useState<'not_verified' | 'generating' | 'ready' | 'verifying' | 'verified'>('not_verified');
  const [requestId, setRequestId] = useState<string | null>(null);
  const [proofData, setProofData] = useState<any>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  // Check if we're returning from Vouch
  useEffect(() => {
    const checkVouchReturn = async () => {
      const url = window.location.href;
      const params = new URLSearchParams(window.location.search);
      const vouchType = params.get('vouch');
      const returnedRequestId = params.get('requestId');

      if (vouchType === 'income' && returnedRequestId) {
        setRequestId(returnedRequestId);
        setStatus('generating');
        
        // Poll for proof
        await pollForProof(returnedRequestId);
      }
    };

    if (typeof window !== 'undefined') {
      checkVouchReturn();
    }
  }, []);

  const pollForProof = async (reqId: string, attempts = 0) => {
    if (attempts > 20) {
      Alert.alert('Timeout', 'Proof generation took too long. Please try again.');
      setStatus('not_verified');
      return;
    }

    try {
      const response = await fetch(`/api/vouch/proof/${reqId}`);
      
      if (response.ok) {
        const data = await response.json();
        setProofData(data);
        setStatus('ready');
        console.log('✅ Proof ready:', data);
      } else {
        // Proof not ready yet, poll again
        setTimeout(() => pollForProof(reqId, attempts + 1), 3000);
      }
    } catch (error) {
      console.error('Error polling for proof:', error);
      setTimeout(() => pollForProof(reqId, attempts + 1), 3000);
    }
  };

  const startIncomeVerification = async () => {
    try {
      setStatus('generating');

      const response = await fetch('/api/vouch/human/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress }),
      });

      const data = await response.json();

      if (data.success) {
        setRequestId(data.requestId);
        
        // Redirect to Vouch
        if (typeof window !== 'undefined') {
          window.location.href = data.redirectUrl;
        } else {
          // React Native
          Linking.openURL(data.redirectUrl);
        }
      } else {
        throw new Error(data.error || 'Failed to start verification');
      }
    } catch (error: any) {
      console.error('Error starting verification:', error);
      Alert.alert('Error', error.message || 'Failed to start verification');
      setStatus('not_verified');
    }
  };

  const submitProofOnchain = async () => {
    if (!proofData || !walletAddress) return;

    try {
      setStatus('verifying');

      // Get contract instances
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const verifierAddress = process.env.NEXT_PUBLIC_INCOME_VERIFIER!;
      const verifierABI = [
        'function submitIncomeProofSimplified(address user, uint256 incomeBucket, bytes32 proofHash) external',
      ];

      const verifier = new ethers.Contract(verifierAddress, verifierABI, signer);

      // Extract income bucket from proof (simplified for hackathon)
      const incomeBucket = proofData.publicInputs?.incomeBucket || 1000;
      const proofHash = ethers.id(JSON.stringify(proofData.proof));

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
        '✅ Verified!',
        `Income verified onchain!\n\nYour credit limit has been updated.`,
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
      console.error('Error submitting proof:', error);
      Alert.alert('Error', error.message || 'Failed to verify proof onchain');
      setStatus('ready');
    }
  };

  const renderStatus = () => {
    switch (status) {
      case 'not_verified':
        return (
          <View style={styles.statusContainer}>
            <Ionicons name="alert-circle-outline" size={20} color={COLORS.textSecondary} />
            <Text style={styles.statusText}>Not verified</Text>
          </View>
        );
      case 'generating':
        return (
          <View style={styles.statusContainer}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.statusText}>Generating proof...</Text>
          </View>
        );
      case 'ready':
        return (
          <View style={styles.statusContainer}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            <Text style={[styles.statusText, { color: COLORS.success }]}>✅ Proof generated</Text>
          </View>
        );
      case 'verifying':
        return (
          <View style={styles.statusContainer}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.statusText}>Verifying onchain...</Text>
          </View>
        );
      case 'verified':
        return (
          <View style={styles.statusContainer}>
            <Ionicons name="shield-checkmark" size={20} color={COLORS.success} />
            <Text style={[styles.statusText, { color: COLORS.success }]}>✅ Verified onchain</Text>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="shield-checkmark-outline" size={24} color={COLORS.primary} />
        <Text style={styles.title}>Income Verification (Vouch)</Text>
      </View>

      {renderStatus()}

      {status === 'not_verified' && (
        <TouchableOpacity style={styles.button} onPress={startIncomeVerification}>
          <Ionicons name="link-outline" size={20} color={COLORS.text} />
          <Text style={styles.buttonText}>Verify income with Vouch</Text>
        </TouchableOpacity>
      )}

      {status === 'ready' && (
        <TouchableOpacity style={styles.buttonPrimary} onPress={submitProofOnchain}>
          <Ionicons name="checkmark-done-outline" size={20} color="#fff" />
          <Text style={styles.buttonTextPrimary}>Submit proof onchain</Text>
        </TouchableOpacity>
      )}

      {status === 'verified' && txHash && (
        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => Linking.openURL(`https://polygonscan.com/tx/${txHash}`)}
        >
          <Ionicons name="open-outline" size={16} color={COLORS.primary} />
          <Text style={styles.linkText}>View on PolygonScan</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.description}>
        Prove your income from web2 sources using zero-knowledge proofs. Your credit limit will increase based on verified income.
      </Text>
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
  statusContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 16,
    padding: 12,
    backgroundColor: COLORS.background,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500' as const,
  },
  button: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    padding: 14,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginBottom: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.text,
  },
  buttonPrimary: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    padding: 14,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    marginBottom: 12,
  },
  buttonTextPrimary: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  linkButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 4,
    padding: 8,
  },
  linkText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500' as const,
  },
  description: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginTop: 8,
  },
};
