import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Screen } from '@/components/Screen';
import { api } from '@/lib/api';
import { colors, spacing, text } from '@/theme';

const PASSWORD_RULE = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ token?: string }>();
  const [token, setToken] = useState(typeof params.token === 'string' ? params.token : '');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    if (!token.trim()) {
      setError('Reset code is required.');
      return;
    }
    if (!PASSWORD_RULE.test(newPassword)) {
      setError('Password must be at least 8 characters, include an uppercase letter and a number.');
      return;
    }
    if (newPassword !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      await api.resetPassword(token.trim(), newPassword);
      setDone(true);
    } catch (err: unknown) {
      const msg = (err as { message?: string | string[] })?.message;
      setError(
        (Array.isArray(msg) ? msg[0] : msg) || 'Reset failed. The code may be expired.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <Screen scroll>
        <View style={styles.header}>
          <Text style={styles.title}>Password updated</Text>
          <Text style={styles.subtitle}>You can now sign in with your new password.</Text>
        </View>
        <Button title="Go to sign in" fullWidth onPress={() => router.replace('/(auth)/login')} />
      </Screen>
    );
  }

  return (
    <Screen scroll keyboardAware>
      <View style={styles.header}>
        <Text style={styles.title}>Set a new password</Text>
        <Text style={styles.subtitle}>
          Paste the code from your reset email and choose a new password.
        </Text>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={{ gap: spacing[4] }}>
        <Input
          label="Reset code"
          required
          autoCapitalize="none"
          value={token}
          onChangeText={setToken}
          placeholder="Paste reset code from email"
        />
        <Input
          label="New password"
          required
          secureTextEntry
          autoCapitalize="none"
          value={newPassword}
          onChangeText={setNewPassword}
          hint="At least 8 chars, 1 uppercase, 1 number"
        />
        <Input
          label="Confirm new password"
          required
          secureTextEntry
          autoCapitalize="none"
          value={confirm}
          onChangeText={setConfirm}
        />
        <Button
          title="Reset password"
          loading={submitting}
          fullWidth
          size="lg"
          onPress={handleSubmit}
          style={{ marginTop: spacing[3] }}
        />
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
});

export const options = { title: 'Reset Password' };
