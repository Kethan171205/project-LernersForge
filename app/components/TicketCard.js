// components/TicketCard.js — Jira-style card shown on the Kanban board
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '../constants/colors';

// Maps priority string → colour dot
const PRIORITY_COLOR = {
  HIGH:   Colors.priorityHigh,
  MEDIUM: Colors.priorityMedium,
  LOW:    Colors.priorityLow,
};

export default function TicketCard({ ticket }) {
  const router = useRouter();

  // Tap → go to the ticket detail screen
  function openTicket() {
    router.push(`/ticket/${ticket.id}`);
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={openTicket}
      activeOpacity={0.75}
      accessibilityLabel={`Open ticket ${ticket.id}`}
    >
      {/* Top row: ticket ID + priority dot */}
      <View style={styles.topRow}>
        <Text style={styles.ticketId}>{ticket.id}</Text>
        <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLOR[ticket.priority] }]} />
      </View>

      {/* Title */}
      <Text style={styles.title} numberOfLines={2}>{ticket.title}</Text>

      {/* Bottom row: standard badge */}
      <View style={styles.bottomRow}>
        <Text style={styles.standard} numberOfLines={1}>
          🔒 {ticket.standard}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    marginBottom: 8,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  ticketId: {
    fontSize: 11,
    color: Colors.accent,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  title: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
    lineHeight: 20,
    marginBottom: 8,
  },
  bottomRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 8,
  },
  standard: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
});
