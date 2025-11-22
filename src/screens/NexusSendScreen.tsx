import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../theme/colors';
import { useNexus } from '../providers/NexusProvider';
import { NEXUS_EVENTS, TOKEN_METADATA } from '@avail-project/nexus-core';

interface NexusSendScreenProps {
  walletAddress: string;
  onClose: () => void;
}

const SUPPORTED_CHAINS = [
  { id: 137, name: 'Polygon', icon: '🟣' },
  { id: 42161, name: 'Arbitrum', icon: '🔵' },
  { id: 8453, name: 'Base', icon: '🔷' },
];

export function NexusSendScreen({ walletAddress, onClose }: NexusSendScreenProps) {
  const { nexusSDK, unifiedBalance, intent, allowance, fetchUnifiedBalance } = useNexus();
  
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState<string>('USDC');
  const [selectedChain, setSelectedChain] = useState<number>(137);
  const [isSending, setIsSending] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [progress, setProgress] = useState<string[]>([]);

  const availableTokens = unifiedBalance?.map(b => b.symbol) || ['USDC', 'USDT', 'ETH'];
  const selectedBalance = unifiedBalance?.find(b => b.symbol === selectedToken);

  const handleSend = async () => {
    if (!recipient || !amount || !nexusSDK) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    if (!recipient.startsWith('0x') || recipient.length !== 42) {
      Alert.alert('Error', 'Invalid recipient address');
      return;
    }

    try {
      setIsSending(true);
      setShowProgress(true);
      setProgress(['Preparing transaction...']);

      const decimals = TOKEN_METADATA[selectedToken as any]?.decimals || 6;
      const amountBigInt = nexusSDK.utils.parseUnits(amount, decimals);

      // Subscribe to progress events
      const unsubscribe = nexusSDK.nexusEvents.on(NEXUS_EVENTS.STEP_COMPLETE, (step: any) => {
        setProgress(prev => [...prev, `${step.typeID}: ${step.data?.status || 'Processing'}`]);
      });

      const result = await nexusSDK.bridgeAndTransfer({
        token: selectedToken as any,
        amount: amountBigInt,
        toChainId: selectedChain as any,
        recipient: recipient as `0x${string}`,
      }, {
        onEvent: (event) => {
          if (event.name === NEXUS_EVENTS.STEP_COMPLETE) {
            console.log('Step completed:', event.args);
          }
        }
      });

      unsubscribe();

      if (result.success) {
        Alert.alert('Success!', `Transaction sent!\n\nExplorer: ${result.explorerUrl || 'N/A'}`);
        setRecipient('');
        setAmount('');
        await fetchUnifiedBalance();
        onClose();
      } else {
        Alert.alert('Error', result.error || 'Transaction failed');
      }
    } catch (error: any) {
      console.error('Send error:', error);
      Alert.alert('Error', error.message || 'Failed to send transaction');
    } finally {
      setIsSending(false);
      setShowProgress(false);
      setProgress([]);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Send with Nexus</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Token Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>TOKEN</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tokenList}>
            {availableTokens.map(token => (
              <TouchableOpacity
                key={token}
                style={[styles.tokenButton, selectedToken === token && styles.tokenButtonActive]}
                onPress={() => setSelectedToken(token)}
              >
                <Text style={[styles.tokenText, selectedToken === token && styles.tokenTextActive]}>
                  {token}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {selectedBalance && (
            <Text style={styles.balanceText}>
              Available: {selectedBalance.balance} {selectedToken}
            </Text>
          )}
        </View>

        {/* Chain Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>TO CHAIN</Text>
          <View style={styles.chainGrid}>
            {SUPPORTED_CHAINS.map(chain => (
              <TouchableOpacity
                key={chain.id}
                style={[styles.chainButton, selectedChain === chain.id && styles.chainButtonActive]}
                onPress={() => setSelectedChain(chain.id)}
              >
                <Text style={styles.chainIcon}>{chain.icon}</Text>
                <Text style={[styles.chainText, selectedChain === chain.id && styles.chainTextActive]}>
                  {chain.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recipient */}
        <View style={styles.section}>
          <Text style={styles.label}>RECIPIENT</Text>
          <TextInput
            style={styles.input}
            placeholder="0x..."
            placeholderTextColor={COLORS.textSecondary}
            value={recipient}
            onChangeText={setRecipient}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Amount */}
        <View style={styles.section}>
          <Text style={styles.label}>AMOUNT</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="0.0"
            placeholderTextColor={COLORS.textSecondary}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Progress */}
        {showProgress && (
          <View style={styles.progressContainer}>
            {progress.map((msg, idx) => (
              <Text key={idx} style={styles.progressText}>• {msg}</Text>
            ))}
          </View>
        )}

        {/* Send Button */}
        <TouchableOpacity
          style={[styles.sendButton, isSending && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={isSending}
        >
          {isSending ? (
            <ActivityIndicator color={COLORS.text} />
          ) : (
            <>
              <Ionicons name="send" size={20} color={COLORS.text} />
              <Text style={styles.sendButtonText}>Send</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  title: { fontSize: FONT_SIZES.xl, fontWeight: 'bold', color: COLORS.text },
  content: { flex: 1, padding: SPACING.lg },
  section: { marginBottom: SPACING.xl },
  label: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginBottom: SPACING.sm, fontWeight: '600' },
  tokenList: { flexDirection: 'row', marginBottom: SPACING.sm },
  tokenButton: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.md, marginRight: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  tokenButtonActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tokenText: { fontSize: FONT_SIZES.md, color: COLORS.text, fontWeight: '600' },
  tokenTextActive: { color: COLORS.background },
  balanceText: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: SPACING.xs },
  chainGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  chainButton: { flex: 1, minWidth: '30%', padding: SPACING.md, backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.md, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  chainButtonActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chainIcon: { fontSize: 24, marginBottom: 4 },
  chainText: { fontSize: FONT_SIZES.sm, color: COLORS.text, fontWeight: '600' },
  chainTextActive: { color: COLORS.background },
  input: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, fontSize: FONT_SIZES.md, color: COLORS.text },
  amountInput: { backgroundColor: COLORS.card, borderWidth: 2, borderColor: COLORS.primary, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, fontSize: FONT_SIZES.xxl, fontWeight: 'bold', color: COLORS.text },
  progressContainer: { backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md },
  progressText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginBottom: 4 },
  sendButton: { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, padding: SPACING.lg, borderRadius: BORDER_RADIUS.lg },
  sendButtonDisabled: { opacity: 0.5 },
  sendButtonText: { fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.text },
});
