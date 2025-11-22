import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS, GRADIENTS, ANIMATION } from '../theme/colors';
import { DISPLAY_CONFIG } from '../config/network';

interface LandingScreenProps {
  onLaunchApp: () => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ onLaunchApp }) => {
  // Staggered reveal animations
  const fadeAnim1 = useRef(new Animated.Value(0)).current;
  const fadeAnim2 = useRef(new Animated.Value(0)).current;
  const fadeAnim3 = useRef(new Animated.Value(0)).current;
  const fadeAnim4 = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Orchestrated page load animation
    Animated.stagger(150, [
      Animated.parallel([
        Animated.timing(fadeAnim1, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(fadeAnim2, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim3, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim4, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.wrapper}>
      <AnimatedBackground />
      
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim1 }]}>
          <View style={styles.headerLeft}>
            <View style={styles.logo}>
              <LinearGradient colors={GRADIENTS.primary} style={styles.logoGradient}>
                <Text style={styles.logoText}>C</Text>
              </LinearGradient>
            </View>
            <Text style={styles.appName}>CREDI</Text>
            <View style={styles.versionBadge}>
              <Text style={styles.versionText}>v2.0</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.launchButton} onPress={onLaunchApp}>
            <LinearGradient
              colors={GRADIENTS.primary}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.launchButtonText}>LAUNCH</Text>
              <Ionicons name="arrow-forward" size={16} color={COLORS.textDark} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Hero Section */}
        <Animated.View 
          style={[
            styles.hero,
            {
              opacity: fadeAnim2,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.networkBadge}>
            <View style={styles.badgeDot} />
            <Text style={styles.badgeText}>LIVE ON {DISPLAY_CONFIG.networkName.toUpperCase()}</Text>
          </View>

          <Text style={styles.heroTitle}>
            ONCHAIN{'\n'}
            <Text style={styles.heroTitleAccent}>CREDIT</Text>
            {' & '}
            <Text style={styles.heroTitleAccent}>TREASURY</Text>
          </Text>

          <Text style={styles.heroSubtitle}>
            Autonomous finance for humans and AI agents.{'\n'}
            Built on {DISPLAY_CONFIG.networkName}. Powered by USDC.
          </Text>

          <TouchableOpacity style={styles.heroCTA} onPress={onLaunchApp}>
            <LinearGradient
              colors={GRADIENTS.primary}
              style={styles.ctaGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.ctaText}>START NOW</Text>
              <View style={styles.ctaArrow}>
                <Ionicons name="arrow-forward" size={20} color={COLORS.textDark} />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Stats */}
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>$2.4M</Text>
              <Text style={styles.statLabel}>TVL</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>1,247</Text>
              <Text style={styles.statLabel}>USERS</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>24/7</Text>
              <Text style={styles.statLabel}>ACTIVE</Text>
            </View>
          </View>
        </Animated.View>

        {/* Features Grid */}
        <Animated.View style={[styles.features, { opacity: fadeAnim3 }]}>
          <Text style={styles.sectionTitle}>CORE FEATURES</Text>
          
          <View style={styles.featureGrid}>
            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Ionicons name="wallet" size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.featureTitle}>CREDIT</Text>
              <Text style={styles.featureDesc}>
                Borrow USDC against your onchain reputation
              </Text>
            </View>

            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Ionicons name="trending-up" size={24} color={COLORS.success} />
              </View>
              <Text style={styles.featureTitle}>EARN</Text>
              <Text style={styles.featureDesc}>
                Yield on stablecoins and liquidity pools
              </Text>
            </View>

            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Ionicons name="flash" size={24} color={COLORS.warning} />
              </View>
              <Text style={styles.featureTitle}>AGENTS</Text>
              <Text style={styles.featureDesc}>
                AI-powered autonomous treasury management
              </Text>
            </View>

            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Ionicons name="shield-checkmark" size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.featureTitle}>SECURE</Text>
              <Text style={styles.featureDesc}>
                Non-custodial, audited smart contracts
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Tech Stack */}
        <Animated.View style={[styles.techStack, { opacity: fadeAnim4 }]}>
          <Text style={styles.sectionTitle}>POWERED BY</Text>
          <View style={styles.techGrid}>
            <View style={styles.techItem}>
              <Text style={styles.techText}>{DISPLAY_CONFIG.networkName}</Text>
            </View>
            <View style={styles.techItem}>
              <Text style={styles.techText}>USDC</Text>
            </View>
            <View style={styles.techItem}>
              <Text style={styles.techText}>ERC-4337</Text>
            </View>
            <View style={styles.techItem}>
              <Text style={styles.techText}>AI AGENTS</Text>
            </View>
          </View>
        </Animated.View>

        {/* Footer CTA */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.footerCTA} onPress={onLaunchApp}>
            <Text style={styles.footerCTAText}>ENTER APP</Text>
            <Ionicons name="arrow-forward-circle" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          
          <Text style={styles.footerText}>
            © 2025 FLEX • Decentralized Finance Reimagined
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.backgroundOverlay,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  logoGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
    color: COLORS.textDark,
    fontFamily: FONTS.display,
  },
  appName: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '800',
    color: COLORS.text,
    fontFamily: FONTS.display,
    letterSpacing: 2,
  },
  versionBadge: {
    backgroundColor: COLORS.cardSecondary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.xs,
    borderWidth: 1,
    borderColor: COLORS.borderBright,
  },
  versionText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    fontFamily: FONTS.mono,
    fontWeight: '700',
  },
  launchButton: {
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  launchButtonText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.textDark,
    fontFamily: FONTS.display,
    letterSpacing: 1,
  },
  hero: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.huge,
    alignItems: 'center',
  },
  networkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.cardSecondary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.borderBright,
    marginBottom: SPACING.xl,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
  },
  badgeText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontFamily: FONTS.mono,
    fontWeight: '700',
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: FONT_SIZES.massive,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    fontFamily: FONTS.display,
    letterSpacing: -1,
    lineHeight: FONT_SIZES.massive * 1.1,
  },
  heroTitleAccent: {
    color: COLORS.primary,
  },
  heroSubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xxxl,
    lineHeight: FONT_SIZES.md * 1.6,
    fontFamily: FONTS.body,
  },
  heroCTA: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.xxxl,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.xxxl,
    paddingVertical: SPACING.lg,
  },
  ctaText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
    color: COLORS.textDark,
    fontFamily: FONTS.display,
    letterSpacing: 2,
  },
  ctaArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.textDark + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xl,
    backgroundColor: COLORS.cardSecondary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.primary,
    fontFamily: FONTS.mono,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    fontFamily: FONTS.mono,
    letterSpacing: 1,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
  },
  features: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xxxl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.textMuted,
    fontFamily: FONTS.mono,
    letterSpacing: 2,
    marginBottom: SPACING.xl,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  featureCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.cardSecondary,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.cardTertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderBright,
  },
  featureTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: FONTS.display,
    marginBottom: SPACING.xs,
    letterSpacing: 1,
  },
  featureDesc: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: FONT_SIZES.sm * 1.5,
    fontFamily: FONTS.body,
  },
  techStack: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  techGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  techItem: {
    backgroundColor: COLORS.cardTertiary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  techText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontFamily: FONTS.mono,
    fontWeight: '700',
    letterSpacing: 1,
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xxxl,
    alignItems: 'center',
    gap: SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  footerCTAText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.primary,
    fontFamily: FONTS.display,
    letterSpacing: 2,
  },
  footerText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    fontFamily: FONTS.mono,
  },
});
