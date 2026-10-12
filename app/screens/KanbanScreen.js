// screens/KanbanScreen.js — horizontal swipeable Kanban board
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, FlatList,
  StyleSheet, ActivityIndicator, RefreshControl,
  TouchableOpacity, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getTickets } from '../api/client';
import TicketCard from '../components/TicketCard';
import Colors from '../constants/colors';

const SCREEN_W = Dimensions.get('window').width;
const COLUMN_W = SCREEN_W * 0.78; // each column is 78% of screen width

// Column config: key matches `column_name` in DB
const COLUMNS = [
  { key: 'todo',       label: '📋 To Do',      color: Colors.colTodo       },
  { key: 'inprogress', label: '🔧 In Progress', color: Colors.colInProgress },
  { key: 'review',     label: '🔍 Review',      color: Colors.colReview     },
  { key: 'done',       label: '✅ Done',        color: Colors.colDone       },
];

export default function KanbanScreen() {
  const [tickets, setTickets]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const load = useCallback(async () => {
    try {
      const data = await getTickets();
      setTickets(data.tickets);
    } catch (err) {
      console.error('Failed to load tickets:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function onRefresh() {
    setRefreshing(true);
    load();
  }

  // Filter tickets belonging to a column
  function ticketsForColumn(colKey) {
    return tickets.filter((t) => t.column_name === colKey);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={styles.loadingText}>Loading board…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Page header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>⚡ Learner's Forge</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => router.push('/portfolio')} accessibilityLabel="Portfolio">
            <Text style={styles.portfolioLink}>Portfolio →</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Horizontally scrollable columns */}
      <ScrollView
        horizontal
        pagingEnabled={false}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.boardContainer}
        refreshControl={
          // Pull-to-refresh only works on vertical scrolls, so we put it on an inner view
          undefined
        }
      >
        {COLUMNS.map((col) => {
          const colTickets = ticketsForColumn(col.key);
          return (
            <View key={col.key} style={[styles.column, { width: COLUMN_W }]}>
              {/* Column header */}
              <View style={[styles.columnHeader, { backgroundColor: col.color }]}>
                <Text style={styles.columnLabel}>{col.label}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{colTickets.length}</Text>
                </View>
              </View>

              {/* Ticket list */}
              <FlatList
                data={colTickets}
                keyExtractor={(t) => t.id}
                renderItem={({ item }) => <TicketCard ticket={item} />}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor={Colors.accent}
                  />
                }
                ListEmptyComponent={
                  <Text style={styles.emptyText}>No tickets here</Text>
                }
                contentContainerStyle={styles.listContent}
              />
            </View>
          );
        })}
      </ScrollView>
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
  loadingText: {
    color: Colors.textSecondary,
    marginTop: 12,
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  portfolioLink: {
    fontSize: 14,
    color: Colors.accent,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  boardContainer: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 12,
  },
  column: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginRight: 0,
    maxHeight: '100%',
  },
  columnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  columnLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  badge: {
    backgroundColor: Colors.bg,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  listContent: {
    padding: 8,
    paddingBottom: 20,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
});
