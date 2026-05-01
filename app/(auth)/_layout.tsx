import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { LoadingView } from '@/components/LoadingView';

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <LoadingView />;
  if (isAuthenticated) return <Redirect href="/(tabs)/account" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
