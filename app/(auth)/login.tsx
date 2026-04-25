import { Link, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/lib/auth-context';
import { colors, spacing, text } from '@/theme';

export default function LoginScreen() {
  const { login } = useAuth();
  const params = useLocalSearchParams<{ next?: string }>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (submitting) return;
    setError(null);

    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }

    setSubmitting(true);
    try {
      await login(email.trim().toLowerCase(), password);
      const next = typeof params.next === 'string' ? params.next : undefined;
      if (next) {
        router.replace(next as never);
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: unknown) {
      const msg = (err as { message?: string | string[] })?.message;
      setError(
        (Array.isArray(msg) ? msg[0] : msg) ||
          'Login failed. Check your credentials and try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen scroll keyboardAware>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to continue shopping Martinonoir.</Text>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.form}>
        <Input
          label="Email"
          required
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          placeholder="your@email.com"
          value={email}
          onChangeText={setEmail}
        />

        <Input
          label="Password"
          required
          autoCapitalize="none"
          autoComplete="password"
          textContentType="password"
          secureTextEntry={!showPassword}
          placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
          value={password}
          onChangeText={setPassword}
        />

        <Pressable onPress={() => setShowPassword((v) => !v)}>
          <Text style={styles.link}>{showPassword ? 'Hide password' : 'Show password'}</Text>
        </Pressable>

        <Link href="/(auth)/forgot-password" asChild>
          <Pressable>
            <Text style={[styles.link, { alignSelf: 'flex-end' }]}>Forgot password?</Text>
          </Pressable>
        </Link>

        <Button
          title="Sign In"
          onPress={handleSubmit}
          loading={submitting}
          fullWidth
          size="lg"
          style={{ marginTop: spacing[3] }}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Don't have an account? </Text>
        <Link href="/(auth)/register" asChild>
          <Pressable
            onPress={() => {
              // Link handles navigation; no-op onPress ensures haptic feedback.
            }}
          >
            <Text style={[styles.footerText, { color: colors.primary[700], fontWeight: '600' }]}>
              Create one
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
  form: { gap: spacing[4] },
  link: { ...text.sm, color: colors.primary[700], fontWeight: '600' },
  errorBox: {
    backgroundColor: colors.dangerLight,
    padding: spacing[3],
    borderRadius: 8,
    marginBottom: spacing[4],
  },
  errorText: { ...text.sm, color: colors.danger },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing[8],
  },
  footerText: { ...text.sm, color: colors.ink[500] },
});

export const unstable_settings = {};
export const options = { title: 'Sign In' };
