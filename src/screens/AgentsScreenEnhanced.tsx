import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { StrategyCard } from '../components/StrategyCard';
import { PositionMonitor } from '../components/PositionMonitor';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { PremiumContentScreen } from './PremiumContentScreen';
import { defiStrategyService, Strategy, Position } from '../services/defiStrategyService';
import { initializeAgent, getAgentInstance } from '../services/hederaAgentService';

interface AgentsScreenEnhancedProps {
  walletAddress?: string;
  creditLimit?: number;
}

export const AgentsScreenEnhanced = ({ walletAddress, creditLimit = 500 }: AgentsScreenEnhancedProps) => {
  const [activeTab, setActiveTab] = useState<'strategies' | 'positions' | 'premium'>('strategies');
  const [agentState, setAgentState] = useState<any>(null);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [totalPnL, setTotalPnL] = useState({ total: 0, open: 0, closed: 0 });
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [activityLog, setActivityLog] = useState<string[]>([]);
  const [autoTradeEnabled, setAutoTradeEnabled] = useState(false);
  
  const autoTradeInterval = useRef<NodeJS.Timeout | null>(null);

  // Initialize agent and load strategies
  useEffect(() => {
    if (walletAddress) {
      initializeAgentService();
      loadStrategies();
    }
    
    return () => {
      if (autoTradeInterval.current) {
        clearInterval(autoTradeInterval.current);
      }
    };
  }, [walletAddress]);

  // Update positions periodically
  useEffect(() => {
    const interval = setInterval(() => {
      updatePositions();
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Auto-trade loop
  useEffect(() => {
    if (autoTradeEnabled && selectedStrategy) {
      autoTradeInterval.current = setInterval(() => {
        scanAndExecute();
      }, 30000); // Scan every 30 seconds
    } else if (autoTradeInterval.current) {
      clearInterval(autoTradeInterval.current);
      autoTradeInterval.current = null;
    }

    return () => {
      if (autoTradeInterval.current) {
        clearInterval(autoTradeInterval.current);
      }
    };
  }, [autoTradeEnabled, selectedStrategy]);

  const initializeAgentService = async () => {
    try {
      const agent = initializeAgent({
        accountId: '0.0.7307730',
        privateKey: '0x81036ab7f571170ce9a71aad98ea9d5e310b7382ca181c24c23f6f8d3b434261',
        creditLimit: creditLimit,
        maxDailySpend: 100,
        maxPositionSize: 200,
        riskTolerance: 'moderate',
      });

      // Initialize with OpenAI key (should come from env)
      await agent.initialize(process.env.OPENAI_API_KEY || '');
      
      setAgentState(agent.getState());
      addLog('🤖 Agent initialized successfully');
    } catch (error) {
      console.error('Failed to initialize agent:', error);
      addLog('❌ Agent initialization failed');
    }
  };

  const loadStrategies = () => {
    const allStrategies = defiStrategyService.getStrategies();
    setStrategies(allStrategies);
    addLog(`📋 Loaded ${allStrategies.length} strategies`);
  };

  const updatePositions = () => {
    const openPositions = defiStrategyService.getPositions({ status: 'open' });
    
    // Update each position's price
    openPositions.forEach(pos => {
      defiStrategyService.updatePosition(pos.id);
    });
    
    const allPositions = defiStrategyService.getPositions();
    setPositions(allPositions);
    
    const pnl = defiStrategyService.getTotalPnL();
    setTotalPnL(pnl);
    
    // Update agent state
    const agent = getAgentInstance();
    if (agent) {
      setAgentState(agent.getState());
    }
  };

  const addLog = (message: string) => {
    setActivityLog(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev.slice(0, 19)]);
  };

  const handleSelectStrategy = (strategyId: string) => {
    setSelectedStrategy(strategyId);
    addLog(`✅ Selected strategy: ${strategyId.replace(/_/g, ' ')}`);
  };

  const scanAndExecute = async () => {
    if (!selectedStrategy || isScanning) return;
    
    setIsScanning(true);
    addLog(`🔍 Scanning market for ${selectedStrategy}...`);

    try {
      // Scan for opportunities
      const opportunity = await defiStrategyService.scanMarket(selectedStrategy);
      
      if (!opportunity) {
        addLog('⚠️ No opportunities found');
        setIsScanning(false);
        return;
      }

      addLog(`✅ Opportunity found: ${JSON.stringify(opportunity.opportunity)}`);

      // Get agent decision
      const agent = getAgentInstance();
      if (!agent) {
        addLog('❌ Agent not initialized');
        setIsScanning(false);
        return;
      }

      const decision = await agent.analyzeMarket(opportunity);
      addLog(`🤖 Agent decision: ${decision.action} - ${decision.reasoning}`);

      if (decision.approved && decision.action !== 'none') {
        await executeStrategy(decision);
      } else {
        addLog(`⏸️ Trade not approved: ${decision.reasoning}`);
      }
    } catch (error) {
      console.error('Error in scan and execute:', error);
      addLog(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsScanning(false);
    }
  };

  const executeStrategy = async (decision: any) => {
    if (isExecuting) return;
    
    setIsExecuting(true);
    addLog(`⚡ Executing ${decision.action}...`);

    try {
      const agent = getAgentInstance();
      if (!agent) throw new Error('Agent not initialized');

      // Execute trade through agent
      const result = await agent.executeTrade(decision);
      
      if (result.success) {
        // Open position in strategy service
        const position = defiStrategyService.openPosition(selectedStrategy!, decision.amount);
        addLog(`✅ Position opened: ${position.id} - $${decision.amount}`);
        addLog(`💰 Expected return: ${decision.expectedReturn.toFixed(2)}%`);
        
        // Update state
        updatePositions();
        
        Alert.alert(
          '✅ Trade Executed!',
          `Position: $${decision.amount}\nExpected Return: ${decision.expectedReturn.toFixed(2)}%\nTx: ${result.txId}`
        );
      } else {
        addLog(`❌ Trade failed: ${result.error}`);
        Alert.alert('❌ Trade Failed', result.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error executing strategy:', error);
      addLog(`❌ Execution error: ${error instanceof Error ? error.message : 'Unknown'}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleManualScan = () => {
    if (!selectedStrategy) {
      Alert.alert('⚠️ No Strategy Selected', 'Please select a strategy first');
      return;
    }
    scanAndExecute();
  };

  const handleToggleAutoTrade = () => {
    if (!selectedStrategy) {
      Alert.alert('⚠️ No Strategy Selected', 'Please select a strategy first');
      return;
    }
    
    setAutoTradeEnabled(!autoTradeEnabled);
    addLog(`${!autoTradeEnabled ? '▶️' : '⏸️'} Auto-trade ${!autoTradeEnabled ? 'enabled' : 'disabled'}`);
  };

  const handleEmergencyStop = () => {
    Alert.alert(
      '🚨 Emergency Stop',
      'This will close all positions and stop auto-trading. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'STOP ALL',
          style: 'destructive',
          onPress: async () => {
            setAutoTradeEnabled(false);
            defiStrategyService.closeAllPositions();
            
            const agent = getAgentInstance();
            if (agent) {
              await agent.emergencyStop();
            }
            
            updatePositions();
            addLog('🚨 EMERGENCY STOP - All positions closed');
            Alert.alert('✅ Emergency Stop Complete', 'All positions have been closed');
          },
        },
      ]
    );
  };

  const handleClosePosition = (positionId: string) => {
    const position = defiStrategyService.closePosition(positionId);
    if (position) {
      addLog(`📉 Position closed: ${positionId} - P&L: $${position.pnl.toFixed(2)}`);
      updatePositions();
    }
  };

  const getPolicyStatus = () => {
    const agent = getAgentInstance();
    if (!agent) return null;
    return agent.getPolicyStatus();
  };

  const policyStatus = getPolicyStatus();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🤖 AI DeFi Agent</Text>
        <Text style={styles.subtitle}>Autonomous Trading with Credit Lines</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={activeTab === 'strategies' ? {...styles.tab, ...styles.tabActive} : styles.tab}
          onPress={() => setActiveTab('strategies')}
        >
          <Text style={activeTab === 'strategies' ? {...styles.tabText, ...styles.tabTextActive} : styles.tabText}>
            Strategies
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={activeTab === 'positions' ? {...styles.tab, ...styles.tabActive} : styles.tab}
          onPress={() => setActiveTab('positions')}
        >
          <Text style={activeTab === 'positions' ? {...styles.tabText, ...styles.tabTextActive} : styles.tabText}>
            Positions
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={activeTab === 'premium' ? {...styles.tab, ...styles.tabActive} : styles.tab}
          onPress={() => setActiveTab('premium')}
        >
          <Text style={activeTab === 'premium' ? {...styles.tabText, ...styles.tabTextActive} : styles.tabText}>
            Premium
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'premium' ? (
        <PremiumContentScreen walletAddress={walletAddress} embedded={true} />
      ) : activeTab === 'strategies' ? (
        <View>
          {/* Agent Status */}
          {agentState && (
            <Card style={styles.card}>
              <View style={styles.statusHeader}>
                <Text style={styles.cardTitle}>Agent Status</Text>
                <Badge variant={autoTradeEnabled ? 'success' : 'default'}>
                  {autoTradeEnabled ? 'AUTO' : 'MANUAL'}
                </Badge>
              </View>
              
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Reputation</Text>
                  <Text style={styles.statValue}>{agentState.reputation}/100</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Tier</Text>
                  <Text style={styles.statValue}>{agentState.tier}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Actions</Text>
                  <Text style={styles.statValue}>{agentState.actionsPerformed}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Success Rate</Text>
                  <Text style={styles.statValue}>
                    {agentState.actionsPerformed > 0 
                      ? Math.round((agentState.successfulActions / agentState.actionsPerformed) * 100)
                      : 0}%
                  </Text>
                </View>
              </View>

              {policyStatus && (
                <View style={styles.policyBox}>
                  <View style={styles.policyRow}>
                    <Text style={styles.policyLabel}>Credit Available:</Text>
                    <Text style={styles.policyValue}>${policyStatus.creditHeadroom.toFixed(2)}</Text>
                  </View>
                  <View style={styles.policyRow}>
                    <Text style={styles.policyLabel}>Daily Remaining:</Text>
                    <Text style={styles.policyValue}>${policyStatus.dailyRemaining.toFixed(2)}</Text>
                  </View>
                </View>
              )}
            </Card>
          )}

          {/* Control Panel */}
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Control Panel</Text>
            
            <View style={styles.controls}>
              <Button 
                variant="primary" 
                onPress={handleManualScan}
                disabled={!selectedStrategy || isScanning || isExecuting}
                style={{ flex: 1 }}
              >
                {isScanning ? (
                  <ActivityIndicator color={COLORS.text} />
                ) : (
                  <Text style={{ color: COLORS.text }}>
                    {selectedStrategy ? 'Scan Market' : 'Select Strategy'}
                  </Text>
                )}
              </Button>
              
              <Button 
                variant={autoTradeEnabled ? 'outline' : 'primary'}
                onPress={handleToggleAutoTrade}
                disabled={!selectedStrategy}
                style={{ flex: 1 }}
              >
                <Text style={{ color: autoTradeEnabled ? COLORS.primary : COLORS.text }}>
                  {autoTradeEnabled ? 'Stop Auto' : 'Start Auto'}
                </Text>
              </Button>
            </View>

            <Button 
              variant="outline"
              onPress={handleEmergencyStop}
              style={{ marginTop: SPACING.sm, borderColor: COLORS.error }}
            >
              <Text style={{ color: COLORS.error }}>🚨 Emergency Stop</Text>
            </Button>
          </Card>

          {/* Strategies */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Strategies</Text>
            {strategies.map(strategy => (
              <StrategyCard
                key={strategy.id}
                strategy={strategy}
                onSelect={() => handleSelectStrategy(strategy.id)}
                isActive={selectedStrategy === strategy.id}
              />
            ))}
          </View>

          {/* Activity Log */}
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Activity Log</Text>
            <ScrollView style={styles.logContainer} nestedScrollEnabled>
              {activityLog.map((log, index) => (
                <Text key={index} style={styles.logEntry}>{log}</Text>
              ))}
              {activityLog.length === 0 && (
                <Text style={styles.emptyLog}>No activity yet</Text>
              )}
            </ScrollView>
          </Card>
        </View>
      ) : (
        <View>
          {/* Positions Tab */}
          <PositionMonitor positions={positions} totalPnL={totalPnL} />

          {/* Position Actions */}
          {positions.filter(p => p.status === 'open').length > 0 && (
            <Card style={styles.card}>
              <Text style={styles.cardTitle}>Position Actions</Text>
              {positions.filter(p => p.status === 'open').map(position => (
                <View key={position.id} style={styles.positionAction}>
                  <Text style={styles.positionActionText}>
                    {position.strategyId.replace(/_/g, ' ').toUpperCase()}
                  </Text>
                  <Button
                    variant="outline"
                    onPress={() => handleClosePosition(position.id)}
                    style={{ paddingHorizontal: SPACING.md }}
                  >
                    <Text style={{ color: COLORS.primary, fontSize: FONT_SIZES.sm }}>Close</Text>
                  </Button>
                </View>
              ))}
            </Card>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: SPACING.lg },
  title: { fontSize: FONT_SIZES.xxl, fontWeight: 'bold', color: COLORS.text },
  subtitle: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 4 },
  tabs: { 
    flexDirection: 'row', 
    marginHorizontal: SPACING.lg, 
    marginBottom: SPACING.lg, 
    backgroundColor: COLORS.cardSecondary, 
    borderRadius: BORDER_RADIUS.md, 
    padding: 4 
  },
  tab: { flex: 1, paddingVertical: SPACING.sm, alignItems: 'center', borderRadius: BORDER_RADIUS.sm },
  tabActive: { backgroundColor: COLORS.card },
  tabText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, fontWeight: '500' },
  tabTextActive: { color: COLORS.primary, fontWeight: '600' },
  card: { marginHorizontal: SPACING.lg, marginBottom: SPACING.lg },
  cardTitle: { fontSize: FONT_SIZES.md, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.sm },
  statusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, marginBottom: SPACING.md },
  statItem: { flex: 1, minWidth: '45%', backgroundColor: COLORS.cardSecondary, padding: SPACING.md, borderRadius: BORDER_RADIUS.md },
  statLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginBottom: 4 },
  statValue: { fontSize: FONT_SIZES.lg, fontWeight: 'bold', color: COLORS.primary },
  policyBox: { backgroundColor: COLORS.cardSecondary, padding: SPACING.md, borderRadius: BORDER_RADIUS.md },
  policyRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.xs },
  policyLabel: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  policyValue: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.text },
  controls: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.sm },
  section: { marginHorizontal: SPACING.lg, marginBottom: SPACING.lg },
  sectionTitle: { fontSize: FONT_SIZES.lg, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.md },
  logContainer: { maxHeight: 200, backgroundColor: COLORS.cardSecondary, borderRadius: BORDER_RADIUS.md, padding: SPACING.sm },
  logEntry: { fontSize: FONT_SIZES.xs, color: COLORS.text, fontFamily: 'monospace', marginBottom: 4 },
  emptyLog: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, textAlign: 'center', padding: SPACING.md },
  positionAction: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder },
  positionActionText: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.text },
});
