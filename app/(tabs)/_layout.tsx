import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '@/lib/cart-context';
import { colors, text } from '@/theme';

function CartBadge() {
  const { itemCount } = useCart();
  if (itemCount <= 0) return null;
  return (
    <View
      style={{
        position: 'absolute',
        top: -4,
        right: -10,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: colors.ink[900],
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
      }}
    >
      <Text style={{ ...text.xs, color: '#fff', fontWeight: '700', lineHeight: 16 }}>
        {itemCount > 9 ? '9+' : itemCount}
      </Text>
    </View>
  );
}

// Height of the tab bar's own content (icon + label), before the device's
// bottom safe-area inset is added underneath it.
const TAB_CONTENT_HEIGHT = 56;

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  // Reserve space under the tab content for the device's bottom system UI so
  // the labels are never hidden behind the phone's navigation bar.
  //
  // On Android, edge-to-edge (the default in SDK 54) draws the app behind the
  // system navigation bar, so we must inset by its height. Some devices/OEMs
  // report insets.bottom as 0 (or not until edge-to-edge settles) even when a
  // 3-button navigation bar is present — that produced the clipped labels. So:
  //   - a real reported inset (gesture nav ≈ 16–24, button nav ≈ 48) is used
  //     as-is (with a small hairline floor);
  //   - a missing/near-zero inset falls back to 48dp, which clears a standard
  //     3-button navigation bar.
  // iOS always reports its true home-indicator inset, so it's used directly.
  const ANDROID_NAV_BAR_FALLBACK = 48;
  const bottomInset =
    Platform.OS === 'android'
      ? insets.bottom > 8
        ? insets.bottom
        : ANDROID_NAV_BAR_FALLBACK
      : insets.bottom;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ink[900],
        tabBarInactiveTintColor: colors.ink[400],
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.2,
          marginTop: 2,
        },
        tabBarItemStyle: { paddingTop: 6 },
        tabBarStyle: {
          backgroundColor: colors.surface[0],
          borderTopColor: colors.ink[100],
          borderTopWidth: 0.5,
          height: TAB_CONTENT_HEIGHT + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 6,
          elevation: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} color={color} size={size - 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: 'Shop',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'grid' : 'grid-outline'} color={color} size={size - 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ color, size, focused }) => (
            <View>
              <Ionicons name={focused ? 'bag' : 'bag-outline'} color={color} size={size - 2} />
              <CartBadge />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          title: 'Wishlist',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'heart' : 'heart-outline'} color={color} size={size - 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              color={color}
              size={size - 2}
            />
          ),
        }}
      />
    </Tabs>
  );
}
