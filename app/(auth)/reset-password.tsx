import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Screen } from '@/components/Screen';
import { api } from '@/lib/api';
import { colors, radius, spacing, text } from '@/theme';

const PASSWORD_RULE = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ token?: string }>();
  const [token, setToken] = useState(typeof params.token === 'string' ? params.token : '');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
        <View style={styles.brandRow}>
          <Text style={styles.brand}>Martinonoir</Text>
        </View>
        <View style={styles.successWrap}>
          <View style={[styles.iconCircle, { backgroundColor: colors.successLight }]}>
            <Ionicons name="checkmark" size={32} color={colors.success} />
          </View>
          <Text style={styles.title}>Password updated</Text>
          <Text style={styles.subtitle}>
            You can now sign in with your new password.
          </Text>
        </View>
        <Button
          title="Go to sign in"
          fullWidth
          size="lg"
          style={{ marginTop: spacing[6] }}
          onPress={() => router.replace('/(auth)/login')}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll keyboardAware>
      <View style={styles.brandRow}>
        <Text style={styles.brand}>Martinonoir</Text>
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>New password</Text>
        <Text style={styles.subtitle}>
          Paste the code from your reset email and choose a new password.
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
          label="Reset code"
          required
          autoCapitalize="none"
          value={token}
          onChangeText={setToken}
          placeholder="Paste reset code from email"
        />
        <View>
          <Input
            label="New password"
            required
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            value={newPassword}
            onChangeText={setNewPassword}
            hint="At least 8 characters, 1 uppercase letter, 1 number"
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
          label="Confirm new password"
          required
          secureTextEntry={!showPassword}
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
          style={{ marginTop: spacing[2] }}
        />
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
});

export const options = { title: 'Reset Password' };
