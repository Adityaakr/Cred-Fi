import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../theme/colors';
import { UnifiedBalance } from '../components/UnifiedBalance';
import { NexusSendScreen } from './NexusSendScreen';

interface NexusHomeScreenProps {
  walletAddress: string | null;
}

export function NexusHomeScreen({ walletAddress }: NexusHomeScreenProps) {
  const [showSendModal, setShowSendModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);

  if (!walletAddress) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons name="wallet-outline" size={64} color={COLORS.textSecondary} />
          <Text style={styles.emptyText}>Connect wallet to use Nexus</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setShowSendModal(true)}
        >
          <View style={styles.actionIcon}>
            <Ionicons name="arrow-up" size={24} color={COLORS.primary} />
          </View>
          <Text style={styles.actionText}>Send</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setShowReceiveModal(true)}
        >
          <View style={styles.actionIcon}>
            <Ionicons name="arrow-down" size={24} color={COLORS.primary} />
          </View>
          <Text style={styles.actionText}>Receive</Text>
        </TouchableOpacity>
      </View>

      {/* Unified Balance */}
      <UnifiedBalance />

      {/* Send Modal */}
      <Modal
        visible={showSendModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSendModal(false)}
      >
        <NexusSendScreen 
          walletAddress={walletAddress}
          onClose={() => setShowSendModal(false)}
        />
      </Modal>

      {/* Receive Modal */}
      <Modal
        visible={showReceiveModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowReceiveModal(false)}
      >
        <View style={styles.receiveContainer}>
          <View style={styles.receiveHeader}>
            <Text style={styles.receiveTitle}>Receive</Text>
            <TouchableOpacity onPress={() => setShowReceiveModal(false)}>
              <Ionicons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.receiveContent}>
            <Text style={styles.receiveLabel}>Your Address</Text>
            <View style={styles.addressBox}>
              <Text style={styles.addressText}>{walletAddress}</Text>
            </View>
            <Text style={styles.receiveInfo}>
              You can receive USDC, USDT, and ETH on Polygon, Arbitrum, or Base to this address.
            </Text>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  actionsContainer: {
    flexDirection: 'row',
    padding: SPACING.lg,
    gap: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  actionText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  receiveContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  receiveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  receiveTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  receiveContent: {
    flex: 1,
    padding: SPACING.lg,
  },
  receiveLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    fontWeight: '600',
  },
  addressBox: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  addressText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    fontFamily: 'monospace',
  },
  receiveInfo: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});
