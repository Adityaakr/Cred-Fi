/**
 * Premium Content Screen - x402 Gated Content Demo
 * Pay with x402 to unlock premium content
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { x402Service } from '../services/x402Service';

interface ContentItem {
  id: string;
  title: string;
  description: string;
  price: number; // in USDT
  icon: string;
  content: string;
  unlocked: boolean;
}

interface PremiumContentScreenProps {
  walletAddress?: string;
  embedded?: boolean; // Flag to indicate if embedded in another ScrollView
}

export const PremiumContentScreen = ({ walletAddress, embedded = false }: PremiumContentScreenProps) => {
  const [contents, setContents] = useState<ContentItem[]>([
    {
      id: '1',
      title: 'DeFi Trading Strategies',
      description: 'Advanced strategies for yield farming and liquidity provision',
      price: 0.01,
      icon: '📈',
      content: `
# Advanced DeFi Trading Strategies

## 1. Yield Farming Optimization
- Monitor APY rates across protocols
- Rebalance positions automatically
- Compound rewards for maximum returns

## 2. Liquidity Provision
- Impermanent loss mitigation
- Fee optimization strategies
- Multi-pool diversification

## 3. Risk Management
- Position sizing guidelines
- Stop-loss strategies
- Portfolio rebalancing

**Exclusive Bonus:** Access to our private Discord community!
      `,
      unlocked: false,
    },
    {
      id: '2',
      title: 'Smart Contract Analysis',
      description: 'Learn to audit and analyze DeFi smart contracts',
      price: 0.02,
      icon: '🔐',
      content: `
# Smart Contract Security Analysis

## Key Areas to Review:
1. **Access Control** - Who can call what functions?
2. **Reentrancy Guards** - Protection against attacks
3. **Oracle Dependencies** - Price feed security
4. **Upgrade Mechanisms** - Proxy patterns and risks

## Tools:
- Slither (static analysis)
- Mythril (symbolic execution)
- Echidna (fuzzing)

**Includes:** 10 real-world contract audit examples!
      `,
      unlocked: false,
    },
    {
      id: '3',
      title: 'MEV & Arbitrage Guide',
      description: 'Understand MEV and capture arbitrage opportunities',
      price: 0.05,
      icon: '⚡',
      content: `
# MEV & Arbitrage Opportunities

## What is MEV?
Maximal Extractable Value - profit from transaction ordering

## Arbitrage Strategies:
1. **DEX Arbitrage** - Price differences across exchanges
2. **Liquidation Bots** - Capture liquidation bonuses
3. **Sandwich Attacks** - Front-running techniques (ethical considerations)

## Tools & Setup:
- Flashbots integration
- MEV-Boost configuration
- Custom RPC endpoints

**Bonus:** Private bot templates and code examples!
      `,
      unlocked: false,
    },
  ]);

  const [unlocking, setUnlocking] = useState<string | null>(null);

  const handleUnlockContent = async (item: ContentItem) => {
    if (!walletAddress) {
      Alert.alert('Error', 'Please connect your wallet first');
      return;
    }

    setUnlocking(item.id);

    try {
      // Create payment via x402
      const result = await x402Service.executeGaslessPayment(
        walletAddress,
        '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd', // USDT on usdc Testnet
        item.price.toString(),
        '0x5a26514ce0af943540407170b09cea03cbff5570', // Recipient
        `Unlock: ${item.title}`
      );

      if (result.success) {
        // Unlock content
        setContents(prev =>
          prev.map(c =>
            c.id === item.id ? { ...c, unlocked: true } : c
          )
        );

        Alert.alert(
          '✅ Content Unlocked!',
          `Payment successful via x402!\n\nTx: ${result.txHash?.substring(0, 10)}...\n\nYou can now access "${item.title}"`
        );
      } else {
        Alert.alert('Payment Failed', result.error || 'Unknown error');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setUnlocking(null);
    }
  };

  const Container = embedded ? View : ScrollView;
  
  return (
    <Container style={styles.container}>
      {!embedded && (
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Premium Content</Text>
          <Text style={styles.headerSubtitle}>
            Pay with x402 to unlock exclusive content
          </Text>
        </View>
      )}

      <Card style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Ionicons name="flash" size={24} color={COLORS.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Powered by AEON x402</Text>
            <Text style={styles.infoText}>
              Pay with crypto, no gas fees required!
            </Text>
          </View>
        </View>
      </Card>

      {contents.map((item) => (
        <Card key={item.id} style={styles.contentCard}>
          <View style={styles.contentHeader}>
            <Text style={styles.contentIcon}>{item.icon}</Text>
            <View style={styles.contentInfo}>
              <Text style={styles.contentTitle}>{item.title}</Text>
              <Text style={styles.contentDescription}>{item.description}</Text>
            </View>
          </View>

          <View style={styles.priceSection}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Price:</Text>
              <Text style={styles.priceValue}>{item.price} USDT</Text>
            </View>
            {item.unlocked && (
              <View style={styles.unlockedBadge}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                <Text style={styles.unlockedText}>Unlocked</Text>
              </View>
            )}
          </View>

          {item.unlocked ? (
            <View style={styles.contentBody}>
              <Text style={styles.contentText}>{item.content}</Text>
            </View>
          ) : (
            <View style={styles.lockedSection}>
              <Ionicons name="lock-closed" size={48} color={COLORS.textSecondary} />
              <Text style={styles.lockedText}>
                This content is locked. Pay {item.price} USDT to unlock.
              </Text>
              <Button
                variant="primary"
                onPress={() => handleUnlockContent(item)}
                disabled={unlocking === item.id}
                style={styles.unlockButton}
              >
                {unlocking === item.id ? (
                  <ActivityIndicator size="small" color={COLORS.text} />
                ) : (
                  <>
                    <Ionicons name="flash" size={20} color={COLORS.text} />
                    <Text style={styles.unlockButtonText}>
                      Unlock with x402
                    </Text>
                  </>
                )}
              </Button>
            </View>
          )}
        </Card>
      ))}

      <Card style={styles.howItWorksCard}>
        <Text style={styles.howItWorksTitle}>How it works</Text>
        <View style={styles.stepsList}>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepText}>Choose premium content</Text>
          </View>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepText}>Click "Unlock with x402"</Text>
          </View>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepText}>Pay with USDT (no gas fees!)</Text>
          </View>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>4</Text>
            </View>
            <Text style={styles.stepText}>Content unlocked instantly!</Text>
          </View>
        </View>
      </Card>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
  },
  header: {
    padding: SPACING.lg,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  infoCard: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    backgroundColor: `${COLORS.primary}10`,
    borderWidth: 1,
    borderColor: `${COLORS.primary}30`,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  infoText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  contentCard: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  contentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  contentIcon: {
    fontSize: 40,
  },
  contentInfo: {
    flex: 1,
  },
  contentTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  contentDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  priceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  priceLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  priceValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  unlockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${COLORS.success}20`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  unlockedText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.success,
    fontWeight: '600',
  },
  contentBody: {
    backgroundColor: COLORS.cardDark,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  contentText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    lineHeight: 20,
  },
  lockedSection: {
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.cardDark,
    borderRadius: BORDER_RADIUS.md,
  },
  lockedText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  unlockButton: {
    minWidth: 200,
  },
  unlockButtonText: {
    color: COLORS.text,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  howItWorksCard: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  howItWorksTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  stepsList: {
    gap: SPACING.md,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  stepText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    flex: 1,
  },
});
