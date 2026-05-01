import { Ionicons } from '@expo/vector-icons';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/lib/auth-context';
import { colors, radius, spacing, text } from '@/theme';

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
      <View style={styles.brandRow}>
        <Text style={styles.brand}>Martinonoir</Text>
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to pick up where you left off.</Text>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={18} color={colors.danger} />
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
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
        />

        <View>
          <Input
            label="Password"
            required
            autoCapitalize="none"
            autoComplete="password"
            textContentType="password"
            secureTextEntry={!showPassword}
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
          />
          <Pressable
            onPress={() => setShowPassword((v) => !v)}
            hitSlop={8}
            style={styles.eyeBtn}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.ink[500]}
            />
          </Pressable>
        </View>

        <Link href="/(auth)/forgot-password" asChild>
          <Pressable hitSlop={8} style={{ alignSelf: 'flex-end' }}>
            <Text style={styles.link}>Forgot password?</Text>
          </Pressable>
        </Link>

        <Button
          title="Sign in"
          onPress={handleSubmit}
          loading={submitting}
          fullWidth
          size="lg"
          style={{ marginTop: spacing[2] }}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>New to Martinonoir? </Text>
        <Link href="/(auth)/register" asChild>
          <Pressable hitSlop={8}>
            <Text style={styles.footerLink}>Create an account</Text>
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
  subtitle: { ...text.base, color: colors.ink[500] },
  form: { gap: spacing[4] },
  link: { ...text.sm, color: colors.ink[900], fontWeight: '600' },
  eyeBtn: {
    position: 'absolute',
    right: spacing[3],
    top: 36,
    padding: spacing[2],
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing[10],
    marginBottom: spacing[4],
  },
  footerText: { ...text.sm, color: colors.ink[500] },
  footerLink: { ...text.sm, color: colors.ink[900], fontWeight: '700' },
});

export const options = { title: 'Sign In' };
