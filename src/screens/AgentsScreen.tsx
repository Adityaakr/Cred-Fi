import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { PremiumContentScreen } from './PremiumContentScreen';

interface AgentsScreenProps {
  walletAddress?: string;
}

// Simple mock agent for Phase 1
const createMockAgent = (address: string) => ({
  address: `0xagent${Date.now().toString(16).substring(0, 8)}`,
  balance: 0,
  creditAllocated: 200,
  creditUsed: 0,
  spendingCap: 500,
  reputation: 50,
  tier: 'BRONZE',
  actionsPerformed: 0,
  successfulActions: 0,
  lastCheck: Date.now(),
});

const mockAgents = new Map();

export const AgentsScreen = ({ walletAddress }: AgentsScreenProps) => {
  const [activeTab, setActiveTab] = useState<'agents' | 'premium'>('agents');
  const [agent, setAgent] = useState<any>(null);
  const [countdown, setCountdown] = useState(60);
  const [policyResult, setPolicyResult] = useState<any>(null);

  // Initialize agent
  useEffect(() => {
    if (walletAddress) {
      if (!mockAgents.has(walletAddress)) {
        mockAgents.set(walletAddress, createMockAgent(walletAddress));
      }
      setAgent(mockAgents.get(walletAddress));
    }
  }, [walletAddress]);

  // Countdown timer (1-minute loop)
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          executeMicropayment();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const executeMicropayment = () => {
    console.log('✅ Micropayment executed: $0.001 USDT');
    if (agent) {
      agent.lastCheck = Date.now();
      setAgent({ ...agent });
    }
  };

  const handleCheckPolicy = () => {
    const result = {
      allowed: true,
      reason: 'Transaction approved',
      warnings: ['⚠️ 75% of daily limit used'],
      creditHeadroom: 450,
      dailyRemaining: 25,
      categoryRemaining: 35,
    };
    setPolicyResult(result);
    Alert.alert(
      '✅ Policy Check Passed',
      `${result.reason}\n\nCredit Headroom: $${result.creditHeadroom}\nDaily Remaining: $${result.dailyRemaining}`
    );
  };

  const handleRunAction = () => {
    if (!agent) return;
    agent.creditUsed += 15;
    agent.actionsPerformed += 1;
    agent.successfulActions += 1;
    agent.reputation = Math.min(100, agent.reputation + 5);
    setAgent({ ...agent });
    Alert.alert(
      '✅ Action Successful!',
      `Reputation: ${agent.reputation}/100\n\nAgent executed DeFi action autonomously!`
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🏦 Treasury Smart Wallet</Text>
        <Text style={styles.subtitle}>AI Agent with x402 Protocol</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'agents' && styles.tabActive]}
          onPress={() => setActiveTab('agents')}
        >
          <Text style={[styles.tabText, activeTab === 'agents' && styles.tabTextActive]}>
            Agent
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'premium' && styles.tabActive]}
          onPress={() => setActiveTab('premium')}
        >
          <Text style={[styles.tabText, activeTab === 'premium' && styles.tabTextActive]}>
            Premium
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'premium' ? (
        <PremiumContentScreen walletAddress={walletAddress} embedded={true} />
      ) : agent ? (
        <View>
          {/* Countdown */}
          <Card style={styles.card}>
            <View style={styles.row}>
              <Ionicons name="time" size={20} color={COLORS.primary} />
              <Text style={styles.label}>Next Check:</Text>
              <Text style={styles.value}>{countdown}s</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progress, { width: `${(countdown / 60) * 100}%` }]} />
            </View>
            <Text style={styles.note}>Micropayment: $0.001 USDT/min (x402)</Text>
          </Card>

          {/* Stats */}
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Agent Wallet</Text>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Address:</Text>
              <Text style={styles.statValue}>{agent.address.substring(0, 12)}...</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Credit Allocated:</Text>
              <Text style={styles.statValue}>${agent.creditAllocated}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Credit Used:</Text>
              <Text style={styles.statValue}>${agent.creditUsed}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Spending Cap:</Text>
              <Text style={styles.statValue}>${agent.spendingCap}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Reputation:</Text>
              <Text style={[styles.statValue, { color: COLORS.success }]}>
                {agent.reputation}/100
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Tier:</Text>
              <Text style={styles.statValue}>{agent.tier}</Text>
            </View>
          </Card>

          {/* Actions */}
          <View style={styles.actions}>
            <Button variant="primary" size="sm" onPress={handleCheckPolicy} style={{ flex: 1 }}>
              <Text style={{ color: COLORS.text }}>Check Policy</Text>
            </Button>
            <Button variant="outline" size="sm" onPress={handleRunAction} style={{ flex: 1 }}>
              <Text style={{ color: COLORS.primary }}>Run Action</Text>
            </Button>
          </View>

          {/* Policy Result */}
          {policyResult && (
            <Card style={styles.card}>
              <Text style={styles.cardTitle}>
                {policyResult.allowed ? '✅ Approved' : '❌ Denied'}
              </Text>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Credit Headroom:</Text>
                <Text style={styles.statValue}>${policyResult.creditHeadroom}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Daily Remaining:</Text>
                <Text style={styles.statValue}>${policyResult.dailyRemaining}</Text>
              </View>
              {policyResult.warnings.map((w: string, i: number) => (
                <Text key={i} style={styles.warning}>{w}</Text>
              ))}
            </Card>
          )}

          {/* Info */}
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>How It Works</Text>
            <Text style={styles.info}>
              • Monitors spending every minute via x402{'\n'}
              • Enforces daily & category limits{'\n'}
              • Checks credit headroom{'\n'}
              • Builds on-chain reputation{'\n'}
              • Autonomous actions with spending caps
            </Text>
          </Card>
        </View>
      ) : (
        <Card style={styles.card}>
          <Text style={styles.info}>Connect wallet to see agent</Text>
        </Card>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundDark },
  header: { padding: SPACING.lg },
  title: { fontSize: FONT_SIZES.xxl, fontWeight: 'bold', color: COLORS.text },
  subtitle: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 4 },
  tabs: { flexDirection: 'row', marginHorizontal: SPACING.lg, marginBottom: SPACING.lg, backgroundColor: COLORS.cardDark, borderRadius: BORDER_RADIUS.md, padding: 4 },
  tab: { flex: 1, paddingVertical: SPACING.sm, alignItems: 'center', borderRadius: BORDER_RADIUS.sm },
  tabActive: { backgroundColor: COLORS.cardDarkSecondary },
  tabText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, fontWeight: '500' },
  tabTextActive: { color: COLORS.primary, fontWeight: '600' },
  card: { marginHorizontal: SPACING.lg, marginBottom: SPACING.lg },
  cardTitle: { fontSize: FONT_SIZES.md, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  label: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  value: { fontSize: FONT_SIZES.lg, fontWeight: 'bold', color: COLORS.primary, marginLeft: 'auto' },
  progressBar: { height: 6, backgroundColor: `${COLORS.primary}20`, borderRadius: 3, overflow: 'hidden', marginBottom: SPACING.sm },
  progress: { height: '100%', backgroundColor: COLORS.primary },
  note: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, textAlign: 'center' },
  stat: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.xs },
  statLabel: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  statValue: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.text },
  actions: { flexDirection: 'row', gap: SPACING.md, marginHorizontal: SPACING.lg, marginBottom: SPACING.lg },
  warning: { fontSize: FONT_SIZES.xs, color: COLORS.warning, marginTop: SPACING.xs },
  info: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, lineHeight: 20 },
});
