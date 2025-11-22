import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../theme/colors';
import { useNexus } from '../providers/NexusProvider';

export function UnifiedBalance() {
  const { unifiedBalance, loading, fetchUnifiedBalance } = useNexus();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading balances...</Text>
      </View>
    );
  }

  if (!unifiedBalance || unifiedBalance.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="wallet-outline" size={48} color={COLORS.textSecondary} />
        <Text style={styles.emptyText}>No balances found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Unified Balance</Text>
        <TouchableOpacity onPress={fetchUnifiedBalance} style={styles.refreshButton}>
          <Ionicons name="refresh" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.balanceList} showsVerticalScrollIndicator={false}>
        {unifiedBalance.map((asset, index) => (
          <View key={index} style={styles.assetCard}>
            <View style={styles.assetHeader}>
              <View style={styles.assetInfo}>
                <Text style={styles.assetSymbol}>{asset.symbol}</Text>
                <Text style={styles.assetBalance}>{asset.balance}</Text>
              </View>
              {asset.balanceInFiat && (
                <Text style={styles.assetFiat}>${asset.balanceInFiat.toFixed(2)}</Text>
              )}
            </View>
            
            {asset.breakdown && asset.breakdown.length > 0 && (
              <View style={styles.breakdown}>
                <Text style={styles.breakdownTitle}>Available on:</Text>
                {asset.breakdown.map((chain, idx) => (
                  <View key={idx} style={styles.chainRow}>
                    <View style={styles.chainDot} />
                    <Text style={styles.chainName}>{chain.chain.name}</Text>
                    <Text style={styles.chainBalance}>{chain.balance}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  refreshButton: {
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.accent,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  emptyText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  balanceList: {
    flex: 1,
    padding: SPACING.lg,
  },
  assetCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  assetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  assetInfo: {
    flex: 1,
  },
  assetSymbol: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  assetBalance: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.primary,
  },
  assetFiat: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  breakdown: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.md,
  },
  breakdownTitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    fontWeight: '600',
  },
  chainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  chainDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginRight: SPACING.sm,
  },
  chainName: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  chainBalance: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
});
