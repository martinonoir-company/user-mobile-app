import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Screen } from '@/components/Screen';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { colors, spacing, text } from '@/theme';

const PASSWORD_RULE = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

export default function ChangePasswordScreen() {
  const { isAuthenticated, isLoading } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (isLoading) return null;
  if (!isAuthenticated) {
    router.replace('/(auth)/login?next=/account/password');
    return null;
  }

  const handleSubmit = async () => {
    setError(null);
    if (!current) {
      setError('Current password is required.');
      return;
    }
    if (!PASSWORD_RULE.test(next)) {
      setError('New password must be at least 8 characters with an uppercase letter and a number.');
      return;
    }
    if (next !== confirm) {
      setError('New passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      await api.changePassword(current, next);
      setDone(true);
    } catch (err: unknown) {
      const msg = (err as { message?: string | string[] })?.message;
      setError(Array.isArray(msg) ? msg[0]! : msg || 'Failed to change password.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <Screen scroll>
        <Text style={styles.heading}>Password updated</Text>
        <Text style={styles.subhead}>Your password has been changed successfully.</Text>
        <Button title="Back to account" fullWidth onPress={() => router.replace('/(tabs)/account')} />
      </Screen>
    );
  }

  return (
    <Screen scroll keyboardAware>
      <Text style={styles.heading}>Change Password</Text>
      <Text style={styles.subhead}>Enter your current password and a new one.</Text>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={{ gap: spacing[4], marginTop: spacing[4] }}>
        <Input
          label="Current password"
          required
          secureTextEntry
          autoCapitalize="none"
          value={current}
          onChangeText={setCurrent}
        />
        <Input
          label="New password"
          required
          secureTextEntry
          autoCapitalize="none"
          value={next}
          onChangeText={setNext}
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
          title="Update password"
          onPress={handleSubmit}
          loading={submitting}
          fullWidth
          size="lg"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { ...text['2xl'], fontWeight: '700', color: colors.ink[900], marginTop: spacing[4] },
  subhead: { ...text.sm, color: colors.ink[500], marginTop: 4 },
  errorBox: {
    backgroundColor: colors.dangerLight,
    padding: spacing[3],
    borderRadius: 8,
    marginTop: spacing[4],
  },
  errorText: { ...text.sm, color: colors.danger },
});
