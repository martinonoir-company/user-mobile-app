import { Redirect, useLocalSearchParams } from 'expo-router';

export default function ResetPasswordDeepLink() {
  const params = useLocalSearchParams<{ token?: string }>();
  return (
    <Redirect
      href={{
        pathname: '/(auth)/reset-password',
        params: typeof params.token === 'string' ? { token: params.token } : {},
      }}
    />
  );
}
