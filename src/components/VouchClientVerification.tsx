/**
 * Vouch Client-Side Verification Component
 * Uses Vouch SDK for client-side Web Proof generation with Binance/Wise
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, Linking, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { ethers } from 'ethers';
import { vouchClientService } from '../services/vouchClientService';

interface VouchClientVerificationProps {
  walletAddress: string;
  onVerificationComplete: () => void;
}

export const VouchClientVerification: React.FC<VouchClientVerificationProps> = ({
  walletAddress,
  onVerificationComplete,
}) => {
  const [status, setStatus] = useState<'idle' | 'redirecting' | 'waiting' | 'submitting' | 'verified'>('idle');
  const [proofData, setProofData] = useState<any>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);

  // Check if returning from Vouch
  useEffect(() => {
    const checkVouchReturn = () => {
      if (typeof window === 'undefined') return;

      const params = new URLSearchParams(window.location.search);
      const vouchType = params.get('vouch');
      const returnedRequestId = params.get('requestId');

      if ((vouchType === 'binance' || vouchType === 'wise') && returnedRequestId) {
        setRequestId(returnedRequestId);
        setStatus('waiting');
        pollForProof(returnedRequestId);
      }
    };

    checkVouchReturn();
  }, []);

  const pollForProof = async (reqId: string, attempts = 0) => {
    if (attempts > 20) {
      console.log('⏱️ Polling timeout after 20 attempts');
      Alert.alert(
        'Verification In Progress',
        'The verification is taking longer than expected. You can close this and check back later, or wait for the proof to complete.',
        [
          { text: 'Keep Waiting', onPress: () => pollForProof(reqId, 0) },
          { text: 'Close', onPress: () => setStatus('idle') }
        ]
      );
      return;
    }

    try {
      console.log(`🔄 Polling for proof (attempt ${attempts + 1}/20)...`);
      
      // Try to get proof from Vouch API
      const proof = await vouchClientService.getProof(reqId);
      
      if (proof) {
        console.log('✅ Proof received!', proof);
        setProofData(proof);
        setStatus('verified');
        
        Alert.alert(
          '✅ Verification Complete!',
          'Your Binance balance has been verified with Vouch!',
          [{ text: 'OK', onPress: onVerificationComplete }]
        );
      } else {
        // Proof not ready yet, poll again
        console.log('⏳ Proof not ready, polling again in 3s...');
        setTimeout(() => pollForProof(reqId, attempts + 1), 3000);
      }
    } catch (error: any) {
      console.error('❌ Error polling for proof:', error.message);
      // Continue polling even on error (might be network issue)
      setTimeout(() => pollForProof(reqId, attempts + 1), 3000);
    }
  };

  const startBinanceVerification = async () => {
    console.log('🔥 startBinanceVerification called!');
    try {
      setStatus('redirecting');
      console.log('📝 Status set to redirecting');

      const { requestId: newRequestId, verificationUrl } = await vouchClientService.startBinanceVerification('ETH');
      
      setRequestId(newRequestId);
      console.log('🔗 Got verification URL:', verificationUrl);
      console.log('🔗 Request ID:', newRequestId);
 
      // Open in browser immediately (no alert for web)
      try {
        console.log('🌐 Checking environment...');
        console.log('🌐 window exists?', typeof window !== 'undefined');
        console.log('🌐 window.location exists?', typeof window !== 'undefined' && !!window.location);
        
        if (typeof window !== 'undefined' && window.location) {
          // For web, open in new tab
          console.log('🌐 Opening in web browser (new tab)...');
          const newWindow = window.open(verificationUrl, '_blank');
          
          if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
            // Popup blocked - redirect in same window
            console.warn('⚠️ Popup blocked! Redirecting in same window...');
            window.location.href = verificationUrl;
          } else {
            console.log('✅ New tab opened successfully');
          }
          
          setStatus('waiting');
          
          // Show instructions while waiting
          Alert.alert(
            '✅ Browser Opened',
            'Complete the Binance verification in the browser tab. Once done, return here and the proof will be ready.',
            [{ text: 'OK' }]
          );
          
          // Don't poll - user will complete verification in browser
          // pollForProof(newRequestId);
        } else {
          // For mobile, use in-app browser
          console.log('📱 Opening in mobile browser...');
          const result = await WebBrowser.openBrowserAsync(verificationUrl, {
            presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
            controlsColor: COLORS.primary,
          });
          
          console.log('📱 WebBrowser result:', result);
          
          // After browser closes, check for proof
          if (result.type === 'cancel' || result.type === 'dismiss') {
            setStatus('waiting');
            pollForProof(newRequestId);
          }
        }
      } catch (browserError) {
        console.error('❌ Error opening browser:', browserError);
        // Fallback to Linking
        console.log('🔄 Trying fallback with Linking...');
        await Linking.openURL(verificationUrl);
        setStatus('waiting');
        pollForProof(newRequestId);
      }
    } catch (error: any) {
      console.error('❌ Error starting Binance verification:', error);
      Alert.alert('Error', error.message || 'Failed to start verification');
      setStatus('idle');
    }
  };

  const startWiseVerification = async () => {
    console.log('🔥 startWiseVerification called!');
    try {
      setStatus('redirecting');
      console.log('📝 Status set to redirecting');

      const { requestId: newRequestId, verificationUrl } = await vouchClientService.startWiseVerification();
      
      setRequestId(newRequestId);
      console.log('🔗 Got verification URL:', verificationUrl);
      console.log('🔗 Request ID:', newRequestId);

      // Open in browser immediately (no alert for web)
      try {
        console.log('🌐 Checking environment...');
        
        if (typeof window !== 'undefined' && window.location) {
          // For web, open in new tab
          console.log('🌐 Opening in web browser (new tab)...');
          window.open(verificationUrl, '_blank');
          setStatus('waiting');
          pollForProof(newRequestId);
        } else {
          // For mobile, use in-app browser
          console.log('📱 Opening in mobile browser...');
          const result = await WebBrowser.openBrowserAsync(verificationUrl, {
            presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
            controlsColor: COLORS.primary,
          });
          
          console.log('📱 WebBrowser result:', result);
          
          // After browser closes, check for proof
          if (result.type === 'cancel' || result.type === 'dismiss') {
            setStatus('waiting');
            pollForProof(newRequestId);
          }
        }
      } catch (browserError) {
        console.error('❌ Error opening browser:', browserError);
        // Fallback to Linking
        console.log('🔄 Trying fallback with Linking...');
        await Linking.openURL(verificationUrl);
        setStatus('waiting');
        pollForProof(newRequestId);
      }
    } catch (error: any) {
      console.error('❌ Error starting Wise verification:', error);
      Alert.alert('Error', error.message || 'Failed to start verification');
      setStatus('idle');
    }
  };

  const submitToBlockchain = async (proof: any) => {
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
      
      // Extract income bucket from proof
      const incomeBucket = proof.metadata?.incomeBucket || 1000;
      const proofHash = ethers.id(JSON.stringify(proof));

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
        '✅ Verified with Vouch!',
        `Income verified using client-side Web Proof!\n\nCredit Limit: $${incomeBucket * 3}`,
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
      case 'redirecting':
        return (
          <View style={styles.statusContainer}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.statusText}>Redirecting to Vouch...</Text>
          </View>
        );
      case 'waiting':
        return (
          <View style={styles.statusContainer}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.statusText}>Generating Web Proof...</Text>
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
            <Text style={styles.successText}>✅ Verified with Vouch!</Text>
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
        <Ionicons name="globe-outline" size={24} color={COLORS.primary} />
        <Text style={styles.title}>Income Verification (Vouch Client)</Text>
      </View>

      <View style={styles.badge}>
        <Ionicons name="flash" size={16} color={COLORS.primary} />
        <Text style={styles.badgeText}>Client-Side Web Proofs with Vouch SDK</Text>
      </View>

      {renderStatus()}

      {status === 'idle' && (
        <>
          <Text style={styles.description}>
            Verify your income using real financial data from Binance or Wise. Powered by Vouch client-side proving.
          </Text>

          <View style={styles.buttonGrid}>
            <TouchableOpacity
              style={[styles.verifyButton, isLoading && styles.buttonDisabled]}
              onPress={startBinanceVerification}
              disabled={isLoading}
            >
              <View style={styles.buttonIcon}>
                <Ionicons name="logo-bitcoin" size={24} color="#fff" />
              </View>
              <Text style={styles.buttonTitle}>Verify with Binance</Text>
              <Text style={styles.buttonSubtitle}>Proof of Balance (USDT)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.verifyButton, isLoading && styles.buttonDisabled]}
              onPress={startWiseVerification}
              disabled={isLoading}
            >
              <View style={styles.buttonIcon}>
                <Ionicons name="card-outline" size={24} color="#fff" />
              </View>
              <Text style={styles.buttonTitle}>Verify with Wise</Text>
              <Text style={styles.buttonSubtitle}>Proof of Transaction</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.steps}>
            <Text style={styles.stepsTitle}>How it works:</Text>
            <Text style={styles.stepText}>1. 🔗 Opens Vouch in browser</Text>
            <Text style={styles.stepText}>2. 🔐 Connect your Binance/Wise account</Text>
            <Text style={styles.stepText}>3. 👆 Click "Open" button in top right corner</Text>
            <Text style={styles.stepText}>4. ✅ Complete verification & return to app</Text>
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
    flexDirection: 'row' as const,
    gap: 12,
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
    flex: 1,
  },
  buttonSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
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
