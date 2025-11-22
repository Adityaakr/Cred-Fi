import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Linking, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../theme/colors';
import { ethers } from 'ethers';

interface EarnScreenProps {
  sendTransaction?: any;
  wallets?: any[];
}

export const EarnScreen = ({ sendTransaction, wallets }: EarnScreenProps = {}) => {
  const [activeTab, setActiveTab] = useState<'savings' | 'invest'>('invest');
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [selectedPool, setSelectedPool] = useState<any>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositing, setDepositing] = useState(false);
  const [depositTxHash, setDepositTxHash] = useState<string | null>(null);
  const [totalDeposited, setTotalDeposited] = useState(0);

  console.log('🎯 EarnScreen rendered', { hasSendTransaction: !!sendTransaction });

  const vaults = [
    { name: 'USDC Vault', apy: 4.5, balance: 25000, icon: '💵' },
    { name: 'FDUSD Vault', apy: 4.2, balance: 15000, icon: '💰' },
    { name: 'USDT Vault', apy: 3.8, balance: 5000, icon: '💳' },
  ];

  const pools = [
    { name: 'usdc-USDT Pool', apy: 12.5, tvl: '2.5M', risk: 'Medium', address: '0xF9c36b4fBA23F515b1ae844642F81DC0aDdf6AF6' },
    { name: 'ETH-USDC Pool', apy: 15.2, tvl: '1.8M', risk: 'High', address: '0x0000000000000000000000000000000000000000' },
    { name: 'Stable Pool', apy: 6.8, tvl: '5.2M', risk: 'Low', address: '0x0000000000000000000000000000000000000000' },
  ];

  const handleAddLiquidity = (pool: any) => {
    setSelectedPool(pool);
    setShowDepositModal(true);
  };

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (!selectedPool) return;

    if (!sendTransaction) {
      Alert.alert('Error', 'Please login with Privy to deposit');
      return;
    }

    console.log('🔄 Starting Privy deposit...', {
      amount: depositAmount,
      pool: selectedPool.name,
      address: selectedPool.address,
      hasSendTransaction: !!sendTransaction
    });

    setDepositing(true);

    try {
      console.log('📤 Sending transaction with Privy...', {
        to: selectedPool.address,
        value: depositAmount + ' usdc'
      });

      // Use Privy's sendTransaction with specific wallet address
      const txHash = await sendTransaction(
        {
          to: selectedPool.address,
          value: ethers.parseEther(depositAmount).toString(),
          chainId: 97, // usdc Testnet
        },
        {
          address: '0x9C6CCbC95c804C3FB0024e5f10e2e978855280B3' // Specify which wallet to use
        }
      );

      console.log('✅ Transaction sent!', txHash);

      if (txHash) {
        setDepositTxHash(txHash);
        setTotalDeposited(prev => prev + parseFloat(depositAmount));
        setDepositAmount('');
        setShowDepositModal(false);

        Alert.alert(
          '✅ Deposit Successful!',
          `Added ${depositAmount} usdc to ${selectedPool.name}\n\nTx: ${txHash.substring(0, 10)}...`,
          [
            { text: 'Close', style: 'cancel' },
            { text: 'View on usdcScan', onPress: () => Linking.openURL(`https://testnet.bscscan.com/tx/${txHash}`) }
          ]
        );
      }
    } catch (error: any) {
      console.error('❌ Deposit error:', error);
      Alert.alert('Error', error.message || 'Failed to deposit usdc');
    } finally {
      setDepositing(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Tab Switcher */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'savings' && styles.tabActive]}
          onPress={() => setActiveTab('savings')}
        >
          <Text style={[styles.tabText, activeTab === 'savings' && styles.tabTextActive]}>
            Savings
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'invest' && styles.tabActive]}
          onPress={() => setActiveTab('invest')}
        >
          <Text style={[styles.tabText, activeTab === 'invest' && styles.tabTextActive]}>
            Invest
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'savings' ? (
        <>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Savings Vaults</Text>
            <Text style={styles.headerSubtitle}>Total: $45,000</Text>
          </View>

          {vaults.map((vault, i) => (
            <Card key={i} style={styles.vaultCard}>
              <View style={styles.vaultHeader}>
                <View style={styles.vaultIcon}>
                  <Text style={styles.vaultEmoji}>{vault.icon}</Text>
                </View>
                <View style={styles.vaultInfo}>
                  <Text style={styles.vaultName}>{vault.name}</Text>
                  <Badge variant="gold">APY: {vault.apy}%</Badge>
                </View>
              </View>
              <View style={styles.vaultBalance}>
                <Text style={styles.balanceLabel}>Balance</Text>
                <Text style={styles.balanceAmount}>${vault.balance.toLocaleString()}</Text>
              </View>
              <View style={styles.vaultActions}>
                <Button variant="outline" size="sm" style={styles.vaultBtn}>
                  Deposit
                </Button>
                <Button variant="ghost" size="sm" style={styles.vaultBtn}>
                  Withdraw
                </Button>
              </View>
            </Card>
          ))}
        </>
      ) : (
        <>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Investment Pools</Text>
            <Text style={styles.headerSubtitle}>Higher yield, higher risk</Text>
          </View>

          {pools.map((pool, i) => (
            <Card key={i} style={styles.poolCard}>
              <View style={styles.poolHeader}>
                <Text style={styles.poolName}>{pool.name}</Text>
                <Badge
                  variant={
                    pool.risk === 'Low' ? 'success' :
                    pool.risk === 'Medium' ? 'warning' : 'error'
                  }
                >
                  {pool.risk} Risk
                </Badge>
              </View>
              <View style={styles.poolMetrics}>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>APY</Text>
                  <Text style={styles.metricValue}>{pool.apy}%</Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>TVL</Text>
                  <Text style={styles.metricValue}>${pool.tvl}</Text>
                </View>
              </View>
              <Button size="sm" style={styles.poolButton} onPress={() => handleAddLiquidity(pool)}>
                Add Liquidity
              </Button>
            </Card>
          ))}
        </>
      )}

      {/* Deposit Modal */}
      <Modal
        visible={showDepositModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDepositModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedPool?.name}
              </Text>
              <TouchableOpacity onPress={() => setShowDepositModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {totalDeposited > 0 && (
              <View style={styles.depositedInfo}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                <Text style={styles.depositedText}>
                  Total Deposited: {totalDeposited.toFixed(4)} usdc
                </Text>
              </View>
            )}

            <View style={styles.poolInfo}>
              <View style={styles.poolStat}>
                <Text style={styles.poolStatLabel}>APY</Text>
                <Text style={styles.poolStatValue}>{selectedPool?.apy}%</Text>
              </View>
              <View style={styles.poolStat}>
                <Text style={styles.poolStatLabel}>TVL</Text>
                <Text style={styles.poolStatValue}>${selectedPool?.tvl}</Text>
              </View>
              <View style={styles.poolStat}>
                <Text style={styles.poolStatLabel}>Risk</Text>
                <Text style={[styles.poolStatValue, { color: COLORS.warning }]}>
                  {selectedPool?.risk}
                </Text>
              </View>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Amount in usdc"
              placeholderTextColor={COLORS.textSecondary}
              value={depositAmount}
              onChangeText={setDepositAmount}
              keyboardType="decimal-pad"
            />

            <Button
              variant="primary"
              onPress={handleDeposit}
              disabled={depositing}
              style={{ marginTop: SPACING.md }}
            >
              <Text style={{ color: COLORS.text, fontWeight: '600' }}>
                {depositing ? 'Depositing...' : 'Confirm Deposit'}
              </Text>
            </Button>

            {depositTxHash && (
              <TouchableOpacity
                style={styles.txLink}
                onPress={() => Linking.openURL(`https://testnet.bscscan.com/tx/${depositTxHash}`)}
              >
                <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                <Text style={styles.txLinkText}>
                  Last tx: {depositTxHash.substring(0, 10)}...
                </Text>
                <Ionicons name="open-outline" size={14} color={COLORS.primary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
  },
  tabs: {
    flexDirection: 'row',
    margin: SPACING.lg,
    backgroundColor: COLORS.accent,
    borderRadius: BORDER_RADIUS.md,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.sm,
  },
  tabActive: {
    backgroundColor: COLORS.card,
  },
  tabText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.text,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  vaultCard: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  vaultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  vaultIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  vaultEmoji: {
    fontSize: 24,
  },
  vaultInfo: {
    flex: 1,
    gap: 4,
  },
  vaultName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  vaultBalance: {
    marginBottom: SPACING.lg,
  },
  balanceLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  vaultActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  vaultBtn: {
    flex: 1,
  },
  poolCard: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  poolHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  poolName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  poolMetrics: {
    flexDirection: 'row',
    gap: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  metric: {
    flex: 1,
  },
  metricLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  poolButton: {
    width: '100%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    minHeight: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  depositedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: `${COLORS.success}20`,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.md,
  },
  depositedText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.success,
    fontWeight: '600',
  },
  poolInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.lg,
    padding: SPACING.md,
    backgroundColor: COLORS.accent,
    borderRadius: BORDER_RADIUS.md,
  },
  poolStat: {
    alignItems: 'center',
  },
  poolStatLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  poolStatValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  input: {
    backgroundColor: COLORS.accent,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  txLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    marginTop: SPACING.md,
  },
  txLinkText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    flex: 1,
  },
});
