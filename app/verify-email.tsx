import { Redirect, useLocalSearchParams } from 'expo-router';

export default function VerifyEmailDeepLink() {
  const params = useLocalSearchParams<{ token?: string; email?: string }>();
  return (
    <Redirect
      href={{
        pathname: '/(auth)/verify-email',
        params: {
          ...(typeof params.token === 'string' ? { token: params.token } : {}),
          ...(typeof params.email === 'string' ? { email: params.email } : {}),
        },
      }}
    />
  );
}
