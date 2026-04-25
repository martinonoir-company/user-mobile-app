import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/lib/auth-context';
import { colors, spacing, text } from '@/theme';

const PASSWORD_RULE = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

export default function RegisterScreen() {
  const { register } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
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
      <View style={styles.header}>
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>
          Join Martinonoir to save favorites, track orders and more.
        </Text>
      </View>

      {error ? (
        <View style={styles.errorBox}>
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
          value={email}
          onChangeText={setEmail}
        />

        <Input
          label="Password"
          required
          secureTextEntry
          autoCapitalize="none"
          textContentType="newPassword"
          hint="At least 8 chars, 1 uppercase, 1 number"
          value={password}
          onChangeText={setPassword}
        />

        <Input
          label="Confirm password"
          required
          secureTextEntry
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
          title="Create Account"
          onPress={handleSubmit}
          loading={submitting}
          fullWidth
          size="lg"
          style={{ marginTop: spacing[3] }}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account? </Text>
        <Link href="/(auth)/login" asChild>
          <Pressable>
            <Text style={[styles.footerText, { color: colors.primary[700], fontWeight: '600' }]}>
              Sign in
            </Text>
          </Pressable>
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: spacing[4], marginBottom: spacing[6] },
  title: { ...text['3xl'], fontWeight: '700', color: colors.ink[900], marginBottom: spacing[2] },
  subtitle: { ...text.base, color: colors.ink[500] },
  form: { gap: spacing[4] },
  row: { flexDirection: 'row', gap: spacing[3] },
  errorBox: {
    backgroundColor: colors.dangerLight,
    padding: spacing[3],
    borderRadius: 8,
    marginBottom: spacing[4],
  },
  errorText: { ...text.sm, color: colors.danger },
  footer: { flexDirection: 'row', justifyContent: 'center', marginVertical: spacing[8] },
  footerText: { ...text.sm, color: colors.ink[500] },
});

export const options = { title: 'Create Account' };
