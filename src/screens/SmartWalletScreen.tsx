import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES } from '../theme/colors';

export function SmartWalletScreen() {
  const [loading, setLoading] = useState(true);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const webViewRef = useRef<WebView>(null);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      switch (data.type) {
        case 'WALLET_CREATED':
          setWalletAddress(data.address);
          Alert.alert('Success!', `Wallet created: ${data.address.slice(0, 10)}...`);
          break;
        case 'WALLET_LOADED':
          setWalletAddress(data.address);
          break;
        case 'TRANSACTION_SENT':
          Alert.alert('Transaction Sent!', `Hash: ${data.hash.slice(0, 10)}...`);
          break;
        case 'ERROR':
          Alert.alert('Error', data.message);
          break;
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  };

  const handleRefresh = () => {
    webViewRef.current?.reload();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="wallet" size={24} color={COLORS.primary} />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Smart Wallet</Text>
            {walletAddress && (
              <Text style={styles.headerSubtitle}>
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </Text>
            )}
          </View>
        </View>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={20} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Ionicons name="information-circle" size={16} color={COLORS.primary} />
        <Text style={styles.infoText}>
          Create wallet with biometric auth • No seed phrases needed
        </Text>
      </View>

      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading Smart Wallet...</Text>
        </View>
      )}

      {/* WebView */}
      <WebView
        ref={webViewRef}
        source={{ uri: 'http://localhost:3000' }}
        style={styles.webview}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          Alert.alert(
            'Connection Error',
            'Make sure the smart wallet server is running:\n\ncd smart-wallet/front && pnpm dev'
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerText: {
    gap: 2,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
  },
  refreshButton: {
    padding: SPACING.sm,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primaryLight,
  },
  infoText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    zIndex: 1000,
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  webview: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
