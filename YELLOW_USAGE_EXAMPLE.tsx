/**
 * Example: Using Yellow Network for Instant, Gasless Credit Operations
 * 
 * This shows how to integrate Yellow Network into your Credit Screen
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { yellowNetworkService } from './src/services/yellowNetworkService';

export function YellowCreditExample() {
  const [yellowConnected, setYellowConnected] = useState(false);
  const [sessionCreated, setSessionCreated] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Check Yellow Network connection status
  useEffect(() => {
    const checkConnection = () => {
      setYellowConnected(yellowNetworkService.isConnected());
    };

    checkConnection();
    const interval = setInterval(checkConnection, 2000);
    return () => clearInterval(interval);
  }, []);

  // Create a credit session (do this once after user verification)
  const handleCreateSession = async () => {
    try {
      setProcessing(true);
      
      // Create session with 100 USDT credit limit
      const sessionId = await yellowNetworkService.createCreditSession(100);
      
      console.log('✅ Credit session created:', sessionId);
      Alert.alert('Success', 'Credit session created! You can now borrow instantly.');
      setSessionCreated(true);
    } catch (error: any) {
      console.error('❌ Failed to create session:', error);
      Alert.alert('Error', error.message || 'Failed to create credit session');
    } finally {
      setProcessing(false);
    }
  };

  // Borrow USDT instantly (no gas fees!)
  const handleBorrow = async (amount: number) => {
    try {
      setProcessing(true);
      
      // Borrow instantly via Yellow Network state channel
      const txHash = await yellowNetworkService.borrowInstant(amount);
      
      console.log('✅ Borrowed instantly:', txHash);
      Alert.alert(
        'Success!', 
        `Borrowed ${amount} USDT instantly!\n\n` +
        `Transaction: ${txHash}\n\n` +
        `✨ Zero gas fees\n` +
        `⚡ Instant settlement`
      );
    } catch (error: any) {
      console.error('❌ Borrow failed:', error);
      Alert.alert('Error', error.message || 'Failed to borrow');
    } finally {
      setProcessing(false);
    }
  };

  // Repay USDT instantly (no gas fees!)
  const handleRepay = async (amount: number) => {
    try {
      setProcessing(true);
      
      // Repay instantly via Yellow Network state channel
      const txHash = await yellowNetworkService.repayInstant(amount);
      
      console.log('✅ Repaid instantly:', txHash);
      Alert.alert(
        'Success!', 
        `Repaid ${amount} USDT instantly!\n\n` +
        `Transaction: ${txHash}\n\n` +
        `✨ Zero gas fees\n` +
        `⚡ Instant settlement`
      );
    } catch (error: any) {
      console.error('❌ Repay failed:', error);
      Alert.alert('Error', error.message || 'Failed to repay');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      {/* Connection Status */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold' }}>
          Yellow Network Status
        </Text>
        <Text style={{ color: yellowConnected ? 'green' : 'red' }}>
          {yellowConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </Text>
      </View>

      {/* Create Session Button */}
      {yellowConnected && !sessionCreated && (
        <TouchableOpacity
          onPress={handleCreateSession}
          disabled={processing}
          style={{
            backgroundColor: '#FFD700',
            padding: 15,
            borderRadius: 10,
            marginBottom: 10,
          }}
        >
          <Text style={{ textAlign: 'center', fontWeight: 'bold' }}>
            {processing ? 'Creating...' : '🟡 Create Credit Session'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Borrow Button */}
      {sessionCreated && (
        <TouchableOpacity
          onPress={() => handleBorrow(50)}
          disabled={processing}
          style={{
            backgroundColor: '#4CAF50',
            padding: 15,
            borderRadius: 10,
            marginBottom: 10,
          }}
        >
          <Text style={{ textAlign: 'center', fontWeight: 'bold', color: 'white' }}>
            {processing ? 'Processing...' : '💸 Borrow 50 USDT (Instant, No Gas!)'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Repay Button */}
      {sessionCreated && (
        <TouchableOpacity
          onPress={() => handleRepay(25)}
          disabled={processing}
          style={{
            backgroundColor: '#2196F3',
            padding: 15,
            borderRadius: 10,
          }}
        >
          <Text style={{ textAlign: 'center', fontWeight: 'bold', color: 'white' }}>
            {processing ? 'Processing...' : '💰 Repay 25 USDT (Instant, No Gas!)'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Info */}
      <View style={{ marginTop: 20, padding: 15, backgroundColor: '#f0f0f0', borderRadius: 10 }}>
        <Text style={{ fontSize: 14, marginBottom: 5 }}>
          ✨ <Text style={{ fontWeight: 'bold' }}>Zero Gas Fees</Text>
        </Text>
        <Text style={{ fontSize: 14, marginBottom: 5 }}>
          ⚡ <Text style={{ fontWeight: 'bold' }}>Instant Settlement</Text> (&lt; 1 second)
        </Text>
        <Text style={{ fontSize: 14 }}>
          🔒 <Text style={{ fontWeight: 'bold' }}>Secure State Channels</Text>
        </Text>
      </View>
    </View>
  );
}

/**
 * Integration Steps:
 * 
 * 1. Yellow Network is automatically initialized when user logs in with Privy
 *    (via useYellowNetwork hook in App.tsx)
 * 
 * 2. Check connection status:
 *    const isConnected = yellowNetworkService.isConnected();
 * 
 * 3. Create credit session after user verification:
 *    await yellowNetworkService.createCreditSession(creditLimit);
 * 
 * 4. Use instant borrow/repay:
 *    await yellowNetworkService.borrowInstant(amount);
 *    await yellowNetworkService.repayInstant(amount);
 * 
 * 5. Listen for events:
 *    yellowNetworkService.onMessage('transaction', (msg) => { ... });
 */
