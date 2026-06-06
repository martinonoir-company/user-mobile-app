import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { CartProvider } from '@/lib/cart-context';
import { colors } from '@/theme';

// Keep the splash visible until auth bootstrap completes so users never see
// a flash of the empty home screen before the persisted session is restored.
SplashScreen.preventAutoHideAsync().catch(() => {
  // Already hidden / already initialized — safe to ignore.
});

function SplashGate({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth();
  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isLoading]);
  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <SplashGate>
          <CartProvider>
            <StatusBar style="dark" />
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: colors.surface[0] },
                headerTintColor: colors.ink[900],
                headerTitleStyle: { fontWeight: '600' },
                contentStyle: { backgroundColor: colors.surface[0] },
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen
                name="product/[slug]"
                options={{ title: '', headerBackTitle: 'Back' }}
              />
              <Stack.Screen
                name="category/[slug]"
                options={{ title: '', headerBackTitle: 'Back' }}
              />
              <Stack.Screen name="search" options={{ headerShown: false, presentation: 'modal' }} />
              <Stack.Screen name="checkout" options={{ title: 'Checkout' }} />
              <Stack.Screen
                name="order-confirmation"
                options={{ title: 'Order Confirmed', headerBackVisible: false }}
              />
              <Stack.Screen name="account/profile" options={{ title: 'Profile' }} />
              <Stack.Screen name="account/orders/index" options={{ title: 'Orders' }} />
              <Stack.Screen
                name="account/orders/[id]"
                options={{ title: 'Order Details' }}
              />
              <Stack.Screen
                name="account/password"
                options={{ title: 'Change Password' }}
              />
              <Stack.Screen
                name="account/track-order"
                options={{ title: 'Track Order' }}
              />
              <Stack.Screen name="static/[slug]" options={{ title: '' }} />
              <Stack.Screen name="verify-email" options={{ headerShown: false }} />
              <Stack.Screen name="reset-password" options={{ headerShown: false }} />
            </Stack>
          </CartProvider>
          </SplashGate>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
