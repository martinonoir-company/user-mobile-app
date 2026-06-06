import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { LoadingView } from '@/components/LoadingView';
import { Screen } from '@/components/Screen';
import { api, UserProfile } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { colors, spacing, text } from '@/theme';

export default function ProfileScreen() {
  const { isAuthenticated, isLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('NG');

  useEffect(() => {
    if (!isAuthenticated) return;
    api
      .getProfile()
      .then((res) => {
        setProfile(res.data);
        setFirstName(res.data.firstName ?? '');
        setLastName(res.data.lastName ?? '');
        setPhone(res.data.phone ?? '');
        setCountryCode(res.data.countryCode ?? 'NG');
      })
      .catch(() => setMessage({ kind: 'error', text: 'Failed to load profile.' }))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  if (isLoading) return <LoadingView />;
  if (!isAuthenticated) return <Redirect href="/(auth)/login?next=/account/profile" />;
  if (loading) return <LoadingView />;

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await api.updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || undefined,
        countryCode: countryCode.trim().toUpperCase() || 'NG',
      });
      setProfile(res.data);
      setMessage({ kind: 'success', text: 'Profile updated.' });
    } catch (err: unknown) {
      const msg = (err as { message?: string | string[] })?.message;
      setMessage({
        kind: 'error',
        text: Array.isArray(msg) ? msg[0]! : msg || 'Failed to update profile.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen scroll keyboardAware edges={['bottom']}>
      <Text style={styles.heading}>Your Profile</Text>
      {profile?.email ? <Text style={styles.emailLine}>{profile.email}</Text> : null}

      {message ? (
        <View
          style={[
            styles.msg,
            { backgroundColor: message.kind === 'error' ? colors.dangerLight : colors.successLight },
          ]}
        >
          <Text
            style={[
              text.sm,
              { color: message.kind === 'error' ? colors.danger : colors.success },
            ]}
          >
            {message.text}
          </Text>
        </View>
      ) : null}

      <View style={{ gap: spacing[4], marginTop: spacing[4] }}>
        <Input label="First name" value={firstName} onChangeText={setFirstName} />
        <Input label="Last name" value={lastName} onChangeText={setLastName} />
        <Input
          label="Phone"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
        <Input
          label="Country"
          autoCapitalize="characters"
          maxLength={2}
          value={countryCode}
          onChangeText={setCountryCode}
          hint="2-letter ISO code"
        />
        <Button
          title="Save changes"
          onPress={handleSave}
          loading={saving}
          fullWidth
          size="lg"
          style={{ marginTop: spacing[3] }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { ...text['2xl'], fontWeight: '700', color: colors.ink[900], marginTop: spacing[4] },
  emailLine: { ...text.sm, color: colors.ink[500], marginTop: 4 },
  msg: { padding: spacing[3], borderRadius: 8, marginTop: spacing[4] },
});
