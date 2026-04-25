import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Screen } from '@/components/Screen';
import { api } from '@/lib/api';
import { colors, spacing, text } from '@/theme';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!email.includes('@')) {
      setError('Please enter a valid email.');
      return;
    }
    setSubmitting(true);
    try {
      await api.forgotPassword(email.trim().toLowerCase());
      setSent(true);
    } catch {
      // Mirror the server's anti-enumeration behavior: show the same
      // success message regardless of whether the email exists.
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <Screen scroll>
        <View style={styles.header}>
          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.subtitle}>
            If an account with {email} exists, we've sent password reset instructions.
            The link expires in 1 hour.
          </Text>
        </View>
        <Button
          title="Enter reset code"
          variant="outline"
          fullWidth
          onPress={() => router.push('/(auth)/reset-password')}
        />
        <View style={{ height: spacing[3] }} />
        <Button title="Back to login" fullWidth onPress={() => router.replace('/(auth)/login')} />
      </Screen>
    );
  }

  return (
    <Screen scroll keyboardAware>
      <View style={styles.header}>
        <Text style={styles.title}>Reset password</Text>
        <Text style={styles.subtitle}>
          Enter your email and we'll send you a reset link.
        </Text>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <Input
        label="Email"
        required
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <Button
        title="Send reset link"
        onPress={handleSubmit}
        loading={submitting}
        fullWidth
        size="lg"
        style={{ marginTop: spacing[5] }}
      />

      <View style={styles.footer}>
        <Link href="/(auth)/login" asChild>
          <Pressable>
            <Text style={[text.sm, { color: colors.primary[700], fontWeight: '600' }]}>
              Back to sign in
            </Text>
          </Pressable>
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: spacing[6], marginBottom: spacing[6] },
  title: { ...text['3xl'], fontWeight: '700', color: colors.ink[900], marginBottom: spacing[2] },
  subtitle: { ...text.base, color: colors.ink[500] },
  errorBox: {
    backgroundColor: colors.dangerLight,
    padding: spacing[3],
    borderRadius: 8,
    marginBottom: spacing[4],
  },
  errorText: { ...text.sm, color: colors.danger },
  footer: { alignItems: 'center', marginTop: spacing[6] },
});

export const options = { title: 'Reset Password' };
