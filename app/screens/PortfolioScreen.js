// screens/PortfolioScreen.js — lists completed tickets with share button
import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Share, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getTickets } from '../api/client';
import { useUser } from '../context/UserContext';
import Colors from '../constants/colors';

export default function PortfolioScreen() {
  const [done, setDone]       = useState([]);
  const [loading, setLoading] = useState(true);
  const { user }              = useUser();
  const router                = useRouter();

  useEffect(() => {
    async function load() {
      try {
        const data = await getTickets();
        // Only show tickets the user has completed (Done column)
        setDone(data.tickets.filter((t) => t.column_name === 'done'));
      } catch (err) {
        console.error(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Native share sheet — shares a plain-text summary
  async function handleShare() {
    const lines = done.map(
      (t) => `• ${t.id}: ${t.title}\n  Standard: ${t.standard}`
    );
    const message =
      `🔨 ${user?.name || 'Developer'}'s Learner's Forge Portfolio\n\n` +
      `Completed ${done.length} engineering ticket(s):\n\n` +
      lines.join('\n\n') +
      `\n\nBuilt with Learner's Forge — production-ready from day one.`;

    await Share.share({ message });
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.accent} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Back to board">
          <Text style={styles.backText}>← Board</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Portfolio</Text>
        {done.length > 0 && (
          <TouchableOpacity onPress={handleShare} accessibilityLabel="Share portfolio">
            <Text style={styles.shareText}>Share ↗</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Subtitle */}
      <Text style={styles.subtitle}>
        {user?.name ? `${user.name}'s completed tickets` : 'Completed tickets'}
      </Text>

      {done.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🏗️</Text>
          <Text style={styles.emptyTitle}>Nothing here yet</Text>
          <Text style={styles.emptyText}>
            Complete tickets on the Kanban board to build your portfolio.
          </Text>
          <TouchableOpacity style={styles.goBoard} onPress={() => router.back()}>
            <Text style={styles.goBoardText}>Go to Board →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={done}
          keyExtractor={(t) => t.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <PortfolioCard ticket={item} />}
        />
      )}
    </View>
  );
}

// Individual portfolio card
function PortfolioCard({ ticket }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.cardId}>{ticket.id}</Text>
        <Text style={styles.cardDone}>✅ Done</Text>
      </View>
      <Text style={styles.cardTitle}>{ticket.title}</Text>
      <View style={styles.cardBadge}>
        <Text style={styles.cardBadgeText}>🔒 {ticket.standard}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  center: {
    flex: 1,
    backgroundColor: Colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backText: {
    color: Colors.accent,
    fontSize: 15,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  shareText: {
    color: Colors.accent,
    fontSize: 15,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },
  list: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardId: {
    fontSize: 12,
    color: Colors.accent,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  cardDone: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginBottom: 8,
  },
  cardBadge: {
    backgroundColor: Colors.bg,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  cardBadgeText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  goBoard: {
    backgroundColor: Colors.accent,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  goBoardText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
});
