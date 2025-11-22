import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../theme/colors';
import { tokenService } from '../services/tokenService';
import { DISPLAY_CONFIG } from '../config/network';

interface BalanceCardProps {
  walletAddress: string;
}

export function BalanceCard({ walletAddress }: BalanceCardProps) {
  const [balance, setBalance] = useState<string>('0');
  const [isLoading, setIsLoading] = useState(false);

  const fetchBalance = async () => {
    try {
      setIsLoading(true);
      const usdcBal = await tokenService.getUSDCBalance(walletAddress);
      setBalance(usdcBal);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [walletAddress]);

  // Auto-refresh balance every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchBalance();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [walletAddress]);

  const usdValue = parseFloat(balance).toFixed(2); // USDC is already in USD

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.label}>Total Balance</Text>
          {isLoading ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <>
              <Text style={styles.balance}>${parseFloat(balance).toFixed(2)} USDC</Text>
              <Text style={styles.usd}>on {DISPLAY_CONFIG.networkName}</Text>
            </>
          )}
        </View>
        <TouchableOpacity onPress={fetchBalance} style={styles.refreshButton}>
          <Ionicons name="refresh" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.actions}>
        <View style={styles.actionItem}>
          <Ionicons name="arrow-up" size={20} color={COLORS.primary} />
          <Text style={styles.actionText}>Send</Text>
        </View>
        <View style={styles.actionItem}>
          <Ionicons name="arrow-down" size={20} color={COLORS.success} />
          <Text style={styles.actionText}>Receive</Text>
        </View>
        <View style={styles.actionItem}>
          <Ionicons name="swap-horizontal" size={20} color={COLORS.primary} />
          <Text style={styles.actionText}>Swap</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  balance: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  usd: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  refreshButton: {
    padding: SPACING.sm,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  actionItem: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  actionText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
});
