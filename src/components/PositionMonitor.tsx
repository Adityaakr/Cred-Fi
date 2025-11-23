import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from './Card';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../theme/colors';
import { Position } from '../services/defiStrategyService';

interface PositionMonitorProps {
  positions: Position[];
  totalPnL: { total: number; open: number; closed: number };
}

export const PositionMonitor: React.FC<PositionMonitorProps> = ({ positions, totalPnL }) => {
  const openPositions = positions.filter(p => p.status === 'open');

  const formatPnL = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}$${value.toFixed(2)}`;
  };

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const getPnLColor = (value: number) => {
    return value >= 0 ? COLORS.success : COLORS.error;
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Active Positions</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{openPositions.length}</Text>
        </View>
      </View>

      {/* Total P&L Summary */}
      <View style={styles.pnlSummary}>
        <View style={styles.pnlItem}>
          <Text style={styles.pnlLabel}>Total P&L</Text>
          <Text style={[styles.pnlValue, { color: getPnLColor(totalPnL.total) }]}>
            {formatPnL(totalPnL.total)}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.pnlItem}>
          <Text style={styles.pnlLabel}>Open</Text>
          <Text style={[styles.pnlValue, { color: getPnLColor(totalPnL.open) }]}>
            {formatPnL(totalPnL.open)}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.pnlItem}>
          <Text style={styles.pnlLabel}>Closed</Text>
          <Text style={[styles.pnlValue, { color: getPnLColor(totalPnL.closed) }]}>
            {formatPnL(totalPnL.closed)}
          </Text>
        </View>
      </View>

      {/* Position List */}
      {openPositions.length > 0 ? (
        <ScrollView style={styles.positionList} showsVerticalScrollIndicator={false}>
          {openPositions.map((position) => (
            <View key={position.id} style={styles.positionCard}>
              <View style={styles.positionHeader}>
                <View style={styles.positionInfo}>
                  <Text style={styles.positionStrategy}>
                    {position.strategyId.replace(/_/g, ' ').toUpperCase()}
                  </Text>
                  <Text style={styles.positionAmount}>${position.amount.toFixed(2)}</Text>
                </View>
                <View style={styles.positionPnL}>
                  <Text style={[styles.pnlAmount, { color: getPnLColor(position.pnl) }]}>
                    {formatPnL(position.pnl)}
                  </Text>
                  <Text style={[styles.pnlPercent, { color: getPnLColor(position.pnlPercent) }]}>
                    {formatPercent(position.pnlPercent)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.positionDetails}>
                <View style={styles.detail}>
                  <Text style={styles.detailLabel}>Entry</Text>
                  <Text style={styles.detailValue}>${position.entryPrice.toFixed(4)}</Text>
                </View>
                <View style={styles.detail}>
                  <Text style={styles.detailLabel}>Current</Text>
                  <Text style={styles.detailValue}>${position.currentPrice.toFixed(4)}</Text>
                </View>
                <View style={styles.detail}>
                  <Text style={styles.detailLabel}>Duration</Text>
                  <Text style={styles.detailValue}>
                    {Math.floor((Date.now() - position.openedAt) / 60000)}m
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="briefcase-outline" size={48} color={COLORS.textSecondary} />
          <Text style={styles.emptyText}>No active positions</Text>
          <Text style={styles.emptySubtext}>Select a strategy to start trading</Text>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  badge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  badgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.text,
  },
  pnlSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.cardSecondary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
  },
  pnlItem: {
    flex: 1,
    alignItems: 'center',
  },
  pnlLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  pnlValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.cardBorder,
  },
  positionList: {
    maxHeight: 300,
  },
  positionCard: {
    backgroundColor: COLORS.cardSecondary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  positionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  positionInfo: {
    flex: 1,
  },
  positionStrategy: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: 2,
  },
  positionAmount: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  positionPnL: {
    alignItems: 'flex-end',
  },
  pnlAmount: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
  },
  pnlPercent: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  positionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  detail: {
    flex: 1,
  },
  detailLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  emptySubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
});
