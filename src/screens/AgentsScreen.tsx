import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { StrategyCard } from '../components/StrategyCard';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { PremiumContentScreen } from './PremiumContentScreen';
import { defiStrategyService, Strategy } from '../services/defiStrategyService';
import { initializeAgent, getAgentInstance } from '../services/hederaAgentService';
import { useHederaAgent } from '../hooks/useHederaAgent';

interface AgentsScreenProps {
  walletAddress?: string;
  creditLimit?: number;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export const AgentsScreen = ({ walletAddress, creditLimit = 500 }: AgentsScreenProps) => {
  const [activeTab, setActiveTab] = useState<'agent' | 'strategies' | 'chat' | 'premium'>('agent');
  const [agentState, setAgentState] = useState<any>(null);
  const [countdown, setCountdown] = useState(60);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [activityLog, setActivityLog] = useState<string[]>([]);
  const [autoTradeEnabled, setAutoTradeEnabled] = useState(false);
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatScrollRef = useRef<ScrollView>(null);
  
  const autoTradeInterval = useRef<NodeJS.Timeout | null>(null);
  const { sendChatMessage, clearChat } = useHederaAgent();

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

  // Scroll to bottom when new chat messages arrive
  useEffect(() => {
    if (chatMessages.length > 0) {
      setTimeout(() => {
        chatScrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [chatMessages]);

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

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return;
    
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: chatInput.trim(),
      timestamp: Date.now(),
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsChatLoading(true);
    
    try {
      const response = await sendChatMessage(userMessage.content, walletAddress || 'default');
      
      if (response.success) {
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.data.message,
          timestamp: Date.now(),
        };
        
        setChatMessages(prev => [...prev, assistantMessage]);
        
        // Scroll to bottom
        setTimeout(() => {
          chatScrollRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        Alert.alert('Error', response.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Chat error:', error);
      Alert.alert('Error', 'Failed to communicate with agent');
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleClearChat = async () => {
    Alert.alert(
      'Clear Chat',
      'Are you sure you want to clear the conversation history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearChat(walletAddress || 'default');
            setChatMessages([]);
          },
        },
      ]
    );
  };

  const addLog = (message: string) => {
    setActivityLog(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev.slice(0, 19)]);
  };

  const executeMicropayment = () => {
    console.log('✅ Micropayment executed: $0.001 USDT');
    if (agentState) {
      addLog('💰 Micropayment: $0.001 USDT');
    }
  };

  const scanAndExecute = async () => {
    if (!selectedStrategy || isScanning) return;
    
    setIsScanning(true);
    addLog(`🔍 Scanning market for ${selectedStrategy}...`);

    try {
      const opportunity = await defiStrategyService.scanMarket(selectedStrategy);
      
      if (!opportunity) {
        addLog('⚠️ No opportunities found');
        setIsScanning(false);
        return;
      }

      addLog(`✅ Opportunity found: ${JSON.stringify(opportunity.opportunity)}`);

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

      const result = await agent.executeTrade(decision);
      
      if (result.success) {
        addLog(`✅ Trade executed: $${decision.amount}`);
        addLog(`💰 Expected return: ${decision.expectedReturn.toFixed(2)}%`);
        
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

  const handleSelectStrategy = (strategyId: string) => {
    setSelectedStrategy(strategyId);
    addLog(`✅ Selected strategy: ${strategyId.replace(/_/g, ' ')}`);
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
            
            const agent = getAgentInstance();
            if (agent) {
              await agent.emergencyStop();
            }
            
            addLog('🚨 EMERGENCY STOP - Auto-trading stopped');
            Alert.alert('✅ Emergency Stop Complete', 'All positions have been closed');
          },
        },
      ]
    );
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
        <Text style={styles.title}>🏦 Treasury Smart Wallet</Text>
        <Text style={styles.subtitle}>AI Agent with x402 Protocol</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={activeTab === 'agent' ? {...styles.tab, ...styles.tabActive} : styles.tab}
          onPress={() => setActiveTab('agent')}
        >
          <Text style={activeTab === 'agent' ? {...styles.tabText, ...styles.tabTextActive} : styles.tabText}>
            Agent
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={activeTab === 'strategies' ? {...styles.tab, ...styles.tabActive} : styles.tab}
          onPress={() => setActiveTab('strategies')}
        >
          <Text style={activeTab === 'strategies' ? {...styles.tabText, ...styles.tabTextActive} : styles.tabText}>
            Strategies
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={activeTab === 'chat' ? {...styles.tab, ...styles.tabActive} : styles.tab}
          onPress={() => setActiveTab('chat')}
        >
          <Text style={activeTab === 'chat' ? {...styles.tabText, ...styles.tabTextActive} : styles.tabText}>
            Chat
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
      ) : activeTab === 'agent' ? (
        <View>
          {/* Countdown */}
          <Card style={styles.card}>
            <View style={styles.row}>
              <Ionicons name="time" size={20} color={COLORS.primary} />
              <Text style={styles.label}>Next Check:</Text>
              <Text style={styles.value}>{countdown}s</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={{...styles.progress, width: `${(countdown / 60) * 100}%`}} />
            </View>
            <Text style={styles.note}>Micropayment: $0.001 USDT/min (x402)</Text>
          </Card>

          {/* Agent Status */}
          {agentState && (
            <Card style={styles.card}>
              <View style={styles.statusHeader}>
                <Text style={styles.cardTitle}>Agent Status</Text>
                <Badge variant={autoTradeEnabled ? 'success' : 'default'}>
                  {autoTradeEnabled ? 'AUTO' : 'MANUAL'}
                </Badge>
              </View>
              
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Address:</Text>
                <Text style={styles.statValue}>{agentState.address.substring(0, 12)}...</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Credit Allocated:</Text>
                <Text style={styles.statValue}>${agentState.creditAllocated}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Credit Used:</Text>
                <Text style={styles.statValue}>${agentState.creditUsed}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Reputation:</Text>
                <Text style={{...styles.statValue, color: COLORS.success}}>
                  {agentState.reputation}/100
                </Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Tier:</Text>
                <Text style={styles.statValue}>{agentState.tier}</Text>
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

          {/* Info */}
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>How It Works</Text>
            <Text style={styles.info}>
              • AI-powered market analysis{'\n'}
              • Autonomous strategy execution{'\n'}
              • Real-time P&L tracking{'\n'}
              • Policy-enforced risk limits{'\n'}
              • Emergency stop protection
            </Text>
          </Card>
        </View>
      ) : activeTab === 'strategies' ? (
        <View>
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
        </View>
      ) : activeTab === 'chat' ? (
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.chatContainer}>
            {/* Chat Header */}
            <Card style={styles.chatHeader}>
              <View style={styles.chatHeaderContent}>
                <View style={styles.chatHeaderLeft}>
                  <Ionicons name="chatbubbles" size={24} color={COLORS.primary} />
                  <Text style={styles.chatHeaderTitle}>AI DeFi Agent</Text>
                </View>
                <TouchableOpacity onPress={handleClearChat}>
                  <Ionicons name="trash-outline" size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
            </Card>

            {/* Chat Messages */}
            <ScrollView 
              ref={chatScrollRef}
              style={styles.chatMessages}
              contentContainerStyle={styles.chatMessagesContent}
            >
              {chatMessages.length === 0 ? (
                <View style={styles.chatEmpty}>
                  <Ionicons name="chatbubble-ellipses-outline" size={48} color={COLORS.textSecondary} />
                  <Text style={styles.chatEmptyTitle}>Start a conversation</Text>
                  <Text style={styles.chatEmptyText}>
                    Ask me about your balance, trading strategies, or execute transactions!
                  </Text>
                  <View style={styles.chatSuggestions}>
                    <TouchableOpacity 
                      style={styles.chatSuggestion}
                      onPress={() => setChatInput("What's my HBAR balance?")}
                    >
                      <Text style={styles.chatSuggestionText}>💰 Check balance</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.chatSuggestion}
                      onPress={() => setChatInput("Analyze arbitrage opportunities")}
                    >
                      <Text style={styles.chatSuggestionText}>📊 Analyze opportunities</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.chatSuggestion}
                      onPress={() => setChatInput("Explain delta-neutral strategy")}
                    >
                      <Text style={styles.chatSuggestionText}>📚 Learn strategies</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                chatMessages.map((msg) => (
                  <View 
                    key={msg.id}
                    style={msg.role === 'user' ? styles.chatMessageUser : styles.chatMessageAssistant}
                  >
                    <View style={msg.role === 'user' ? styles.chatBubbleUser : styles.chatBubbleAssistant}>
                      <Text style={msg.role === 'user' ? styles.chatTextUser : styles.chatTextAssistant}>
                        {msg.content}
                      </Text>
                    </View>
                  </View>
                ))
              )}
              {isChatLoading && (
                <View style={styles.chatMessageAssistant}>
                  <View style={styles.chatBubbleAssistant}>
                    <ActivityIndicator color={COLORS.text} size="small" />
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Chat Input */}
            <View style={styles.chatInputContainer}>
              <TextInput
                style={styles.chatInput}
                value={chatInput}
                onChangeText={setChatInput}
                placeholder="Ask me anything..."
                placeholderTextColor={COLORS.textSecondary}
                multiline
                maxLength={500}
                editable={!isChatLoading}
              />
              <TouchableOpacity 
                style={[styles.chatSendButton, (!chatInput.trim() || isChatLoading) && styles.chatSendButtonDisabled]}
                onPress={handleSendMessage}
                disabled={!chatInput.trim() || isChatLoading}
              >
                <Ionicons 
                  name="send" 
                  size={20} 
                  color={chatInput.trim() && !isChatLoading ? COLORS.text : COLORS.textSecondary} 
                />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: SPACING.lg },
  title: { fontSize: FONT_SIZES.xxl, fontWeight: 'bold', color: COLORS.text },
  subtitle: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 4 },
  tabs: { flexDirection: 'row', marginHorizontal: SPACING.lg, marginBottom: SPACING.lg, backgroundColor: COLORS.cardSecondary, borderRadius: BORDER_RADIUS.md, padding: 4 },
  tab: { flex: 1, paddingVertical: SPACING.sm, alignItems: 'center', borderRadius: BORDER_RADIUS.sm },
  tabActive: { backgroundColor: COLORS.card },
  tabText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, fontWeight: '500' },
  tabTextActive: { color: COLORS.primary, fontWeight: '600' },
  card: { marginHorizontal: SPACING.lg, marginBottom: SPACING.lg },
  cardTitle: { fontSize: FONT_SIZES.md, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.sm },
  statusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  label: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  value: { fontSize: FONT_SIZES.lg, fontWeight: 'bold', color: COLORS.primary, marginLeft: 'auto' },
  progressBar: { height: 6, backgroundColor: `${COLORS.primary}20`, borderRadius: 3, overflow: 'hidden', marginBottom: SPACING.sm },
  progress: { height: '100%', backgroundColor: COLORS.primary },
  note: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, textAlign: 'center' },
  stat: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.xs },
  statLabel: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  statValue: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.text },
  policyBox: { backgroundColor: COLORS.cardSecondary, padding: SPACING.md, borderRadius: BORDER_RADIUS.md, marginTop: SPACING.md },
  policyRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.xs },
  policyLabel: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  policyValue: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.text },
  controls: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.sm },
  logContainer: { maxHeight: 200, backgroundColor: COLORS.cardSecondary, borderRadius: BORDER_RADIUS.md, padding: SPACING.sm },
  logEntry: { fontSize: FONT_SIZES.xs, color: COLORS.text, fontFamily: 'monospace', marginBottom: 4 },
  emptyLog: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, textAlign: 'center', padding: SPACING.md },
  section: { marginHorizontal: SPACING.lg, marginBottom: SPACING.lg },
  sectionTitle: { fontSize: FONT_SIZES.lg, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.md },
  actions: { flexDirection: 'row', gap: SPACING.md, marginHorizontal: SPACING.lg, marginBottom: SPACING.lg },
  warning: { fontSize: FONT_SIZES.xs, color: COLORS.warning, marginTop: SPACING.xs },
  info: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, lineHeight: 20 },
  
  // Chat styles
  chatContainer: { flex: 1, marginHorizontal: SPACING.lg },
  chatHeader: { marginBottom: SPACING.md },
  chatHeaderContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chatHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  chatHeaderTitle: { fontSize: FONT_SIZES.lg, fontWeight: 'bold', color: COLORS.text },
  chatMessages: { flex: 1, marginBottom: SPACING.md },
  chatMessagesContent: { paddingVertical: SPACING.md },
  chatEmpty: { alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  chatEmptyTitle: { fontSize: FONT_SIZES.lg, fontWeight: 'bold', color: COLORS.text, marginTop: SPACING.md },
  chatEmptyText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.sm, marginBottom: SPACING.lg },
  chatSuggestions: { gap: SPACING.sm, width: '100%' },
  chatSuggestion: { backgroundColor: COLORS.cardSecondary, padding: SPACING.md, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.cardBorder },
  chatSuggestionText: { fontSize: FONT_SIZES.sm, color: COLORS.text, textAlign: 'center' },
  chatMessageUser: { alignItems: 'flex-end', marginBottom: SPACING.md },
  chatMessageAssistant: { alignItems: 'flex-start', marginBottom: SPACING.md },
  chatBubbleUser: { backgroundColor: COLORS.primary, padding: SPACING.md, borderRadius: BORDER_RADIUS.lg, maxWidth: '80%' },
  chatBubbleAssistant: { backgroundColor: COLORS.cardSecondary, padding: SPACING.md, borderRadius: BORDER_RADIUS.lg, maxWidth: '80%' },
  chatTextUser: { fontSize: FONT_SIZES.sm, color: COLORS.text },
  chatTextAssistant: { fontSize: FONT_SIZES.sm, color: COLORS.text },
  chatInputContainer: { flexDirection: 'row', alignItems: 'flex-end', gap: SPACING.sm, paddingBottom: SPACING.md },
  chatInput: { flex: 1, backgroundColor: COLORS.cardSecondary, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, fontSize: FONT_SIZES.sm, color: COLORS.text, maxHeight: 100 },
  chatSendButton: { backgroundColor: COLORS.primary, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  chatSendButtonDisabled: { backgroundColor: COLORS.cardSecondary },
});
