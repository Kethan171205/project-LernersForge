// screens/TicketScreen.js — ticket detail with code editor + submit
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getTicket, moveTicket, submitCode, getMentorHint } from '../api/client';
import { useUser } from '../context/UserContext';
import Colors from '../constants/colors';

const PRIORITY_COLOR = {
  HIGH:   Colors.priorityHigh,
  MEDIUM: Colors.priorityMedium,
  LOW:    Colors.priorityLow,
};

export default function TicketScreen() {
  const { id }            = useLocalSearchParams();      // ticket ID from the URL
  const { user }          = useUser();
  const router            = useRouter();

  const [ticket, setTicket]     = useState(null);
  const [code, setCode]         = useState('');
  const [loading, setLoading]   = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // AI mentor panel state
  const [hint, setHint]         = useState('');
  const [hintVisible, setHintVisible] = useState(false);

  // Pipeline result state
  const [pipelineResult, setPipelineResult] = useState(null); // { status, errors }

  // Load ticket on mount
  useEffect(() => {
    async function load() {
      try {
        const data = await getTicket(id);
        setTicket(data.ticket);
        setCode(data.ticket.starter_code); // pre-fill the editor
      } catch (err) {
        Alert.alert('Error', err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  // "Start Task" — moves ticket from Todo → In Progress
  async function handleStart() {
    try {
      await moveTicket(id, 'inprogress');
      setTicket((t) => ({ ...t, column_name: 'inprogress' }));
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  }

  // "Submit PR" — runs the CI/CD pipeline
  async function handleSubmit() {
    if (!code.trim()) {
      Alert.alert('Empty code', 'Write some code before submitting.');
      return;
    }
    setSubmitting(true);
    setPipelineResult(null);
    setHint('');
    setHintVisible(false);

    try {
      const result = await submitCode(id, code, user?.id);
      setPipelineResult(result);

      if (result.status === 'pass') {
        // Move to Done
        await moveTicket(id, 'done');
        setTicket((t) => ({ ...t, column_name: 'done' }));
        Alert.alert('✅ Pipeline passed!', 'Ticket moved to Done. Great work!');
      } else {
        // Move to Review and fetch AI hint
        await moveTicket(id, 'review');
        setTicket((t) => ({ ...t, column_name: 'review' }));
        fetchHint(result.errors || []);
      }
    } catch (err) {
      Alert.alert('Submission error', err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // Ask the AI mentor for a hint
  async function fetchHint(errors) {
    try {
      const data = await getMentorHint(id, code, errors);
      setHint(data.hint || 'Keep going — you\'re close!');
    } catch {
      setHint('AI Mentor is unavailable right now. Re-read the acceptance criteria carefully!');
    }
    setHintVisible(true);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.accent} size="large" />
      </View>
    );
  }

  const isDone       = ticket?.column_name === 'done';
  const isInProgress = ticket?.column_name === 'inprogress';
  const canStart     = ticket?.column_name === 'todo';

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {/* Back nav */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} accessibilityLabel="Back">
        <Text style={styles.backText}>← Board</Text>
      </TouchableOpacity>

      {/* Ticket header */}
      <View style={styles.card}>
        <View style={styles.cardTopRow}>
          <Text style={styles.ticketId}>{ticket.id}</Text>
          <Text style={[styles.priorityBadge, { color: PRIORITY_COLOR[ticket.priority] }]}>
            ● {ticket.priority}
          </Text>
        </View>
        <Text style={styles.ticketTitle}>{ticket.title}</Text>
        <Text style={styles.standard}>🔒 {ticket.standard}</Text>

        {/* Status chip */}
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Status: </Text>
          <Text style={styles.statusValue}>{ticket.column_name.toUpperCase()}</Text>
        </View>
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{ticket.description}</Text>
      </View>

      {/* Code editor */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Code Editor</Text>
        <TextInput
          style={styles.editor}
          value={code}
          onChangeText={setCode}
          multiline
          scrollEnabled
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          editable={!isDone}
          accessibilityLabel="Code editor"
        />
      </View>

      {/* Pipeline result */}
      {pipelineResult && (
        <View style={[
          styles.pipelineBox,
          pipelineResult.status === 'pass' ? styles.pipelinePass : styles.pipelineFail,
        ]}>
          <Text style={styles.pipelineStatus}>
            {pipelineResult.status === 'pass' ? '✅ Pipeline Passed' : '❌ Pipeline Failed'}
          </Text>
          {pipelineResult.errors?.map((e, i) => (
            <Text key={i} style={styles.pipelineError}>• {e}</Text>
          ))}
          {pipelineResult.standard && (
            <Text style={styles.pipelineStandard}>Standard: {pipelineResult.standard}</Text>
          )}
        </View>
      )}

      {/* AI Mentor hint (collapsible) */}
      {hint !== '' && (
        <TouchableOpacity
          style={styles.hintToggle}
          onPress={() => setHintVisible((v) => !v)}
          accessibilityLabel="Toggle AI mentor hint"
        >
          <Text style={styles.hintToggleText}>
            🤖 AI Senior Dev {hintVisible ? '▲' : '▼'}
          </Text>
        </TouchableOpacity>
      )}
      {hintVisible && hint !== '' && (
        <View style={styles.hintBox}>
          <Text style={styles.hintText}>{hint}</Text>
        </View>
      )}

      {/* Action buttons */}
      <View style={styles.actions}>
        {canStart && (
          <TouchableOpacity style={styles.btnSecondary} onPress={handleStart} accessibilityLabel="Start task">
            <Text style={styles.btnSecondaryText}>▶ Start Task</Text>
          </TouchableOpacity>
        )}

        {!isDone && (
          <TouchableOpacity
            style={[styles.btnPrimary, submitting && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
            accessibilityLabel="Submit PR"
          >
            {submitting
              ? <ActivityIndicator color={Colors.white} />
              : <Text style={styles.btnPrimaryText}>🚀 Submit PR</Text>
            }
          </TouchableOpacity>
        )}

        {isDone && (
          <View style={styles.doneBox}>
            <Text style={styles.doneText}>✅ Ticket completed!</Text>
          </View>
        )}
      </View>
    </ScrollView>
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
  backBtn: {
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 8,
  },
  backText: {
    color: Colors.accent,
    fontSize: 15,
    fontWeight: '600',
  },
  card: {
    margin: 16,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  ticketId: {
    fontSize: 12,
    color: Colors.accent,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  priorityBadge: {
    fontSize: 12,
    fontWeight: '700',
  },
  ticketTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  standard: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  statusLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  statusValue: {
    fontSize: 12,
    color: Colors.accent,
    fontWeight: '700',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  description: {
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 22,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  editor: {
    backgroundColor: '#010409',  // near-black, like VS Code
    color: '#e6edf3',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 13,
    lineHeight: 20,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 220,
    textAlignVertical: 'top',    // Android: start text at top
  },
  pipelineBox: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
  },
  pipelinePass: {
    backgroundColor: '#0f3323',
    borderColor: Colors.success,
  },
  pipelineFail: {
    backgroundColor: '#2d0f0f',
    borderColor: Colors.error,
  },
  pipelineStatus: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  pipelineError: {
    fontSize: 13,
    color: Colors.error,
    lineHeight: 20,
  },
  pipelineStandard: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 6,
    fontStyle: 'italic',
  },
  hintToggle: {
    marginHorizontal: 16,
    marginBottom: 4,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  hintToggleText: {
    color: Colors.accent,
    fontWeight: '600',
    fontSize: 14,
  },
  hintBox: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#161b22',
    borderRadius: 8,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  hintText: {
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 40,
  },
  btnPrimary: {
    flex: 1,
    backgroundColor: Colors.accent,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnPrimaryText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  btnSecondary: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  btnSecondaryText: {
    color: Colors.accent,
    fontSize: 15,
    fontWeight: '700',
  },
  doneBox: {
    flex: 1,
    backgroundColor: Colors.colDone,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  doneText: {
    color: Colors.success,
    fontSize: 15,
    fontWeight: '700',
  },
});
