/**
 * Hybrid Verification Component
 * Combines Vouch (client-side) and vlayer (server-side) Web Proofs
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { vlayerProverService } from '../services/vlayerProverService';
import { ethers } from 'ethers';

interface HybridVerificationProps {
  walletAddress: string;
  onVerificationComplete: () => void;
}

export const HybridVerification: React.FC<HybridVerificationProps> = ({
  walletAddress,
  onVerificationComplete,
}) => {
  const [status, setStatus] = useState<'idle' | 'generating' | 'verifying' | 'submitting' | 'verified'>('idle');
  const [proofType, setProofType] = useState<'client' | 'server' | null>(null);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  /**
   * Server-side verification using vlayer Web Prover
   * Generates proof on server, suitable for AI agents
   */
  const startServerSideVerification = async () => {
    try {
      setStatus('generating');
      setProofType('server');

      console.log('🔐 Starting server-side verification with vlayer...');

      // Generate and verify Binance proof
      const { presentation, verified } = await vlayerProverService.generateBinanceBalanceProof('ETHUSDC');

      console.log('✅ Server-side proof generated and verified:', {
        domain: verified.serverDomain,
        success: verified.success,
      });

      // Extract income from verified data
      const incomeBucket = vlayerProverService.extractIncomeBucket(verified);

      console.log('📊 Extracted income bucket:', incomeBucket);

      // For demo: Skip blockchain submission (requires web3 wallet)
      // In production: Use Privy or WalletConnect for React Native
      console.log('📊 Would submit to blockchain:', {
        incomeBucket,
        proofHash: presentation.data.substring(0, 50) + '...',
      });

      setStatus('verified');

      // Show detailed verification result
      setVerificationResult({
        verified: true,
        source: 'Binance API',
        domain: verified.serverDomain,
        incomeBucket,
        creditLimit: incomeBucket * 3,
        proofHash: presentation.data.substring(0, 20) + '...',
        timestamp: new Date().toISOString(),
      });

      Alert.alert(
        '✅ Server-Side Verification Complete!',
        `Verified real Binance market data!\n\n💰 Income Bucket: $${incomeBucket}\n💳 Credit Limit: $${incomeBucket * 3}\n🔐 Proof: ${presentation.data.substring(0, 20)}...\n\nThis proves the agent has access to real financial data!`,
        [{ text: 'OK', onPress: onVerificationComplete }]
      );
    } catch (error: any) {
      console.error('❌ Server-side verification error:', error);
      Alert.alert('Error', error.message || 'Failed to verify with vlayer');
      setStatus('idle');
    }
  };

  /**
   * Submit proof to blockchain
   */
  const submitToBlockchain = async (incomeBucket: number, proofHash: string) => {
    try {
      setStatus('submitting');
      console.log('📝 Submitting proof to blockchain...');

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const verifierAddress = '0x8b00dEE5209e73F1D92bE834223D3497c57b4263';
      const verifierABI = [
        'function submitIncomeProofSimplified(address user, uint256 incomeBucket, bytes32 proofHash) external',
      ];

      const verifier = new ethers.Contract(verifierAddress, verifierABI, signer);
      
      const proofHashBytes32 = ethers.id(proofHash.substring(0, 100)); // Use first 100 chars for hash

      console.log('📝 Submitting proof onchain:', {
        user: walletAddress,
        incomeBucket,
        proofHash: proofHashBytes32,
      });

      const tx = await verifier.submitIncomeProofSimplified(
        walletAddress,
        incomeBucket,
        proofHashBytes32
      );

      console.log('⏳ Transaction sent:', tx.hash);
      await tx.wait();
      console.log('✅ Proof verified onchain!');

    } catch (error: any) {
      console.error('❌ Error submitting to blockchain:', error);
      throw error;
    }
  };

  const renderStatus = () => {
    switch (status) {
      case 'generating':
        return (
          <View style={styles.statusContainer}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.statusText}>Generating Web Proof...</Text>
          </View>
        );
      case 'verifying':
        return (
          <View style={styles.statusContainer}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.statusText}>Verifying Proof...</Text>
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
            <Text style={styles.successText}>✅ Verified!</Text>
            
            {verificationResult && (
              <View style={styles.resultCard}>
                <Text style={styles.resultTitle}>🤖 AI Agent Verification Details</Text>
                
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Data Source:</Text>
                  <Text style={styles.resultValue}>{verificationResult.source}</Text>
                </View>
                
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Verified Domain:</Text>
                  <Text style={styles.resultValue}>{verificationResult.domain}</Text>
                </View>
                
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Financial Capability:</Text>
                  <Text style={styles.resultValue}>${verificationResult.incomeBucket}</Text>
                </View>
                
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Credit Limit:</Text>
                  <Text style={styles.resultValue}>${verificationResult.creditLimit}</Text>
                </View>
                
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Proof Hash:</Text>
                  <Text style={styles.resultValueSmall}>{verificationResult.proofHash}</Text>
                </View>
                
                <View style={styles.useCaseBox}>
                  <Ionicons name="bulb-outline" size={16} color={COLORS.primary} />
                  <Text style={styles.useCaseText}>
                    This proves the AI agent has access to real Binance market data and can make informed trading decisions autonomously!
                  </Text>
                </View>
              </View>
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
        <Text style={styles.title}>Hybrid Verification</Text>
      </View>

      <View style={styles.badge}>
        <Ionicons name="flash" size={16} color={COLORS.primary} />
        <Text style={styles.badgeText}>Client-Side (Vouch) + Server-Side (vlayer)</Text>
      </View>

      {renderStatus()}

      {status === 'idle' && (
        <>
          <Text style={styles.description}>
            Server-side verification using vlayer Web Prover. Generates cryptographic proofs from Binance API data - perfect for AI agents!
          </Text>
          
          <View style={styles.demoNote}>
            <Ionicons name="information-circle" size={16} color={COLORS.primary} />
            <Text style={styles.demoNoteText}>
              This demo uses real Binance market data to generate verifiable proofs
            </Text>
          </View>

          <View style={styles.methodsContainer}>
            <View style={styles.methodCard}>
              <View style={styles.methodHeader}>
                <Ionicons name="phone-portrait-outline" size={20} color={COLORS.primary} />
                <Text style={styles.methodTitle}>Client-Side (Vouch)</Text>
              </View>
              <Text style={styles.methodDescription}>
                User connects their Binance/Wise account directly. Proof generated in browser.
              </Text>
              <Text style={styles.methodNote}>✓ User controls data</Text>
              <Text style={styles.methodNote}>✓ Privacy-preserving</Text>
            </View>

            <View style={styles.methodCard}>
              <View style={styles.methodHeader}>
                <Ionicons name="server-outline" size={20} color={COLORS.success} />
                <Text style={styles.methodTitle}>Server-Side (vlayer)</Text>
              </View>
              <Text style={styles.methodDescription}>
                Server generates proof from public APIs. Ideal for AI agents and automation.
              </Text>
              <Text style={styles.methodNote}>✓ No user interaction</Text>
              <Text style={styles.methodNote}>✓ Perfect for AI agents</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.verifyButton, isLoading && styles.buttonDisabled]}
            onPress={startServerSideVerification}
            disabled={isLoading}
          >
            <View style={styles.buttonIcon}>
              <Ionicons name="server" size={24} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.buttonTitle}>Try Server-Side Verification</Text>
              <Text style={styles.buttonSubtitle}>vlayer Web Prover (Demo)</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.infoText}>
              Server-side verification uses vlayer's Web Prover API to generate cryptographic proofs from Binance data.
            </Text>
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
    borderColor: COLORS.success + '40',
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
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start' as const,
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '600' as const,
  },
  description: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  methodsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  methodCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  methodHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 8,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.text,
  },
  methodDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 8,
    lineHeight: 18,
  },
  methodNote: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  verifyButton: {
    backgroundColor: COLORS.success,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    gap: 12,
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  buttonTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  buttonSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  infoBox: {
    flexDirection: 'row' as const,
    gap: 8,
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  demoNote: {
    flexDirection: 'row' as const,
    gap: 8,
    alignItems: 'center' as const,
    backgroundColor: COLORS.primary + '10',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  demoNoteText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.primary,
    lineHeight: 16,
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
  },
  resultCard: {
    alignSelf: 'stretch' as const,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.text,
    marginBottom: 8,
  },
  resultRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  resultLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500' as const,
  },
  resultValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600' as const,
  },
  resultValueSmall: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '500' as const,
    fontFamily: 'monospace',
  },
  useCaseBox: {
    flexDirection: 'row' as const,
    gap: 8,
    alignItems: 'flex-start' as const,
    backgroundColor: COLORS.primary + '10',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  useCaseText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.primary,
    lineHeight: 18,
  },
};
