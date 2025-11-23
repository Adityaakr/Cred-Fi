import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, Platform, Clipboard, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import QRCode from 'react-native-qrcode-svg';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Sheet } from '../components/Sheet';
import { Input } from '../components/Input';
import { BalanceCard } from '../components/BalanceCard';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS, GRADIENTS } from '../theme/colors';
import { walletService } from '../services/walletService';
import { tokenService } from '../services/tokenService';
import { DISPLAY_CONFIG } from '../config/network';
// import { NexusSendScreen } from './NexusSendScreen';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface HomeScreenProps {
  walletAddress?: string | null;
  balance?: string;
  onSendClick?: () => void;
  onFXPayClick?: () => void;
}

export const HomeScreen = ({ walletAddress, balance: balanceProp, onSendClick, onFXPayClick }: HomeScreenProps) => {
  const [showSend, setShowSend] = useState(false);
  const [showReceive, setShowReceive] = useState(false);
  const [showSwap, setShowSwap] = useState(false);
  const [showMultiChainSend, setShowMultiChainSend] = useState(false);
  const [usdcBalance, setUsdcBalance] = useState<string>('0');
  const [maticBalance, setMaticBalance] = useState<string>(balanceProp || '0');
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // Update balance when prop changes
  useEffect(() => {
    if (balanceProp !== undefined) {
      setMaticBalance(balanceProp);
      setIsLoadingBalance(false);
    }
  }, [balanceProp]);

  // Fetch balance when wallet is connected (fallback for mobile only)
  useEffect(() => {
    // Only fetch if no balance prop is provided (mobile case)
    if (walletAddress && balanceProp === undefined) {
      fetchBalance();
    }
  }, [walletAddress]);

  // Auto-refresh balance every 10 seconds
  useEffect(() => {
    if (!walletAddress) return;
    
    const interval = setInterval(() => {
      fetchBalance();
    }, 10000); // Refresh every 10 seconds
    
    return () => clearInterval(interval);
  }, [walletAddress]);

  const fetchBalance = async () => {
    if (!walletAddress) return;
    
    try {
      setIsLoadingBalance(true);
      // Fetch both USDC and MATIC balances
      const balances = await tokenService.getAllBalances(walletAddress);
      setUsdcBalance(balances.usdc);
      setMaticBalance(balances.matic);
      console.log('💰 Balance updated:', balances);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const balance = {
    total: parseFloat(usdcBalance), // USDC is already in USD
    available: parseFloat(usdcBalance),
    locked: 0,
    percentChange: 12.5,
  };

  // Cashflow chart data
  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        data: [60, 75, 70, 85, 80, 95],
        color: () => COLORS.chart1,
        strokeWidth: 2,
      },
      {
        data: [50, 60, 55, 70, 65, 75],
        color: () => COLORS.chart2,
        strokeWidth: 2,
      },
      {
        data: [40, 50, 45, 60, 55, 65],
        color: () => COLORS.chart3,
        strokeWidth: 2,
      },
    ],
  };

  const transactions = [
    { type: 'inflow', amount: 250, label: 'Salary payment', date: '2 days ago' },
    { type: 'outflow', amount: -45, label: 'Agent: Research Bot', date: '3 days ago' },
    { type: 'inflow', amount: 120, label: 'Freelance work', date: '5 days ago' },
    { type: 'outflow', amount: -30, label: 'Credit repayment', date: '1 week ago' },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Live Balance Card */}
      {walletAddress ? (
        <LinearGradient
          colors={GRADIENTS.card}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          <View style={styles.balanceHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.balanceLabel}>Total Balance</Text>
              {isLoadingBalance ? (
                <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 10 }} />
              ) : (
                <>
                  <Text style={styles.balanceAmount}>
                    ${parseFloat(usdcBalance).toFixed(2)} USDC
                  </Text>
                  <Text style={styles.balanceCurrency}>
                    {parseFloat(maticBalance).toFixed(4)} {DISPLAY_CONFIG.nativeToken} • {DISPLAY_CONFIG.networkName}
                  </Text>
                </>
              )}
            </View>
            <TouchableOpacity onPress={fetchBalance} style={styles.refreshButton}>
              <Ionicons name="refresh" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.balanceBreakdown}>
            <View>
              <Text style={styles.breakdownLabel}>Primary Balance</Text>
              <Text style={styles.breakdownValue}>USDC</Text>
            </View>
            <View>
              <Text style={styles.breakdownLabel}>Network</Text>
              <Text style={styles.breakdownValue}>{DISPLAY_CONFIG.networkBadge}</Text>
            </View>
            <View>
            </View>
          </View>
        </LinearGradient>
      ) : (
        <LinearGradient
          colors={GRADIENTS.card}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          <View style={styles.balanceHeader}>
            <View>
              <Text style={styles.balanceLabel}>Total Balance</Text>
              <Text style={styles.balanceAmount}>--</Text>
              <Text style={styles.balanceCurrency}>Connect wallet to view balance</Text>
            </View>
          </View>
        </LinearGradient>
      )}

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {
            console.log('🚀 HomeScreen Send clicked');
            if (onSendClick) {
              onSendClick();
            } else {
              setShowSend(true);
            }
          }}
        >
          <View style={styles.actionIcon}>
            <Ionicons name="arrow-up-outline" size={20} color={COLORS.primary} />
          </View>
          <Text style={styles.actionLabel}>Send</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => setShowReceive(true)}>
          <View style={styles.actionIcon}>
            <Ionicons name="arrow-down-outline" size={20} color={COLORS.primary} />
          </View>
          <Text style={styles.actionLabel}>Receive</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => setShowSwap(true)}>
          <View style={styles.actionIcon}>
            <Ionicons name="swap-horizontal-outline" size={20} color={COLORS.primary} />
          </View>
          <Text style={styles.actionLabel}>Swap</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {
            if (onFXPayClick) {
              onFXPayClick();
            }
          }}
        >
          <View style={styles.actionIcon}>
            <Ionicons name="flash-outline" size={20} color={COLORS.primary} />
          </View>
          <Text style={styles.actionLabel}>FX Pay</Text>
        </TouchableOpacity>
      </View>

      {/* Cashflow Chart */}
      <Card style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Cashflow</Text>
          <Text style={styles.chartPeriod}>6 Months</Text>
        </View>
        <LineChart
          data={chartData}
          width={SCREEN_WIDTH - 64}
          height={220}
          chartConfig={{
            backgroundColor: 'transparent',
            backgroundGradientFrom: COLORS.card,
            backgroundGradientTo: COLORS.card,
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(240, 185, 11, ${opacity})`,
            labelColor: () => COLORS.textSecondary,
            style: {
              borderRadius: BORDER_RADIUS.lg,
            },
            propsForDots: {
              r: '0',
            },
            propsForBackgroundLines: {
              strokeDasharray: '',
              stroke: COLORS.border,
              strokeWidth: 1,
            },
          }}
          bezier
          style={styles.chart}
          withInnerLines={true}
          withOuterLines={false}
          withVerticalLabels={true}
          withHorizontalLabels={true}
        />
        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.chart1 }]} />
            <Text style={styles.legendText}>Inflows</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.chart2 }]} />
            <Text style={styles.legendText}>Outflows</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.chart3 }]} />
            <Text style={styles.legendText}>Net</Text>
          </View>
        </View>
      </Card>

      {/* Highlights */}
      <View style={styles.highlights}>
        <Card style={styles.highlightCard}>
          <View style={styles.highlightContent}>
            <View style={styles.highlightLeft}>
              <View style={styles.highlightIcon}>
                <Ionicons name="trending-up" size={20} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.highlightTitle}>Credit Available</Text>
                <Text style={styles.highlightSubtitle}>450 USDT available</Text>
              </View>
            </View>
            <Button variant="ghost" size="sm">View</Button>
          </View>
        </Card>

        <Card style={styles.highlightCard}>
          <View style={styles.highlightContent}>
            <View style={styles.highlightLeft}>
              <View style={styles.highlightIcon}>
                <Text style={styles.highlightEmoji}>🤖</Text>
              </View>
              <View>
                <Text style={styles.highlightTitle}>3 Active Agents</Text>
                <Text style={styles.highlightSubtitle}>12.50 USDT spent today</Text>
              </View>
            </View>
            <Button variant="ghost" size="sm">Manage</Button>
          </View>
        </Card>

        <Card style={styles.highlightCard}>
          <View style={styles.highlightContent}>
            <View style={styles.highlightLeft}>
              <View style={styles.highlightIcon}>
                <Ionicons name="trending-up" size={20} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.highlightTitle}>Savings Earning</Text>
                <Text style={styles.highlightSubtitle}>+2.40 USDT this month</Text>
              </View>
            </View>
            <Button variant="ghost" size="sm">Details</Button>
          </View>
        </Card>
      </View>

      {/* Recent Activity */}
      <Card style={styles.activityCard}>
        <Text style={styles.activityTitle}>Recent Activity</Text>
        <Text style={styles.activitySubtitle}>Last 30 days on BPN</Text>
        <View style={styles.activityList}>
          {transactions.map((tx, i) => (
            <View key={i} style={styles.transaction}>
              <View style={[
                styles.txIcon,
                { backgroundColor: tx.type === 'inflow' ? COLORS.inflowBg : COLORS.outflowBg }
              ]}>
                <Ionicons
                  name={tx.type === 'inflow' ? 'arrow-down' : 'arrow-up'}
                  size={20}
                  color={tx.type === 'inflow' ? COLORS.inflow : COLORS.outflow}
                />
              </View>
              <View style={styles.txDetails}>
                <Text style={styles.txLabel}>{tx.label}</Text>
                <Text style={styles.txDate}>{tx.date}</Text>
              </View>
              <Text style={[
                styles.txAmount,
                { color: tx.type === 'inflow' ? COLORS.inflow : COLORS.outflow }
              ]}>
                {tx.amount > 0 ? '+' : ''}{tx.amount} USDT
              </Text>
            </View>
          ))}
        </View>
      </Card>

      {/* Send Sheet */}
      <Sheet
        visible={showSend}
        onClose={() => setShowSend(false)}
        title="Send USDT"
        description="Send stablecoins over BPN to any address"
      >
        <View style={styles.sheetContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>To Address</Text>
            <Input placeholder="0x..." />
          </View>
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Amount</Text>
              <Text style={styles.maxLabel}>Max: {balance.available} USDT</Text>
            </View>
            <Input placeholder="0.00" keyboardType="numeric" large />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Memo (Optional)</Text>
            <Input placeholder="Add a note..." />
          </View>
          <View style={styles.feeBox}>
            <Text style={styles.feeLabel}>Network Fee</Text>
            <Text style={styles.feeAmount}>~$0.02</Text>
          </View>
          <Button size="lg" style={styles.sheetButton}>
            Review Transaction
          </Button>
        </View>
      </Sheet>

      {/* Receive Sheet */}
      <Sheet
        visible={showReceive}
        onClose={() => setShowReceive(false)}
        title="Receive usdc"
        description="Send usdc on usdc Chain / BPN to this address"
      >
        <View style={styles.sheetContent}>
          <View style={styles.qrBox}>
            {walletAddress ? (
              <QRCode
                value={walletAddress}
                size={200}
                backgroundColor="white"
                color="black"
              />
            ) : (
              <Text style={styles.qrPlaceholder}>No wallet connected</Text>
            )}
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Your BPN Vault Address</Text>
            <View style={styles.addressRow}>
              <Input
                value={walletAddress || 'No wallet connected'}
                editable={false}
                style={styles.addressInput}
              />
              <Button 
                variant="outline" 
                size="sm"
                onPress={() => {
                  if (walletAddress) {
                    if (Platform.OS === 'web') {
                      navigator.clipboard.writeText(walletAddress);
                      alert('✓ Address copied!');
                    } else {
                      Clipboard.setString(walletAddress);
                      alert('✓ Address copied!');
                    }
                  }
                }}
              >
                Copy
              </Button>
            </View>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              💡 Only send usdc, USDT or FDUSD on usdc Chain. Other tokens may be lost.
            </Text>
          </View>
        </View>
      </Sheet>

      {/* Nexus Send Modal - Disabled for now */}
      {/* <Modal
        visible={showMultiChainSend}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMultiChainSend(false)}
      >
        {walletAddress && (
          <NexusSendScreen
            walletAddress={walletAddress}
            onClose={() => setShowMultiChainSend(false)}
          />
        )}
      </Modal> */}

      {/* Swap Sheet */}
      <Sheet
        visible={showSwap}
        onClose={() => setShowSwap(false)}
        title="Swap Tokens"
        description="Exchange tokens on usdc Chain"
      >
        <View style={styles.sheetContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>From</Text>
            <View style={styles.swapInputRow}>
              <Input placeholder="0.00" keyboardType="numeric" style={styles.swapInput} />
              <Badge>USDT</Badge>
            </View>
          </View>
          <View style={styles.swapArrow}>
            <Ionicons name="arrow-down" size={20} color={COLORS.textSecondary} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>To</Text>
            <View style={styles.swapInputRow}>
              <Input placeholder="0.00" editable={false} style={styles.swapInput} />
              <Badge>FDUSD</Badge>
            </View>
          </View>
          <View style={styles.rateBox}>
            <Text style={styles.rateText}>
              Estimated swap rate: 1 USDT = 1.0002 FDUSD
            </Text>
          </View>
        </View>
      </Sheet>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  balanceCard: {
    margin: SPACING.lg,
    padding: SPACING.xxl,
    borderRadius: BORDER_RADIUS.xl,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xxl,
  },
  balanceLabel: {
    fontSize: FONT_SIZES.sm,
    color: '#9CA3AF',
    marginBottom: SPACING.sm,
  },
  balanceAmount: {
    fontSize: FONT_SIZES.huge,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  balanceCurrency: {
    fontSize: FONT_SIZES.sm,
    color: '#9CA3AF',
    marginTop: 4,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    fontWeight: '600',
  },
  actionLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    marginTop: SPACING.xs,
    fontWeight: '500',
  },
  actionSubtext: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  balanceBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  breakdownLabel: {
    fontSize: FONT_SIZES.sm,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  breakdownValue: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '600',
    color: COLORS.text,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.primary}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  chartCard: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  chartTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  chartPeriod: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  chart: {
    marginVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.lg,
    marginTop: SPACING.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  highlights: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  highlightCard: {
    padding: SPACING.lg,
  },
  highlightContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  highlightLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  highlightIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.primary}10`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightEmoji: {
    fontSize: 20,
  },
  highlightTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  highlightSubtitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  activityCard: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.xxl,
  },
  activityTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  activitySubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  activityList: {
    gap: SPACING.sm,
  },
  transaction: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.cardSecondary,
    borderRadius: BORDER_RADIUS.md,
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  txDetails: {
    flex: 1,
  },
  txLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  txDate: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  txAmount: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  sheetContent: {
    paddingBottom: SPACING.xxl,
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  maxLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
  },
  feeBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    backgroundColor: COLORS.accent,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
  },
  feeLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  feeAmount: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  sheetButton: {
    width: '100%',
  },
  qrBox: {
    backgroundColor: COLORS.accent,
    padding: SPACING.xxxl,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    height: 200,
  },
  qrPlaceholder: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  addressRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  addressInput: {
    flex: 1,
    fontSize: FONT_SIZES.xs,
  },
  infoBox: {
    padding: SPACING.lg,
    backgroundColor: COLORS.accent,
    borderRadius: BORDER_RADIUS.md,
  },
  infoText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  swapInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  swapInput: {
    flex: 1,
  },
  swapArrow: {
    alignItems: 'center',
    marginVertical: SPACING.sm,
  },
  rateBox: {
    padding: SPACING.lg,
    backgroundColor: COLORS.accent,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  refreshButton: {
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.accent,
  },
  rateText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
});
