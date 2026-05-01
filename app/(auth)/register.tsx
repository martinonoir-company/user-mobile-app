import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/lib/auth-context';
import { colors, radius, spacing, text } from '@/theme';

const PASSWORD_RULE = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

export default function RegisterScreen() {
  const { register } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [countryCode, setCountryCode] = useState('NG');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (submitting) return;
    setError(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!firstName.trim() || !lastName.trim()) {
      setError('First and last name are required.');
      return;
    }
    if (!trimmedEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!PASSWORD_RULE.test(password)) {
      setError('Password must be at least 8 characters, include an uppercase letter and a number.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: trimmedEmail,
        password,
        countryCode: countryCode.trim().toUpperCase() || 'NG',
      });
      router.replace('/(tabs)');
    } catch (err: unknown) {
      const msg = (err as { message?: string | string[] })?.message;
      setError((Array.isArray(msg) ? msg[0] : msg) || 'Registration failed. Try again.');
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
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>
          Save favorites, track orders, and check out faster.
        </Text>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={18} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.form}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Input
              label="First name"
              required
              autoCapitalize="words"
              textContentType="givenName"
              value={firstName}
              onChangeText={setFirstName}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Input
              label="Last name"
              required
              autoCapitalize="words"
              textContentType="familyName"
              value={lastName}
              onChangeText={setLastName}
            />
          </View>
        </View>

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
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            textContentType="newPassword"
            hint="At least 8 characters, 1 uppercase letter, 1 number"
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

        <Input
          label="Confirm password"
          required
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          textContentType="newPassword"
          value={confirm}
          onChangeText={setConfirm}
        />

        <Input
          label="Country"
          hint="2-letter code, e.g. NG or US"
          autoCapitalize="characters"
          maxLength={2}
          value={countryCode}
          onChangeText={setCountryCode}
        />

        <Button
          title="Create account"
          onPress={handleSubmit}
          loading={submitting}
          fullWidth
          size="lg"
          style={{ marginTop: spacing[2] }}
        />

        <Text style={styles.legal}>
          By creating an account, you agree to our Terms of Service and Privacy Policy.
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account? </Text>
        <Link href="/(auth)/login" asChild>
          <Pressable hitSlop={8}>
            <Text style={styles.footerLink}>Sign in</Text>
          </Pressable>
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brandRow: { marginTop: spacing[4], marginBottom: spacing[6] },
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
  row: { flexDirection: 'row', gap: spacing[3] },
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
  legal: {
    ...text.xs,
    color: colors.ink[400],
    textAlign: 'center',
    marginTop: spacing[2],
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing[8],
    marginBottom: spacing[4],
  },
  footerText: { ...text.sm, color: colors.ink[500] },
  footerLink: { ...text.sm, color: colors.ink[900], fontWeight: '700' },
});

export const options = { title: 'Create Account' };
