import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Screen } from '@/components/Screen';
import { api } from '@/lib/api';
import { colors, spacing, text } from '@/theme';

type Status = 'idle' | 'verifying' | 'success' | 'error';

export default function VerifyEmailScreen() {
  const params = useLocalSearchParams<{ token?: string; email?: string }>();
  const [token, setToken] = useState(typeof params.token === 'string' ? params.token : '');
  const [email, setEmail] = useState(typeof params.email === 'string' ? params.email : '');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  // Auto-verify when a deep link delivers a token.
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
        <View style={styles.header}>
          <Text style={styles.title}>Email verified</Text>
          <Text style={styles.subtitle}>
            Thanks for confirming your email. You can now sign in.
          </Text>
        </View>
        <Button title="Continue" fullWidth onPress={() => router.replace('/(auth)/login')} />
      </Screen>
    );
  }

  return (
    <Screen scroll keyboardAware>
      <View style={styles.header}>
        <Text style={styles.title}>Verify your email</Text>
        <Text style={styles.subtitle}>
          Paste the verification code from your email. If it expired, we can send a new one.
        </Text>
      </View>

      {message ? (
        <View
          style={[
            styles.msgBox,
            { backgroundColor: status === 'error' ? colors.dangerLight : colors.successLight },
          ]}
        >
          <Text
            style={[text.sm, { color: status === 'error' ? colors.danger : colors.success }]}
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
        />
        <Button
          title="Verify"
          fullWidth
          size="lg"
          loading={status === 'verifying'}
          onPress={() => handleVerify()}
        />

        <View style={{ height: 1, backgroundColor: colors.ink[100], marginVertical: spacing[3] }} />

        <Input
          label="Email"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <Button
          title={resent ? 'Sent' : 'Resend verification email'}
          variant="outline"
          fullWidth
          disabled={resent}
          onPress={handleResend}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: spacing[6], marginBottom: spacing[6] },
  title: { ...text['3xl'], fontWeight: '700', color: colors.ink[900], marginBottom: spacing[2] },
  subtitle: { ...text.base, color: colors.ink[500] },
  msgBox: { padding: spacing[3], borderRadius: 8, marginBottom: spacing[4] },
});

export const options = { title: 'Verify Email' };
