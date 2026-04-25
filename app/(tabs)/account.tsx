import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { TopBar } from '@/components/TopBar';
import { api, UserProfile } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { colors, radius, spacing, text } from '@/theme';

const MENU: Array<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  href: string;
}> = [
  { icon: 'person-outline', label: 'Profile', href: '/account/profile' },
  { icon: 'receipt-outline', label: 'My Orders', href: '/account/orders' },
  { icon: 'navigate-outline', label: 'Track Order', href: '/account/track-order' },
  { icon: 'lock-closed-outline', label: 'Change Password', href: '/account/password' },
  { icon: 'help-circle-outline', label: 'Help & Support', href: '/static/help' },
  { icon: 'document-text-outline', label: 'Shipping & Returns', href: '/static/shipping' },
  { icon: 'information-circle-outline', label: 'About Martinonoir', href: '/static/about' },
];

export default function AccountScreen() {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setProfile(null);
      return;
    }
    api
      .getProfile()
      .then((res) => setProfile(res.data))
      .catch(() => {});
  }, [isAuthenticated]);

  if (isLoading) {
    return <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface[0] }} />;
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.surface[0] }}>
        <TopBar title="Account" showSearch={false} />
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <EmptyState
            icon={<Ionicons name="person-outline" size={60} color={colors.ink[200]} />}
            title="Sign in to your account"
            subtitle="Track orders, manage addresses, and save your favorites."
            action={
              <View style={{ gap: spacing[3], width: 240 }}>
                <Button
                  title="Sign In"
                  fullWidth
                  onPress={() => router.push('/(auth)/login')}
                />
                <Button
                  title="Create Account"
                  variant="outline"
                  fullWidth
                  onPress={() => router.push('/(auth)/register')}
                />
              </View>
            }
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.surface[0] }}>
      <TopBar title="Account" showSearch={false} />
      <ScrollView>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(profile?.firstName?.[0] ?? '').toUpperCase()}
              {(profile?.lastName?.[0] ?? '').toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>
              {profile ? `${profile.firstName} ${profile.lastName}` : 'Loading…'}
            </Text>
            {profile ? <Text style={styles.email}>{profile.email}</Text> : null}
            {profile && !profile.emailVerified ? (
              <Pressable onPress={() => router.push('/(auth)/verify-email')}>
                <Text style={styles.verifyLink}>Verify your email</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        <View style={styles.menu}>
          {MENU.map((item, i) => (
            <Pressable
              key={item.label}
              onPress={() => router.push(item.href as never)}
              style={[
                styles.menuItem,
                i > 0 && { borderTopWidth: 1, borderTopColor: colors.ink[100] },
              ]}
            >
              <Ionicons name={item.icon} size={20} color={colors.ink[700]} />
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.ink[300]} />
            </Pressable>
          ))}
        </View>

        <Pressable onPress={logout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={18} color={colors.danger} />
          <Text style={styles.logoutText}>Sign out</Text>
        </Pressable>

        <View style={{ height: spacing[10] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    margin: spacing[4],
    padding: spacing[4],
    backgroundColor: colors.primary[50],
    borderRadius: radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[700],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...text.lg, color: '#fff', fontWeight: '700' },
  name: { ...text.base, fontWeight: '700', color: colors.ink[900] },
  email: { ...text.sm, color: colors.ink[500], marginTop: 2 },
  verifyLink: { ...text.xs, color: colors.warning, fontWeight: '600', marginTop: 4 },
  menu: {
    marginHorizontal: spacing[4],
    backgroundColor: colors.surface[0],
    borderWidth: 1,
    borderColor: colors.ink[100],
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
  },
  menuLabel: { ...text.sm, color: colors.ink[900], fontWeight: '500', flex: 1 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    marginTop: spacing[6],
    padding: spacing[4],
  },
  logoutText: { ...text.sm, color: colors.danger, fontWeight: '700' },
});
