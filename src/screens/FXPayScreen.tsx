import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../theme/colors';

interface ExchangeRate {
  id: string;
  pair: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  change: number;
  icon: string;
}

interface FXPayScreenProps {
  balance?: string;
  walletAddress?: string;
}

const EXCHANGE_RATES: ExchangeRate[] = [
  { id: '1', pair: 'BRL/USD', fromCurrency: 'BRL', toCurrency: 'USD', rate: 0.179209, change: 2.67, icon: '🇧🇷' },
  { id: '2', pair: 'EUR/USD', fromCurrency: 'EUR', toCurrency: 'USD', rate: 1.17347, change: -3.63, icon: '🇪🇺' },
  { id: '3', pair: 'TRY/USD', fromCurrency: 'TRY', toCurrency: 'USD', rate: 0.0249636, change: 2.86, icon: '🇹🇷' },
  { id: '4', pair: 'NGN/USD', fromCurrency: 'NGN', toCurrency: 'USD', rate: 0.0006546, change: 1.32, icon: '🇳🇬' },
  { id: '5', pair: 'VND/USD', fromCurrency: 'VND', toCurrency: 'USD', rate: 0.0000384, change: -1.94, icon: '🇻🇳' },
  { id: '6', pair: 'MXN/USD', fromCurrency: 'MXN', toCurrency: 'USD', rate: 0.0537374, change: 0.97, icon: '🇲🇽' },
];

// usdc to USD conversion rate (approximate)
const usdc_TO_USD = 600;

export function FXPayScreen({ balance = '0', walletAddress }: FXPayScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPair, setSelectedPair] = useState<ExchangeRate | null>(null);
  
  // Calculate USD balance from usdc
  const usdcBalance = parseFloat(balance);
  const usdBalance = usdcBalance * usdc_TO_USD;
  const formattedUsdBalance = usdBalance.toLocaleString('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
  
  // Calculate 24h change (mock data - in production, fetch from API)
  const changeAmount = usdBalance * 0.0041; // 0.41% change
  const changePercent = 0.41;

  const filteredRates = EXCHANGE_RATES.filter(rate =>
    rate.pair.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rate.fromCurrency.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rate.toCurrency.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <View style={styles.iconCircle}>
              <Ionicons name="flash" size={24} color={COLORS.primary} />
            </View>
            <View>
              <Text style={styles.headerTitle}>FX Pay</Text>
              <Text style={styles.headerSubtitle}>Powered by Better Payment Network</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="notifications-outline" size={20} color={COLORS.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Total Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceAmount}>{formattedUsdBalance}</Text>
            <Text style={styles.balanceCurrency}>USDC</Text>
          </View>
          <View style={styles.changeRow}>
            <Ionicons name="trending-up" size={14} color={COLORS.success} />
            <Text style={styles.changeText}>
              +{changeAmount.toFixed(2)} USDC ({changePercent.toFixed(2)}%)
            </Text>
          </View>
          <Text style={styles.usdcBalanceText}>
            {usdcBalance.toFixed(4)} usdc ≈ ${formattedUsdBalance} USD
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionButton}>
            <View style={[styles.quickActionIcon, { backgroundColor: `${COLORS.primary}15` }]}>
              <Ionicons name="arrow-up" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.quickActionText}>Transfer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton}>
            <View style={[styles.quickActionIcon, { backgroundColor: `${COLORS.success}15` }]}>
              <Ionicons name="arrow-down" size={20} color={COLORS.success} />
            </View>
            <Text style={styles.quickActionText}>Deposit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton}>
            <View style={[styles.quickActionIcon, { backgroundColor: `${COLORS.error}15` }]}>
              <Ionicons name="cash-outline" size={20} color={COLORS.error} />
            </View>
            <Text style={styles.quickActionText}>Withdraw</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton}>
            <View style={[styles.quickActionIcon, { backgroundColor: `${COLORS.accent}` }]}>
              <Ionicons name="swap-horizontal" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.quickActionText}>Swap</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Exchange Rates Section */}
      <View style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Exchange Rate</Text>
          <TouchableOpacity>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search coin"
            placeholderTextColor={COLORS.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Exchange Rate List */}
        <ScrollView style={styles.ratesList} showsVerticalScrollIndicator={false}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 2 }]}>Fiat Pair</Text>
            <Text style={[styles.tableHeaderText, { flex: 1.5, textAlign: 'right' }]}>Our Rate</Text>
            <Text style={[styles.tableHeaderText, { flex: 1.5, textAlign: 'right' }]}>Change (5min)</Text>
            <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>Action</Text>
          </View>

          {filteredRates.map((rate) => (
            <TouchableOpacity
              key={rate.id}
              style={styles.rateRow}
              onPress={() => setSelectedPair(rate)}
            >
              <View style={[styles.rateCell, { flex: 2 }]}>
                <Text style={styles.currencyIcon}>{rate.icon}</Text>
                <View>
                  <Text style={styles.pairText}>{rate.pair}</Text>
                  <Text style={styles.pairSubtext}>{rate.fromCurrency}/{rate.toCurrency}</Text>
                </View>
              </View>

              <View style={[styles.rateCell, { flex: 1.5, alignItems: 'flex-end' }]}>
                <Text style={styles.rateValue}>{rate.rate.toFixed(6)}</Text>
              </View>

              <View style={[styles.rateCell, { flex: 1.5, alignItems: 'flex-end' }]}>
                <View style={[styles.changeBadge, { backgroundColor: rate.change > 0 ? `${COLORS.success}15` : `${COLORS.error}15` }]}>
                  <Ionicons
                    name={rate.change > 0 ? 'trending-up' : 'trending-down'}
                    size={12}
                    color={rate.change > 0 ? COLORS.success : COLORS.error}
                  />
                  <Text style={[styles.changeValue, { color: rate.change > 0 ? COLORS.success : COLORS.error }]}>
                    {rate.change > 0 ? '+' : ''}{rate.change.toFixed(2)}%
                  </Text>
                </View>
              </View>

              <View style={[styles.rateCell, { flex: 1, alignItems: 'center' }]}>
                <TouchableOpacity style={styles.swapButton}>
                  <Text style={styles.swapButtonText}>Swap</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.card,
    paddingTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceCard: {
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
  },
  balanceLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING.sm,
  },
  balanceAmount: {
    fontSize: FONT_SIZES.xxl * 1.2,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  balanceCurrency: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: SPACING.xs,
  },
  changeText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.success,
    fontWeight: '600',
  },
  usdcBalanceText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  ratesList: {
    flex: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  tableHeaderText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  rateRow: {
    flexDirection: 'row',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    alignItems: 'center',
  },
  rateCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  currencyIcon: {
    fontSize: 24,
  },
  pairText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  pairSubtext: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  rateValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  changeValue: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  swapButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  swapButtonText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.text,
  },
});
