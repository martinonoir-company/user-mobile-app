import { Ionicons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { api, Order } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { formatPrice } from '@/lib/price';
import { colors, radius, spacing, text } from '@/theme';

function statusTone(status: string): 'success' | 'warning' | 'danger' | 'neutral' | 'primary' {
  const s = status.toLowerCase();
  if (s.includes('deliver') || s.includes('complete') || s.includes('paid')) return 'success';
  if (s.includes('cancel') || s.includes('fail') || s.includes('refund')) return 'danger';
  if (s.includes('pending') || s.includes('process')) return 'warning';
  if (s.includes('ship')) return 'primary';
  return 'neutral';
}

export default function OrdersScreen() {
  const { isAuthenticated, isLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    api
      .getMyOrders({ limit: 50 })
      .then((res) => setOrders(res.data.items))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  if (isLoading) return null;
  if (!isAuthenticated) return <Redirect href="/(auth)/login?next=/account/orders" />;

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary[700]} />
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <EmptyState
          icon={<Ionicons name="receipt-outline" size={48} color={colors.ink[200]} />}
          title="No orders yet"
          subtitle="When you place your first order, it will show up here."
        />
      </View>
    );
  }

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: colors.surface[0] }}
      data={orders}
      keyExtractor={(o) => o.id}
      contentContainerStyle={{ padding: spacing[4], gap: spacing[3] }}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => router.push(`/account/orders/${item.id}` as never)}
          style={styles.card}
        >
          <View style={styles.headRow}>
            <Text style={styles.orderNo}>#{item.orderNumber}</Text>
            <Badge label={item.status.replace(/_/g, ' ')} tone={statusTone(item.status)} />
          </View>
          <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>
              {item.items.length} {item.items.length === 1 ? 'item' : 'items'}
            </Text>
            <Text style={styles.total}>{formatPrice(item.grandTotal, item.currency)}</Text>
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.ink[100],
    borderRadius: radius.xl,
    backgroundColor: colors.surface[0],
  },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNo: { ...text.base, fontWeight: '700', color: colors.ink[900] },
  date: { ...text.xs, color: colors.ink[500], marginTop: 4 },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing[3],
  },
  metaText: { ...text.sm, color: colors.ink[600] },
  total: { ...text.base, fontWeight: '700', color: colors.ink[900] },
});
