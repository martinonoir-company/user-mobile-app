import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Screen } from '@/components/Screen';
import { api } from '@/lib/api';
import { colors, radius, spacing, text } from '@/theme';

type Status = 'idle' | 'verifying' | 'success' | 'error';

export default function VerifyEmailScreen() {
  const params = useLocalSearchParams<{ token?: string; email?: string }>();
  const [token, setToken] = useState(typeof params.token === 'string' ? params.token : '');
  const [email, setEmail] = useState(typeof params.email === 'string' ? params.email : '');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    const initialToken = typeof params.token === 'string' ? params.token : '';
    if (initialToken && status === 'idle') {
      void handleVerify(initialToken);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVerify = async (t?: string) => {
    const value = (t ?? token).trim();
    if (!value) {
      setMessage('Enter a verification code.');
      setStatus('error');
      return;
    }
    setStatus('verifying');
    setMessage(null);
    try {
      await api.verifyEmail(value);
      setStatus('success');
    } catch (err: unknown) {
      const msg = (err as { message?: string | string[] })?.message;
      setMessage((Array.isArray(msg) ? msg[0] : msg) || 'Verification failed.');
      setStatus('error');
    }
  };

  const handleResend = async () => {
    if (!email.includes('@')) {
      setMessage('Enter the email to resend to.');
      setStatus('error');
      return;
    }
    try {
      await api.resendVerification(email.trim().toLowerCase());
      setResent(true);
      setMessage('Verification email resent.');
      setStatus('idle');
    } catch {
      setResent(true);
      setMessage('If the account exists, a new verification email has been sent.');
      setStatus('idle');
    }
  };

  if (status === 'success') {
    return (
      <Screen scroll>
        <View style={styles.brandRow}>
          <Text style={styles.brand}>Martinonoir</Text>
        </View>
        <View style={styles.successWrap}>
          <View style={[styles.iconCircle, { backgroundColor: colors.successLight }]}>
            <Ionicons name="checkmark" size={32} color={colors.success} />
          </View>
          <Text style={styles.title}>Email verified</Text>
          <Text style={styles.subtitle}>
            Thanks for confirming your email. You can now sign in.
          </Text>
        </View>
        <Button
          title="Continue"
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
        <Text style={styles.title}>Verify email</Text>
        <Text style={styles.subtitle}>
          Paste the verification code from your email. If it's expired, we can send a new one.
        </Text>
      </View>

      {message ? (
        <View
          style={[
            styles.msgBox,
            {
              backgroundColor:
                status === 'error' ? colors.dangerLight : colors.successLight,
            },
          ]}
        >
          <Ionicons
            name={status === 'error' ? 'alert-circle' : 'checkmark-circle'}
            size={18}
            color={status === 'error' ? colors.danger : colors.success}
          />
          <Text
            style={[
              text.sm,
              {
                color: status === 'error' ? colors.danger : colors.success,
                flex: 1,
              },
            ]}
          >
            {message}
          </Text>
        </View>
      ) : null}

      <View style={{ gap: spacing[4] }}>
        <Input
          label="Verification code"
          required
          autoCapitalize="none"
          value={token}
          onChangeText={setToken}
          placeholder="Paste code from email"
        />
        <Button
          title="Verify email"
          fullWidth
          size="lg"
          loading={status === 'verifying'}
          onPress={() => handleVerify()}
        />

        <View style={styles.divider} />

        <View>
          <Text style={styles.resendLabel}>Didn't get the email?</Text>
          <Input
            label="Email"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
          />
        </View>
        <Button
          title={resent ? 'Sent ✓' : 'Resend verification email'}
          variant="outline"
          fullWidth
          size="lg"
          disabled={resent}
          onPress={handleResend}
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
  msgBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    borderRadius: radius.lg,
    marginBottom: spacing[4],
  },
  divider: {
    height: 1,
    backgroundColor: colors.ink[100],
    marginVertical: spacing[3],
  },
  resendLabel: {
    ...text.sm,
    fontWeight: '600',
    color: colors.ink[700],
    marginBottom: spacing[3],
  },
});

export const options = { title: 'Verify Email' };
