import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/lib/auth-context';
import { CartProvider } from '@/lib/cart-context';
import { colors } from '@/theme';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
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
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
