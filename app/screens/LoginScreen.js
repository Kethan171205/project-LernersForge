// screens/LoginScreen.js — name + email login, no passwords
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { login } from '../api/client';
import { useUser } from '../context/UserContext';
import Colors from '../constants/colors';

export default function LoginScreen() {
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser }           = useUser();
  const router                = useRouter();

  async function handleLogin() {
    // Simple client-side check before hitting the network
    if (!name.trim() || !email.trim()) {
      Alert.alert('Missing info', 'Please enter both your name and email.');
      return;
    }

    setLoading(true);
    try {
      const data = await login(name.trim(), email.trim());
      setUser(data.user);          // save in context
      router.replace('/kanban');   // go to the board
    } catch (err) {
      Alert.alert('Login failed', err.message || 'Could not reach the server.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Logo / title area */}
      <View style={styles.header}>
        <Text style={styles.logo}>⚡</Text>
        <Text style={styles.title}>Learner's Forge</Text>
        <Text style={styles.subtitle}>
          Your mock-startup engineering simulator
        </Text>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Arjun Sharma"
          placeholderTextColor={Colors.textMuted}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          returnKeyType="next"
          accessibilityLabel="Name input"
        />

        <Text style={styles.label}>Work Email</Text>
        <TextInput
          style={styles.input}
          placeholder="arjun@startup.dev"
          placeholderTextColor={Colors.textMuted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          returnKeyType="done"
          onSubmitEditing={handleLogin}
          accessibilityLabel="Email input"
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
          accessibilityLabel="Login button"
        >
          {loading
            ? <ActivityIndicator color={Colors.white} />
            : <Text style={styles.buttonText}>Start Engineering →</Text>
          }
        </TouchableOpacity>
      </View>

      <Text style={styles.disclaimer}>
        No password required. Your code runs on our server, not your device.
      </Text>

      {/* Privacy Policy link — required by App Store */}
      <TouchableOpacity
        style={styles.privacyBtn}
        onPress={() => router.push('/privacy')}
        accessibilityLabel="Privacy Policy"
      >
        <Text style={styles.privacyLink}>Privacy Policy</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 52,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
  form: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 20,
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    backgroundColor: Colors.bg,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 16,
  },
  button: {
    backgroundColor: Colors.accent,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  disclaimer: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 4,
  },
  privacyBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  privacyLink: {
    fontSize: 12,
    color: Colors.accent,
    textDecorationLine: 'underline',
  },
});
