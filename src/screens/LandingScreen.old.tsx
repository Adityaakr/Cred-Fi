import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../theme/colors';
import { DISPLAY_CONFIG } from '../config/network';

interface LandingScreenProps {
  onLaunchApp: () => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ onLaunchApp }) => {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>F</Text>
          </View>
          <Text style={styles.appName}>FLEX</Text>
        </View>
        <Button size="sm" onPress={onLaunchApp}>
          Launch App
        </Button>
      </View>

      {/* Hero Section */}
      <View style={styles.hero}>
        <Badge variant="gold" style={styles.heroBadge}>
          <Ionicons name="sparkles" size={12} color={COLORS.primary} />
          <Text style={styles.badgeText}> Built on {DISPLAY_CONFIG.networkName}</Text>
        </Badge>

        <Text style={styles.heroTitle}>
          Onchain Credit & Treasury
        </Text>
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientText}
        >
          <Text style={styles.heroGradient}>
            For You and Your AI Agents
          </Text>
        </LinearGradient>

        <Text style={styles.heroSubtitle}>
          Turn your onchain cashflows into a credit line and safe rails for you and your AI tools. All powered by {DISPLAY_CONFIG.networkName}.
        </Text>

        <View style={styles.heroButtons}>
          <Button size="lg" onPress={onLaunchApp} style={styles.primaryButton}>
            Launch App on {DISPLAY_CONFIG.networkName}
            <Ionicons name="arrow-forward" size={20} color={COLORS.text} style={styles.buttonIcon} />
          </Button>
          <Button variant="outline" size="lg">
            View Documentation
          </Button>
        </View>

        {/* Features */}
        <View style={styles.features}>
          <View style={styles.feature}>
            <View style={styles.featureIcon}>
              <Ionicons name="shield-checkmark" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.featureText}>Non-custodial</Text>
          </View>
          <View style={styles.feature}>
            <View style={styles.featureIcon}>
              <Ionicons name="flash" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.featureText}>Instant on {DISPLAY_CONFIG.networkName}</Text>
          </View>
          <View style={styles.feature}>
            <View style={styles.featureIcon}>
              <Ionicons name="time" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.featureText}>Real-time credit</Text>
          </View>
        </View>
      </View>

      {/* Problem/Solution Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>The Problem We Solve</Text>
        <Text style={styles.sectionSubtitle}>The gap between earning onchain and accessing credit</Text>

        <View style={styles.problemSolution}>
          <Card style={[styles.problemCard, styles.beforeCard]}>
            <View style={styles.cardIcon}>
              <Text style={styles.iconEmoji}>❌</Text>
            </View>
            <Text style={styles.cardTitle}>Before FLEX</Text>
            <Text style={styles.cardText}>• No credit despite onchain earnings</Text>
            <Text style={styles.cardText}>• Agents can't spend autonomously</Text>
            <Text style={styles.cardText}>• Complex treasury management</Text>
            <Text style={styles.cardText}>• No yield on idle funds</Text>
          </Card>

          <Card style={[styles.problemCard, styles.afterCard]}>
            <View style={styles.cardIcon}>
              <Text style={styles.iconEmoji}>✅</Text>
            </View>
            <Text style={styles.cardTitle}>With FLEX</Text>
            <Text style={styles.cardText}>• Instant credit from cashflows</Text>
            <Text style={styles.cardText}>• AI agents with spending limits</Text>
            <Text style={styles.cardText}>• Unified treasury dashboard</Text>
            <Text style={styles.cardText}>• Auto-earning on deposits</Text>
          </Card>
        </View>
      </View>

      {/* How It Works */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How It Works</Text>
        
        <View style={styles.steps}>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Connect Your Wallet</Text>
              <Text style={styles.stepText}>
                Link your usdc Chain wallet to access FLEX on BPN
              </Text>
            </View>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Deposit Stablecoins</Text>
              <Text style={styles.stepText}>
                Add USDT or FDUSD to your treasury vault
              </Text>
            </View>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Get Instant Credit</Text>
              <Text style={styles.stepText}>
                Unlock credit line based on your cashflow history
              </Text>
            </View>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>4</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Deploy AI Agents</Text>
              <Text style={styles.stepText}>
                Create agents with spending limits and API access
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Features Grid */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Everything You Need</Text>
        
        <View style={styles.featuresGrid}>
          <Card style={styles.featureCard}>
            <Ionicons name="wallet" size={32} color={COLORS.primary} />
            <Text style={styles.featureCardTitle}>Treasury</Text>
            <Text style={styles.featureCardText}>
              Unified dashboard for all your onchain assets
            </Text>
          </Card>

          <Card style={styles.featureCard}>
            <Ionicons name="card" size={32} color={COLORS.primary} />
            <Text style={styles.featureCardTitle}>Credit Line</Text>
            <Text style={styles.featureCardText}>
              Borrow against your cashflow instantly
            </Text>
          </Card>

          <Card style={styles.featureCard}>
            <Ionicons name="hardware-chip" size={32} color={COLORS.primary} />
            <Text style={styles.featureCardTitle}>AI Agents</Text>
            <Text style={styles.featureCardText}>
              Autonomous spending with safety limits
            </Text>
          </Card>

          <Card style={styles.featureCard}>
            <Ionicons name="trending-up" size={32} color={COLORS.primary} />
            <Text style={styles.featureCardTitle}>Earn Yield</Text>
            <Text style={styles.featureCardText}>
              Auto-earn on idle stablecoins
            </Text>
          </Card>
        </View>
      </View>

      {/* CTA Section */}
      <LinearGradient
        colors={[`${COLORS.primary}10`, `${COLORS.primary}05`]}
        style={styles.cta}
      >
        <Text style={styles.ctaTitle}>Ready to Get Started?</Text>
        <Text style={styles.ctaText}>
          Join the future of onchain finance on usdc Chain
        </Text>
        <Button size="lg" onPress={onLaunchApp} style={styles.ctaButton}>
          Launch App Now
          <Ionicons name="arrow-forward" size={20} color={COLORS.text} style={styles.buttonIcon} />
        </Button>
      </LinearGradient>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerLogo}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>F</Text>
          </View>
          <Text style={styles.footerAppName}>FLEX</Text>
        </View>
        <Text style={styles.footerText}>
          Built on usdc Chain • Powered by BPN
        </Text>
        <Text style={styles.footerCopyright}>
          © 2024 FLEX. All rights reserved.
        </Text>
      </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  appName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  hero: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xxxl * 2,
    alignItems: 'center',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  badgeText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    fontWeight: '600',
  },
  heroTitle: {
    fontSize: FONT_SIZES.xxxl + 8,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  gradientText: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.xs,
    marginBottom: SPACING.xl,
  },
  heroGradient: {
    fontSize: FONT_SIZES.xxxl + 8,
    fontWeight: 'bold',
    color: COLORS.textLight,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: SPACING.xxl,
  },
  heroButtons: {
    width: '100%',
    gap: SPACING.md,
    marginBottom: SPACING.xxxl,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonIcon: {
    marginLeft: SPACING.sm,
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    gap: SPACING.lg,
  },
  feature: {
    alignItems: 'center',
    gap: SPACING.sm,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  section: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xxxl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  sectionSubtitle: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xxl,
  },
  problemSolution: {
    gap: SPACING.lg,
  },
  problemCard: {
    padding: SPACING.xl,
  },
  beforeCard: {
    borderColor: `${COLORS.error}30`,
    backgroundColor: `${COLORS.error}05`,
  },
  afterCard: {
    borderColor: `${COLORS.success}30`,
    backgroundColor: `${COLORS.success}05`,
  },
  cardIcon: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  iconEmoji: {
    fontSize: 32,
  },
  cardTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  cardText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  steps: {
    gap: SPACING.xl,
  },
  step: {
    flexDirection: 'row',
    gap: SPACING.lg,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  stepText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  featuresGrid: {
    gap: SPACING.lg,
  },
  featureCard: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  featureCardTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  featureCardText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  cta: {
    marginHorizontal: SPACING.xl,
    marginVertical: SPACING.xxxl,
    padding: SPACING.xxxl,
    borderRadius: BORDER_RADIUS.xl,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  ctaText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xxl,
    textAlign: 'center',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footer: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xxxl,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  footerAppName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  footerText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  footerCopyright: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
});
