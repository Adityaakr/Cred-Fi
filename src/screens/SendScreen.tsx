import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../theme/colors';
import { walletService, getTransactionUrl } from '../services/walletService';

interface SendScreenProps {
  walletAddress: string;
  onClose: () => void;
  onSend?: (toAddress: string, amount: string) => Promise<any>;
}

export function SendScreen({ walletAddress, onClose, onSend }: SendScreenProps) {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [isSending, setIsSending] = useState(false);

  console.log('📱 SendScreen rendered with:', { walletAddress, hasOnSend: !!onSend });

  const handleSend = async () => {
    console.log('📤 handleSend called with:', { recipient, amount, hasOnSend: !!onSend });
    if (!recipient || !amount) {
      Alert.alert('Error', 'Please enter recipient address and amount');
      return;
    }

    if (!recipient.startsWith('0x') || recipient.length !== 42) {
      Alert.alert('Error', 'Invalid recipient address');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Error', 'Invalid amount');
      return;
    }

    try {
      setIsSending(true);
      
      // Use onSend prop if provided (Privy), otherwise use walletService (fallback)
      const result = onSend 
        ? await onSend(recipient, amount)
        : await walletService.sendTransaction(recipient, amount);
      
      // Extract transaction hash (Privy returns object, walletService returns string)
      const txHash = typeof result === 'string' ? result : result?.transactionHash || result;
      
      Alert.alert(
        'Transaction Sent!',
        `Transaction hash: ${txHash.slice(0, 10)}...${txHash.slice(-8)}`,
        [
          { text: 'Close', onPress: onClose },
          {
            text: 'View on Explorer',
            onPress: () => {
              const url = getTransactionUrl(txHash);
              Linking.openURL(url);
            },
          },
        ]
      );
      
      setRecipient('');
      setAmount('');
    } catch (error: any) {
      Alert.alert('Transaction Failed', error.message || 'Failed to send transaction');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.iconCircle}>
            <Ionicons name="send" size={24} color={COLORS.primary} />
          </View>
          <View>
            <Text style={styles.title}>Send Money</Text>
            <Text style={styles.subtitle}>Transfer funds instantly</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.fromSection}>
          <Text style={styles.label}>FROM</Text>
          <View style={styles.addressBox}>
            <View style={styles.walletIconContainer}>
              <Ionicons name="wallet" size={20} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.addressLabel}>Your Wallet</Text>
              <Text style={styles.address}>
                {walletAddress.slice(0, 10)}...{walletAddress.slice(-8)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.label}>TO</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color={COLORS.textSecondary} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.input}
              placeholder="Recipient address (0x...)"
              placeholderTextColor={COLORS.textSecondary}
              value={recipient}
              onChangeText={setRecipient}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        <View style={styles.inputSection}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.label}>AMOUNT</Text>
            <Text style={styles.balanceLabel}>Balance: 1.01 usdc</Text>
          </View>
          <View style={styles.amountContainer}>
            <TextInput
              style={styles.amountInput}
              placeholder="0.0"
              placeholderTextColor={COLORS.textSecondary}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />
            <Text style={styles.currencyLabel}>usdc</Text>
          </View>
          <View style={styles.quickAmounts}>
            <TouchableOpacity
              style={styles.quickButton}
              onPress={() => setAmount('0.001')}
            >
              <Text style={styles.quickButtonText}>0.001</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickButton}
              onPress={() => setAmount('0.01')}
            >
              <Text style={styles.quickButtonText}>0.01</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickButton}
              onPress={() => setAmount('0.1')}
            >
              <Text style={styles.quickButtonText}>0.1</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickButton, styles.maxButton]}
              onPress={() => setAmount('1.0')}
            >
              <Text style={[styles.quickButtonText, styles.maxButtonText]}>MAX</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="layers-outline" size={16} color={COLORS.textSecondary} />
              <Text style={styles.summaryLabel}>Network</Text>
            </View>
            <View style={styles.networkBadge}>
              <Text style={styles.networkText}>usdc Testnet</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="flash-outline" size={16} color={COLORS.textSecondary} />
              <Text style={styles.summaryLabel}>Gas Fee</Text>
            </View>
            <Text style={styles.summaryValue}>~0.0001 usdc</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.sendButton, isSending && styles.sendButtonDisabled]}
          onPress={() => {
            console.log('🔥🔥🔥 SEND BUTTON CLICKED!');
            handleSend();
          }}
          disabled={isSending}
        >
          {isSending ? (
            <ActivityIndicator color={COLORS.text} size="small" />
          ) : (
            <>
              <Ionicons name="paper-plane" size={20} color={COLORS.text} />
              <Text style={styles.sendButtonText}>Send usdc</Text>
              <Ionicons name="arrow-forward" size={20} color={COLORS.text} />
            </>
          )}
        </TouchableOpacity>
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
  content: {
    padding: SPACING.lg,
  },
  fromSection: {
    marginBottom: SPACING.xl,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.card,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  address: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  inputSection: {
    marginBottom: SPACING.xl,
  },
  input: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  quickButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
  },
  quickButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: COLORS.card,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.xl,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  infoLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    fontWeight: '600',
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  headerContent: {
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
  subtitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  walletIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.primary}10`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  balanceLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    fontWeight: '600',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
  },
  amountInput: {
    flex: 1,
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  currencyLabel: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: SPACING.sm,
  },
  maxButton: {
    backgroundColor: COLORS.primary,
  },
  maxButtonText: {
    color: COLORS.text,
  },
  summaryCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    fontWeight: '600',
  },
  networkBadge: {
    backgroundColor: `${COLORS.success}15`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  networkText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.success,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
});
