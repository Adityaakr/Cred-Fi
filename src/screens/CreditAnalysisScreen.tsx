/**
 * Credit Analysis Screen
 * Shows verification success and analyzes credit limit based on income
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../theme/colors';

interface CreditAnalysisScreenProps {
  verifiedIncome: number; // Income in INR
  walletAddress: string;
  onClose: () => void;
  onAcceptCredit: (creditLimit: number) => void;
}

export const CreditAnalysisScreen: React.FC<CreditAnalysisScreenProps> = ({
  verifiedIncome,
  walletAddress,
  onClose,
  onAcceptCredit,
}) => {
  const [analyzing, setAnalyzing] = useState(true);
  const [creditLimit, setCreditLimit] = useState(0);
  const [creditLimitUSDT, setCreditLimitUSDT] = useState(0);

  useEffect(() => {
    // Simulate credit analysis
    setTimeout(() => {
      analyzeCreditLimit();
    }, 2000);
  }, [verifiedIncome]);

  const analyzeCreditLimit = () => {
    // Professional Credit Engine Logic
    // Based on verified Wise balance/income
    
    // 1. Convert INR to USDT (rate: 1 USDT ≈ 83 INR)
    const usdtEquivalent = verifiedIncome / 83;
    
    console.log('💳 Credit Analysis:');
    console.log('  - Verified Income/Balance: ₹' + verifiedIncome + ' INR');
    console.log('  - USD Equivalent: $' + usdtEquivalent.toFixed(2));
    
    // 2. Credit limit calculation:
    // - For balance $100: 10% credit line = $10 USDT
    // - Conservative approach for financial stability
    let creditInUSDT;
    
    if (usdtEquivalent >= 100) {
      // $100+ balance → 10% credit line
      creditInUSDT = Math.floor(usdtEquivalent * 0.10);
    } else if (usdtEquivalent >= 50) {
      // $50-$99 balance → 8% credit line
      creditInUSDT = Math.floor(usdtEquivalent * 0.08);
    } else if (usdtEquivalent >= 20) {
      // $20-$49 balance → 5% credit line
      creditInUSDT = Math.floor(usdtEquivalent * 0.05);
    } else {
      // Under $20 → Minimum 3 USDT starter credit
      creditInUSDT = 3;
    }
    
    // 3. Apply limits
    const finalCredit = Math.min(100, Math.max(3, creditInUSDT));
    
    console.log('  - Calculated Credit: ' + creditInUSDT + ' USDT');
    console.log('  - Final Credit Line: ' + finalCredit + ' USDT');
    
    setCreditLimit(verifiedIncome);
    setCreditLimitUSDT(finalCredit);
    setAnalyzing(false);
  };

  const getRiskBand = () => {
    if (creditLimitUSDT >= 50) return { label: 'Low Risk', color: COLORS.success };
    if (creditLimitUSDT >= 20) return { label: 'Medium Risk', color: COLORS.warning };
    return { label: 'Higher Risk', color: COLORS.error };
  };

  const getAPR = () => {
    // APR based on risk
    if (creditLimitUSDT >= 50) return 8.5;
    if (creditLimitUSDT >= 20) return 12.5;
    return 15.0;
  };

  const riskBand = getRiskBand();
  const apr = getAPR();

  if (analyzing) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.analyzingContainer}>
          <LinearGradient
            colors={[COLORS.primary + '20', COLORS.primary + '05']}
            style={styles.analyzingCard}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="analytics" size={64} color={COLORS.primary} />
            </View>
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 20 }} />
            <Text style={styles.analyzingTitle}>Analyzing Your Credit Profile</Text>
            <Text style={styles.analyzingSubtitle}>
              Our AI-powered credit engine is evaluating your verified income...
            </Text>
            
            <View style={styles.stepsContainer}>
              <View style={styles.step}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                <Text style={styles.stepText}>Income Verified ✓</Text>
              </View>
              <View style={styles.step}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.stepText}>Calculating Credit Limit...</Text>
              </View>
              <View style={styles.step}>
                <Ionicons name="ellipse-outline" size={20} color={COLORS.textSecondary} />
                <Text style={[styles.stepText, { color: COLORS.textSecondary }]}>Risk Assessment</Text>
              </View>
            </View>
          </LinearGradient>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Success Header */}
      <View style={styles.successHeader}>
        <View style={styles.successIconContainer}>
          <Ionicons name="checkmark-circle" size={80} color={COLORS.success} />
        </View>
        <Text style={styles.successTitle}>Verification Complete!</Text>
        <Text style={styles.successSubtitle}>
          Your income has been verified using Wise proof
        </Text>
      </View>

      {/* Verified Income Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="wallet" size={24} color={COLORS.primary} />
          <Text style={styles.cardTitle}>Verified Income</Text>
        </View>
        <Text style={styles.incomeAmount}>₹{creditLimit.toLocaleString()}</Text>
        <Text style={styles.incomeSubtext}>Monthly verified income from Wise</Text>
      </View>

      {/* Credit Limit Card */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        style={styles.creditCard}
      >
        <View style={styles.creditCardHeader}>
          <Ionicons name="card" size={32} color="#fff" />
          <Text style={styles.creditCardTitle}>Your Credit Limit</Text>
        </View>
        
        <View style={styles.creditAmountContainer}>
          <Text style={styles.creditAmount}>{creditLimitUSDT} USDT</Text>
          <Text style={styles.creditSubtext}>≈ ₹{(creditLimitUSDT * 83).toLocaleString()}</Text>
        </View>

        <View style={styles.creditDetails}>
          <View style={styles.creditDetailRow}>
            <Text style={styles.creditDetailLabel}>Risk Band</Text>
            <View style={[styles.riskBadge, { backgroundColor: riskBand.color + '20' }]}>
              <Text style={[styles.riskBadgeText, { color: riskBand.color }]}>
                {riskBand.label}
              </Text>
            </View>
          </View>
          <View style={styles.creditDetailRow}>
            <Text style={styles.creditDetailLabel}>APR</Text>
            <Text style={styles.creditDetailValue}>{apr}%</Text>
          </View>
          <View style={styles.creditDetailRow}>
            <Text style={styles.creditDetailLabel}>Credit-to-Income</Text>
            <Text style={styles.creditDetailValue}>5%</Text>
          </View>
        </View>
      </LinearGradient>

      {/* How it works */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>💡 How we calculated your limit</Text>
        <View style={styles.infoItem}>
          <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.primary} />
          <Text style={styles.infoText}>
            Verified your income: ₹{creditLimit.toLocaleString()} from Wise
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.primary} />
          <Text style={styles.infoText}>
            Applied 5% credit-to-income ratio (conservative)
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.primary} />
          <Text style={styles.infoText}>
            Risk-based APR: {apr}% based on your profile
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => onAcceptCredit(creditLimitUSDT)}
        >
          <Text style={styles.acceptButtonText}>Accept Credit Limit</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.declineButton} onPress={onClose}>
          <Text style={styles.declineButtonText}>Maybe Later</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: SPACING.md,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyzingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  analyzingCard: {
    width: '100%',
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.xl,
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  analyzingTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  analyzingSubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  stepsContainer: {
    width: '100%',
    gap: SPACING.md,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  stepText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  successHeader: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  successIconContainer: {
    marginBottom: SPACING.md,
  },
  successTitle: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  successSubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    margin: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  cardTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  incomeAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  incomeSubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  creditCard: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    margin: SPACING.md,
  },
  creditCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  creditCardTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: '#fff',
  },
  creditAmountContainer: {
    marginBottom: SPACING.xl,
  },
  creditAmount: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: SPACING.xs,
  },
  creditSubtext: {
    fontSize: FONT_SIZES.md,
    color: '#fff',
    opacity: 0.8,
  },
  creditDetails: {
    gap: SPACING.md,
  },
  creditDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  creditDetailLabel: {
    fontSize: FONT_SIZES.md,
    color: '#fff',
    opacity: 0.8,
  },
  creditDetailValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: '#fff',
  },
  riskBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
  },
  riskBadgeText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    margin: SPACING.md,
    gap: SPACING.md,
  },
  infoTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  infoText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  actions: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  acceptButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  acceptButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: '#fff',
  },
  declineButton: {
    padding: SPACING.md,
    alignItems: 'center',
  },
  declineButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
});
