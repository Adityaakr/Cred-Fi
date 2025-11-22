import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Sheet } from '../components/Sheet';
import { Input } from '../components/Input';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../theme/colors';
import { creditService } from '../services/creditService';
import { creditStateService } from '../services/creditStateService';
import { IncomeVerification } from '../components/IncomeVerification';
import { TestIncomeVerification } from '../components/TestIncomeVerification';
import { VlayerIncomeVerification } from '../components/VlayerIncomeVerification';
import { VouchClientVerification } from '../components/VouchClientVerification';
import { HybridVerification } from '../components/HybridVerification';
import { ethers } from 'ethers';
import { FlexCreditCoreABI, CONTRACTS } from '../contracts/abis';

interface CreditScreenProps {
  walletAddress?: string;
  sendTransaction?: any;
}

export const CreditScreen = ({ walletAddress, sendTransaction }: CreditScreenProps) => {
  const [showBorrow, setShowBorrow] = useState(false);
  const [showRepay, setShowRepay] = useState(false);
  const [borrowAmount, setBorrowAmount] = useState(100);
  const [repayAmount, setRepayAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  const [credit, setCredit] = useState({
    limit: 500,
    used: 50,
    available: 450,
    apr: 12.5,
    riskBand: 'Medium' as 'Low' | 'Medium' | 'High',
    score: 50,
  });

  const [activities, setActivities] = useState<any[]>([]);

  const utilization = (credit.used / credit.limit) * 100;

  // Load credit data
  useEffect(() => {
    if (walletAddress) {
      loadCreditData();
    }
  }, [walletAddress]);

  const loadCreditData = async () => {
    if (!walletAddress) return;
    
    setLoading(true);
    try {
      // Try to fetch from deployed contracts first
      try {
        if (typeof window !== 'undefined' && window.ethereum) {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const creditCore = new ethers.Contract(
            CONTRACTS.FlexCreditCore,
            FlexCreditCoreABI,
            provider
          );

          const { income, limit, used, available } = await creditCore.getCreditInfo(walletAddress);
          
          // Convert from wei (6 decimals for USDC)
          const limitNum = Number(ethers.formatUnits(limit, 6));
          const usedNum = Number(ethers.formatUnits(used, 6));
          const availableNum = Number(ethers.formatUnits(available, 6));
          
          console.log('📊 Credit data from contract:', { limitNum, usedNum, availableNum });
          
          setCredit({
            limit: limitNum,
            used: usedNum,
            available: availableNum,
            apr: 18.5, // Fixed APR for now
            riskBand: limitNum > 0 ? 'Low' : 'High',
            score: limitNum > 0 ? 75 : 0,
          });
          
          // Get local transaction history
          const history = creditStateService.getTransactionHistory(walletAddress);
          setActivities(history);
          
          setLoading(false);
          return;
        }
      } catch (contractError) {
        console.log('⚠️ Could not fetch from contract, using fallback:', contractError);
      }
      
      // Fallback to local credit service
      const creditScore = await creditService.calculateCreditScore(walletAddress);
      
      // Update credit limit in state service
      creditStateService.updateCreditLimit(walletAddress, creditScore.limit, creditScore.apr);
      
      // Get current credit state
      const creditSummary = creditStateService.getCreditSummary(walletAddress);
      const history = creditStateService.getTransactionHistory(walletAddress);
      
      setCredit({
        limit: creditSummary.creditLimit,
        used: creditSummary.used,
        available: creditSummary.available,
        apr: creditSummary.apr,
        riskBand: creditScore.riskBand,
        score: creditScore.score,
      });
      
      // Show credit state history
      setActivities(history);
    } catch (error) {
      console.error('Error loading credit data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBorrow = async () => {
    if (!walletAddress || !sendTransaction) {
      Alert.alert('Error', 'Wallet not connected');
      return;
    }

    if (borrowAmount > credit.available) {
      Alert.alert('Error', 'Amount exceeds available credit');
      return;
    }

    setProcessing(true);
    try {
      const txHash = await creditService.borrow(walletAddress, borrowAmount, sendTransaction);
      
      // Record borrow in credit state
      creditStateService.recordBorrow(walletAddress, borrowAmount, txHash, credit.apr);
      
      Alert.alert('Success!', `Borrowed $${borrowAmount} USDT\nTx: ${txHash.slice(0, 10)}...`);
      setShowBorrow(false);
      
      // Reload data immediately to show updated state
      loadCreditData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to borrow');
    } finally {
      setProcessing(false);
    }
  };

  const handleRepay = async () => {
    if (!walletAddress || !sendTransaction) {
      Alert.alert('Error', 'Wallet not connected');
      return;
    }

    const amount = parseFloat(repayAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Invalid amount');
      return;
    }

    if (amount > credit.used) {
      Alert.alert('Error', 'Amount exceeds debt');
      return;
    }

    setProcessing(true);
    try {
      const txHash = await creditService.repay(walletAddress, amount, sendTransaction);
      
      // Record repayment in credit state
      creditStateService.recordRepayment(walletAddress, amount, txHash);
      
      Alert.alert('Success!', `Repaid $${amount} USDT\nTx: ${txHash.slice(0, 10)}...`);
      setShowRepay(false);
      setRepayAmount('');
      
      // Reload data immediately to show updated state
      loadCreditData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to repay');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ color: COLORS.text, marginTop: SPACING.md }}>
          Analyzing your on-chain cashflow...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Info Card - How It Works */}

      {/* Credit Snapshot */}
      <Card style={styles.creditCard}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', backgroundColor: `${COLORS.accent}`, padding: SPACING.md, borderRadius: BORDER_RADIUS.md, marginBottom: SPACING.md }}>
          <Ionicons name="information-circle" size={24} color={COLORS.primary} style={{ marginRight: SPACING.sm }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>Auto-Repay Cashflow Credit</Text>
          </View>
        </View>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardTitle}>Your Credit Line</Text>
            <Text style={styles.cardDescription}>Cashflow-based revolving credit</Text>
          </View>
          <Badge variant="default">
            {credit.riskBand} Risk
          </Badge>
        </View>

        <View style={styles.creditDetails}>
          <View style={styles.creditRow}>
            <View>
              <Text style={styles.label}>Credit Limit</Text>
              <Text style={styles.limitAmount}>
                {credit.limit} <Text style={styles.currency}>USDT</Text>
              </Text>
            </View>
            <View style={styles.aprBox}>
              <Text style={styles.label}>APR</Text>
              <Text style={styles.aprValue}>{credit.apr}%</Text>
            </View>
          </View>

          <View style={styles.utilizationSection}>
            <View style={styles.utilizationHeader}>
              <Text style={styles.utilizationLabel}>
                Used: {credit.used} USDT
              </Text>
              <Text style={styles.utilizationPercent}>
                {utilization.toFixed(1)}% utilized
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${utilization}%` }]} />
            </View>
            <Text style={styles.availableText}>
              Available: <Text style={styles.availableAmount}>{credit.available} USDT</Text>
            </Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <Button
            style={styles.actionButton}
            onPress={() => setShowBorrow(true)}
          >
            <Ionicons name="arrow-up-outline" size={20} color={COLORS.text} />
            <Text style={styles.buttonText}> Borrow</Text>
          </Button>
          <Button
            variant="outline"
            style={styles.actionButton}
            onPress={() => setShowRepay(true)}
          >
            <Ionicons name="arrow-down-outline" size={20} color={COLORS.text} />
            <Text style={styles.buttonTextOutline}> Repay</Text>
          </Button>
        </View>
      </Card>

      {/* Hybrid Verification: Client-Side (Vouch) + Server-Side (vlayer) */}
      {walletAddress && (
        <HybridVerification
          walletAddress={walletAddress}
          onVerificationComplete={() => {
            loadCreditData();
          }}
        />
      )}

      {/* Vouch Client-Side Verification (Real Binance/Wise Integration) */}
      {walletAddress && (
        <VouchClientVerification
          walletAddress={walletAddress}
          onVerificationComplete={() => {
            // Refresh credit data after verification
            loadCreditData();
          }}
        />
      )}

      {/* Test Income Verification (Fallback if Vouch SDK not installed) */}
      {/* {walletAddress && (
        <TestIncomeVerification
          walletAddress={walletAddress}
          onVerificationComplete={() => {
            loadCreditData();
          }}
        />
      )} */}

      {/* vlayer Server-Side Verification (Web Prover Server) */}
      {/* {walletAddress && (
        <VlayerIncomeVerification
          walletAddress={walletAddress}
          onVerificationComplete={() => {
            loadCreditData();
          }}
        />
      )} */}

      {/* Full Vouch Income Verification (Uncomment when Vouch is setup) */}
      {/* {walletAddress && (
        <IncomeVerification
          walletAddress={walletAddress}
          onVerificationComplete={() => {
            loadCreditData();
          }}
        />
      )} */}

            <Card style={styles.creditCard}>
        
        <View style={styles.infoDetails}>
          <Text style={styles.infoDetailText}>
            • Credit limits sized by verified on-chain cashflows{'\n'}
            • Capital from decentralized Credit Pools{'\n'}
            • Credit history is an open, queryable graph{'\n'}
            • Limit = α · median(inflow₆₀₋₉₀ₐ) − β · volatility
          </Text>
        </View>
      </Card>

      {/* How Credit Works */}
      <Card style={styles.infoCard}>
        <View style={styles.infoHeader}>
          <Ionicons name="information-circle" size={24} color={COLORS.primary} />
          <Text style={styles.infoTitle}>How Your Credit Line Works</Text>
        </View>
        <Text style={styles.infoText}>
          • Your credit limit is based on your onchain cashflow history
        </Text>
        <Text style={styles.infoText}>
          • Borrow anytime, repay flexibly with low APR
        </Text>
        <Text style={styles.infoText}>
          • Credit limit adjusts automatically as your cashflow grows
        </Text>
        <Text style={styles.infoText}>
          • No hidden fees, transparent terms on usdc Chain
        </Text>
      </Card>

      {/* Activity History */}
      <Card style={styles.historyCard}>
        <Text style={styles.historyTitle}>Credit History</Text>
        <Text style={styles.historySubtitle}>Last 30 days</Text>

        {activities.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyStateText}>No transactions yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Your borrow and repay transactions will appear here
            </Text>
          </View>
        ) : (
          <View style={styles.activityList}>
            {activities.map((activity, i) => (
            <View key={i} style={styles.activityItem}>
              <View style={[
                styles.activityIcon,
                {
                  backgroundColor:
                    activity.type === 'borrow'
                      ? COLORS.outflowBg
                      : activity.type === 'repay'
                      ? COLORS.inflowBg
                      : `${COLORS.primary}10`,
                },
              ]}>
                <Ionicons
                  name={
                    activity.type === 'borrow'
                      ? 'arrow-up'
                      : activity.type === 'repay'
                      ? 'arrow-down'
                      : 'trending-up'
                  }
                  size={20}
                  color={
                    activity.type === 'borrow'
                      ? COLORS.outflow
                      : activity.type === 'repay'
                      ? COLORS.inflow
                      : COLORS.primary
                  }
                />
              </View>
              <View style={styles.activityDetails}>
                <Text style={styles.activityType}>
                  {activity.type === 'borrow'
                    ? 'Borrowed'
                    : activity.type === 'repay'
                    ? 'Repaid'
                    : 'Limit Increased'}
                </Text>
                <Text style={styles.activityDate}>{activity.date}</Text>
              </View>
              <View style={styles.activityRight}>
                <Text
                  style={[
                    styles.activityAmount,
                    {
                      color:
                        activity.type === 'borrow'
                          ? COLORS.outflow
                          : activity.type === 'repay'
                          ? COLORS.inflow
                          : COLORS.primary,
                    },
                  ]}
                >
                  {activity.type === 'borrow' ? '-' : '+'}
                  {activity.amount} USDT
                </Text>
                <Text style={styles.activityHash}>{activity.hash}</Text>
              </View>
            </View>
            ))}
          </View>
        )}
      </Card>

      {/* Borrow Sheet */}
      <Sheet
        visible={showBorrow}
        onClose={() => setShowBorrow(false)}
        title="Borrow from Credit Line"
        description="Draw from your revolving credit on BPN"
      >
        <View style={styles.sheetContent}>
          <View style={styles.sliderSection}>
            <View style={styles.sliderHeader}>
              <Text style={styles.label}>Amount to Borrow</Text>
              <Text style={styles.maxLabel}>Max: {credit.available} USDT</Text>
            </View>
            <Text style={styles.sliderAmount}>{borrowAmount} USDT</Text>
            <Slider
              style={styles.slider}
              minimumValue={10}
              maximumValue={credit.available}
              value={borrowAmount}
              onValueChange={setBorrowAmount}
              minimumTrackTintColor={COLORS.primary}
              maximumTrackTintColor={COLORS.border}
              thumbTintColor={COLORS.primary}
              step={10}
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>10 USDT</Text>
              <Text style={styles.sliderLabel}>{credit.available} USDT</Text>
            </View>
          </View>

          <View style={styles.detailsBox}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Amount</Text>
              <Text style={styles.detailValue}>{borrowAmount} USDT</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>APR</Text>
              <Text style={styles.detailValue}>{credit.apr}%</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Network Fee</Text>
              <Text style={styles.detailValue}>~$0.05</Text>
            </View>
          </View>

          <Button 
            size="lg" 
            style={styles.sheetButton}
            onPress={handleBorrow}
            disabled={processing}
          >
            {processing ? 'Processing...' : 'Confirm Borrow'}
          </Button>
        </View>
      </Sheet>

      {/* Repay Sheet */}
      <Sheet
        visible={showRepay}
        onClose={() => setShowRepay(false)}
        title="Repay Credit Line"
        description="Pay back your borrowed amount"
      >
        <View style={styles.sheetContent}>
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Amount to Repay</Text>
              <Text style={styles.maxLabel}>Owed: {credit.used} USDT</Text>
            </View>
            <Input
              placeholder="0.00"
              keyboardType="numeric"
              value={repayAmount}
              onChangeText={setRepayAmount}
              large
            />
          </View>

          <View style={styles.quickAmounts}>
            <Button
              variant="outline"
              size="sm"
              onPress={() => setRepayAmount((credit.used * 0.25).toString())}
            >
              25%
            </Button>
            <Button
              variant="outline"
              size="sm"
              onPress={() => setRepayAmount((credit.used * 0.5).toString())}
            >
              50%
            </Button>
            <Button
              variant="outline"
              size="sm"
              onPress={() => setRepayAmount((credit.used * 0.75).toString())}
            >
              75%
            </Button>
            <Button
              variant="outline"
              size="sm"
              onPress={() => setRepayAmount(credit.used.toString())}
            >
              100%
            </Button>
          </View>

          <View style={styles.detailsBox}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Repay Amount</Text>
              <Text style={styles.detailValue}>{repayAmount || '0'} USDT</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Remaining Debt</Text>
              <Text style={styles.detailValue}>
                {Math.max(0, credit.used - parseFloat(repayAmount || '0'))} USDT
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Network Fee</Text>
              <Text style={styles.detailValue}>~$0.03</Text>
            </View>
          </View>

          <Button 
            size="lg" 
            style={styles.sheetButton}
            onPress={handleRepay}
            disabled={processing}
          >
            {processing ? 'Processing...' : 'Confirm Repayment'}
          </Button>
        </View>
      </Sheet>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
  },
  creditCard: {
    margin: SPACING.lg,
    borderColor: `${COLORS.primary}50`,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xl,
  },
  cardTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  cardDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  creditDetails: {
    gap: SPACING.xl,
  },
  creditRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  label: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  limitAmount: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  currency: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
  },
  aprBox: {
    alignItems: 'flex-end',
  },
  aprValue: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  utilizationSection: {
    gap: SPACING.sm,
  },
  utilizationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  utilizationLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  utilizationPercent: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  availableText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  availableAmount: {
    fontWeight: '600',
    color: COLORS.text,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  buttonTextOutline: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  infoCard: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    backgroundColor: `${COLORS.primary}05`,
    borderColor: `${COLORS.primary}20`,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  infoTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  infoText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    lineHeight: 20,
  },
  historyCard: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.xxl,
  },
  historyTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  historySubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  activityList: {
    gap: SPACING.sm,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.backgroundDark,
    borderRadius: BORDER_RADIUS.md,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  activityDetails: {
    flex: 1,
  },
  activityType: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  activityDate: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  activityRight: {
    alignItems: 'flex-end',
  },
  activityAmount: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  activityHash: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  sheetContent: {
    paddingBottom: SPACING.xxl,
  },
  sliderSection: {
    marginBottom: SPACING.xl,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  maxLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
  },
  sliderAmount: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  detailsBox: {
    backgroundColor: COLORS.accent,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  detailValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  sheetButton: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  scoreLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  scoreDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  infoDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  infoDetails: {
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: SPACING.sm,
  },
  infoDetailText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    lineHeight: 18,
    fontFamily: 'monospace',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
  },
  emptyStateText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  emptyStateSubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
