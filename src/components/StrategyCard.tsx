import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from './Card';
import { Badge } from './Badge';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../theme/colors';
import { Strategy } from '../services/defiStrategyService';

interface StrategyCardProps {
  strategy: Strategy;
  onSelect: () => void;
  isActive?: boolean;
}

export const StrategyCard: React.FC<StrategyCardProps> = ({ strategy, onSelect, isActive = false }) => {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return COLORS.success;
      case 'medium': return COLORS.warning;
      case 'high': return COLORS.error;
      default: return COLORS.textSecondary;
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'low': return 'shield-checkmark';
      case 'medium': return 'warning';
      case 'high': return 'alert-circle';
      default: return 'help-circle';
    }
  };

  return (
    <TouchableOpacity onPress={onSelect} activeOpacity={0.7}>
      <Card style={isActive ? {...styles.card, ...styles.cardActive} : styles.card}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.name}>{strategy.name}</Text>
            {isActive && (
              <Badge variant="success">
                ACTIVE
              </Badge>
            )}
          </View>
          
          <View style={styles.riskBadge}>
            <Ionicons 
              name={getRiskIcon(strategy.riskLevel) as any} 
              size={14} 
              color={getRiskColor(strategy.riskLevel)} 
            />
            <Text style={[styles.riskText, { color: getRiskColor(strategy.riskLevel) }]}>
              {strategy.riskLevel.toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={styles.description}>{strategy.description}</Text>

        <View style={styles.metrics}>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Target APY</Text>
            <Text style={styles.metricValue}>{strategy.targetAPY.toFixed(1)}%</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Min Amount</Text>
            <Text style={styles.metricValue}>${strategy.minAmount}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Max Amount</Text>
            <Text style={styles.metricValue}>${strategy.maxAmount}</Text>
          </View>
        </View>

        {!strategy.active && (
          <View style={styles.inactiveBanner}>
            <Ionicons name="pause-circle" size={16} color={COLORS.textSecondary} />
            <Text style={styles.inactiveText}>Strategy Paused</Text>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: SPACING.md,
  },
  cardActive: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  header: {
    marginBottom: SPACING.sm,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  name: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    backgroundColor: COLORS.cardSecondary,
    borderRadius: BORDER_RADIUS.sm,
  },
  riskText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  description: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
  metrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metric: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.primary,
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.cardSecondary,
  },
  inactiveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardSecondary,
  },
  inactiveText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
});
