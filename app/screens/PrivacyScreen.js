// screens/PrivacyScreen.js — required by App Store guidelines
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { deleteAccount } from '../api/client';
import { useUser } from '../context/UserContext';
import Colors from '../constants/colors';

export default function PrivacyScreen() {
  const router      = useRouter();
  const { user, setUser } = useUser();

  // Apple requires apps with accounts to have a "Delete my account" flow
  async function handleDeleteAccount() {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your submissions. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount(user.id);
              setUser(null);
              router.replace('/');  // back to login
            } catch (err) {
              Alert.alert('Error', err.message || 'Could not delete account.');
            }
          },
        },
      ]
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} accessibilityLabel="Back">
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Privacy Policy</Text>
      <Text style={styles.date}>Effective: October 2024</Text>

      <Section title="What we collect">
        We collect your name and email address so you can log in and track your progress across sessions.
        We also store the code you submit so the automated pipeline can run tests and return results.
      </Section>

      <Section title="How we use it">
        Your data is used solely to operate Learner's Forge — running tests, saving your progress,
        and generating your portfolio. We do NOT use your code submissions to train any public AI
        or language model. Your code is sent to our secure server, evaluated, and discarded from
        memory after the session.
      </Section>

      <Section title="AI Mentor">
        When you fail a pipeline run, your code snippet and the error message are sent to the
        Google Gemini API to generate a hint. Google's API is used under their standard terms.
        No data is retained by Google for training purposes under the default API settings.
      </Section>

      <Section title="Data storage">
        Your name, email, and submission history are stored in a secure server-side SQLite database.
        We do not sell or share your personal data with third parties.
      </Section>

      <Section title="Data deletion">
        You can delete your account and all associated data at any time using the button below.
      </Section>

      <Section title="Contact">
        Questions? Reach us at: privacy@learnersforge.dev
      </Section>

      {/* App Store requires this button when the app has user accounts */}
      {user && (
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={handleDeleteAccount}
          accessibilityLabel="Delete my account"
        >
          <Text style={styles.deleteBtnText}>🗑 Delete My Account</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

// Simple section component to keep JSX clean
function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionBody}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 50,
  },
  backBtn: {
    paddingTop: 56,
    paddingBottom: 12,
  },
  backText: {
    color: Colors.accent,
    fontSize: 15,
    fontWeight: '600',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  date: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.accent,
    marginBottom: 6,
  },
  sectionBody: {
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  deleteBtn: {
    marginTop: 16,
    backgroundColor: '#2d0f0f',
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  deleteBtnText: {
    color: Colors.error,
    fontWeight: '700',
    fontSize: 15,
  },
});
