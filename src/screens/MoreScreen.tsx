import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Clipboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Sheet } from '../components/Sheet';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../theme/colors';
import { creditService } from '../services/creditService';

interface MoreScreenProps {
  walletAddress?: string;
}

export const MoreScreen = ({ walletAddress }: MoreScreenProps) => {
  const [showCreditHistory, setShowCreditHistory] = useState(false);
  const [creditData, setCreditData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (walletAddress && showCreditHistory) {
      loadCreditData();
    }
  }, [walletAddress, showCreditHistory]);

  const loadCreditData = async () => {
    if (!walletAddress) return;
    setLoading(true);
    try {
      const data = await creditService.getCreditData(walletAddress);
      setCreditData(data);
    } catch (error) {
      console.error('Error loading credit data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAddress = () => {
    if (walletAddress) {
      Clipboard.setString(walletAddress);
    }
  };

  const menuItems = [
    { 
      icon: 'time-outline', 
      label: 'My Credit History', 
      description: 'View your complete credit timeline',
      color: COLORS.primary,
      onPress: () => setShowCreditHistory(true)
    },
    { 
      icon: 'document-text-outline', 
      label: 'Employer Payouts', 
      description: 'Send batch payouts on BPN',
      color: COLORS.primary,
      onPress: () => {}
    },
    { 
      icon: 'settings-outline', 
      label: 'Settings', 
      description: 'Preferences and configuration',
      color: COLORS.primary,
      onPress: () => {}
    },
    { 
      icon: 'help-circle-outline', 
      label: 'Help & Docs', 
      description: 'Support and documentation',
      color: COLORS.primary,
      onPress: () => {}
    },
  ];

  const creditTimeline = [
    { 
      type: 'borrow', 
      amount: 10, 
      date: 'few minutes ago',
      description: 'Credit line utilization: 10%',
      color: COLORS.warning
    },
    { 
      type: 'repayment', 
      amount: 10, 
      date: '2 days ago',
      description: 'On-time repayment. Credit score improved.',
      color: COLORS.success
    },
    { 
      type: 'borrow', 
      amount: 10, 
      date: '4 days ago',
      description: 'Credit line utilization: 2%',
      color: COLORS.warning
    },
    { 
      type: 'limit_increase', 
      amount: 100, 
      date: '7 days ago',
      description: '400 USDT → 500 USDT based on income growth',
      color: COLORS.primary
    },
    { 
      type: 'repayment', 
      amount: 50, 
      date: '14 days ago',
      description: 'Full balance cleared early. Excellent standing.',
      color: COLORS.success
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Card */}
      <Card style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={32} color={COLORS.primary} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>aditya.usdc</Text>
            <Text style={styles.profileAddress}>
              {walletAddress ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}` : '0x742d...f3a8'}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.copyButton} onPress={handleCopyAddress}>
          <Ionicons name="copy-outline" size={16} color={COLORS.primary} />
          <Text style={styles.copyText}> Copy Address</Text>
        </TouchableOpacity>
      </Card>

      {/* Page Header */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>More</Text>
        <Text style={styles.pageSubtitle}>Settings and additional features</Text>
      </View>

      {/* Menu Items */}
      <View style={styles.menuSection}>
        {menuItems.map((item, i) => (
          <TouchableOpacity key={i} style={styles.menuItem} onPress={item.onPress}>
            <View style={styles.menuIconContainer}>
              <Ionicons name={item.icon as any} size={24} color={item.color} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuDescription}>{item.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        ))}
      </View>

      {/* About */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <TouchableOpacity style={styles.aboutItem}>
          <Text style={styles.aboutLabel}>Version</Text>
          <Text style={styles.aboutValue}>1.0.0</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.aboutItem}>
          <Text style={styles.aboutLabel}>Terms of Service</Text>
          <Ionicons name="open-outline" size={16} color={COLORS.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.aboutItem}>
          <Text style={styles.aboutLabel}>Privacy Policy</Text>
          <Ionicons name="open-outline" size={16} color={COLORS.textMuted} />
        </TouchableOpacity>
      </Card>

      {/* Disconnect Button */}
      <Button
        variant="outline"
        style={styles.disconnectButton}
      >
        <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
        <Text style={styles.disconnectText}> Disconnect Wallet</Text>
      </Button>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Built on usdc Chain • Powered by BPN</Text>
        <Text style={styles.footerCopyright}>© 2024 FLEX</Text>
      </View>

      {/* Credit History Sheet */}
      <Sheet
        visible={showCreditHistory}
        onClose={() => setShowCreditHistory(false)}
        title="Credit History"
        description="Your complete timeline"
      >
        <View style={styles.sheetContent}>
          {/* Repayment Score */}
          <View style={[
            styles.scoreCard,
            {
              backgroundColor: creditData ? (
                creditData.score >= 80 ? `${COLORS.success}10` :
                creditData.score >= 60 ? `${COLORS.success}10` :
                creditData.score >= 40 ? `${COLORS.warning}10` : `${COLORS.error}10`
              ) : `${COLORS.success}10`,
              borderColor: creditData ? (
                creditData.score >= 80 ? `${COLORS.success}20` :
                creditData.score >= 60 ? `${COLORS.success}20` :
                creditData.score >= 40 ? `${COLORS.warning}20` : `${COLORS.error}20`
              ) : `${COLORS.success}20`
            }
          ]}>
            <View style={styles.scoreHeader}>
              <Text style={styles.scoreLabel}>Repayment Score</Text>
              <Ionicons 
                name={creditData && creditData.score < 40 ? "close-circle" : "checkmark-circle"} 
                size={24} 
                color={creditData ? (
                  creditData.score >= 80 ? COLORS.success :
                  creditData.score >= 60 ? COLORS.success :
                  creditData.score >= 40 ? COLORS.warning : COLORS.error
                ) : COLORS.success}
              />
            </View>
            <Text style={[
              styles.scoreValue,
              {
                color: loading ? COLORS.textSecondary : creditData ? (
                  creditData.score >= 80 ? COLORS.success :
                  creditData.score >= 60 ? COLORS.success :
                  creditData.score >= 40 ? COLORS.warning : COLORS.error
                ) : COLORS.success
              }
            ]}>
              {loading ? 'Loading...' : creditData ? (
                creditData.score >= 80 ? 'Excellent' :
                creditData.score >= 60 ? 'Good' :
                creditData.score >= 40 ? 'Fair' : 'Poor'
              ) : 'Excellent'}
            </Text>
            <Text style={styles.scoreDescription}>
              Based on your onchain payment history and credit usage over BPN/usdc
            </Text>
            {creditData && (
              <View style={styles.scoreStats}>
                <View style={styles.scoreStat}>
                  <Text style={styles.scoreStatLabel}>Score</Text>
                  <Text style={styles.scoreStatValue}>{creditData.score}/100</Text>
                </View>
                <View style={styles.scoreStat}>
                  <Text style={styles.scoreStatLabel}>Credit Limit</Text>
                  <Text style={styles.scoreStatValue}>${creditData.limit}</Text>
                </View>
                <View style={styles.scoreStat}>
                  <Text style={styles.scoreStatLabel}>Borrowed</Text>
                  <Text style={styles.scoreStatValue}>${creditData.borrowed}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Timeline */}
          <Text style={styles.timelineTitle}>Timeline</Text>
          <View style={styles.timeline}>
            {creditTimeline.map((item, i) => (
              <View key={i} style={styles.timelineItem}>
                <View style={[styles.timelineDot, { backgroundColor: item.color }]} />
                <View style={styles.timelineContent}>
                  <View style={styles.timelineHeader}>
                    <Badge 
                      variant={
                        item.type === 'repayment' ? 'success' :
                        item.type === 'borrow' ? 'warning' : 'default'
                      }
                    >
                      {item.type === 'repayment' ? 'Repayment' :
                       item.type === 'borrow' ? 'Borrow' : 'Limit Increase'}
                    </Badge>
                    <Text style={styles.timelineDate}>{item.date}</Text>
                  </View>
                  <Text style={styles.timelineAmount}>
                    {item.type === 'limit_increase' ? 'Credit limit increased' :
                     `${item.type === 'repayment' ? 'Repaid' : 'Borrowed'} ${item.amount}.00 USDT`}
                  </Text>
                  <Text style={styles.timelineDescription}>{item.description}</Text>
                </View>
              </View>
            ))}
          </View>
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
  profileCard: {
    margin: SPACING.lg,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: `${COLORS.primary}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  profileAddress: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    backgroundColor: `${COLORS.primary}10`,
    borderRadius: BORDER_RADIUS.md,
  },
  copyText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.primary,
  },
  section: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  historyGrid: {
    gap: SPACING.md,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
  },
  historyLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  historyValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  settingsList: {
    gap: 4,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  settingLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  settingValue: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  aboutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  aboutLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  aboutValue: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  disconnectButton: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    borderColor: COLORS.error,
  },
  disconnectText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.error,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  footerText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  footerCopyright: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  pageHeader: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  pageTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  pageSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  menuSection: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  menuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: `${COLORS.primary}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  menuContent: {
    flex: 1,
  },
  menuLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  menuDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  sheetContent: {
    paddingBottom: SPACING.xxl,
  },
  scoreCard: {
    backgroundColor: `${COLORS.success}10`,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: `${COLORS.success}20`,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  scoreLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  scoreValue: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: 'bold',
    marginBottom: SPACING.sm,
  },
  scoreDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  timelineTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  timeline: {
    gap: SPACING.lg,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  timelineDate: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  timelineAmount: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  timelineDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  scoreStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: `${COLORS.success}20`,
  },
  scoreStat: {
    alignItems: 'center',
  },
  scoreStatLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  scoreStatValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.success,
  },
});
