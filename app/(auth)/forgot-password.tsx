import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Screen } from '@/components/Screen';
import { api } from '@/lib/api';
import { colors, radius, spacing, text } from '@/theme';

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
      // Mirror the server's anti-enumeration behavior.
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <Screen scroll>
        <View style={styles.brandRow}>
          <Text style={styles.brand}>Martinonoir</Text>
        </View>
        <View style={styles.successWrap}>
          <View style={styles.iconCircle}>
            <Ionicons name="mail" size={28} color={colors.ink[900]} />
          </View>
          <Text style={styles.title}>Check your inbox</Text>
          <Text style={styles.subtitle}>
            If an account exists for{' '}
            <Text style={{ color: colors.ink[900], fontWeight: '600' }}>{email}</Text>
            , we just sent password reset instructions. The link expires in 1 hour.
          </Text>
        </View>

        <View style={{ gap: spacing[3], marginTop: spacing[6] }}>
          <Button
            title="Enter reset code"
            fullWidth
            size="lg"
            onPress={() => router.push('/(auth)/reset-password')}
          />
          <Button
            title="Back to sign in"
            variant="outline"
            fullWidth
            size="lg"
            onPress={() => router.replace('/(auth)/login')}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll keyboardAware>
      <View style={styles.brandRow}>
        <Text style={styles.brand}>Martinonoir</Text>
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>Reset password</Text>
        <Text style={styles.subtitle}>
          Enter the email tied to your account and we'll send a reset link.
        </Text>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={18} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={{ gap: spacing[4] }}>
        <Input
          label="Email"
          required
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
        />

        <Button
          title="Send reset link"
          onPress={handleSubmit}
          loading={submitting}
          fullWidth
          size="lg"
          style={{ marginTop: spacing[2] }}
        />
      </View>

      <View style={styles.footer}>
        <Link href="/(auth)/login" asChild>
          <Pressable hitSlop={8}>
            <Text style={styles.footerLink}>← Back to sign in</Text>
          </Pressable>
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brandRow: { marginTop: spacing[4], marginBottom: spacing[8] },
  brand: {
    ...text.lg,
    fontWeight: '700',
    color: colors.ink[900],
    letterSpacing: 0.5,
  },
  header: { marginBottom: spacing[6] },
  title: {
    ...text['4xl'],
    fontWeight: '700',
    color: colors.ink[900],
    marginBottom: spacing[2],
    letterSpacing: -0.5,
  },
  subtitle: { ...text.base, color: colors.ink[500], lineHeight: 24 },
  successWrap: { alignItems: 'center', marginTop: spacing[6] },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.surface[1],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[5],
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.dangerLight,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    borderRadius: radius.lg,
    marginBottom: spacing[4],
  },
  errorText: { ...text.sm, color: colors.danger, flex: 1 },
  footer: { alignItems: 'center', marginTop: spacing[8] },
  footerLink: { ...text.sm, color: colors.ink[900], fontWeight: '700' },
});

export const options = { title: 'Reset Password' };
