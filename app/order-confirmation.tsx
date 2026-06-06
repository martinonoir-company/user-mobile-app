import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { LoadingView } from '@/components/LoadingView';
import { Screen } from '@/components/Screen';
import { api, Order } from '@/lib/api';
import { formatPrice } from '@/lib/price';
import { colors, radius, spacing, text } from '@/theme';

export default function OrderConfirmationScreen() {
  const params = useLocalSearchParams<{ order?: string; ref?: string }>();
  const orderNumber = typeof params.order === 'string' ? params.order : '';
  const paymentRef = typeof params.ref === 'string' ? params.ref : '';
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderNumber) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    let attempts = 0;

    // Load the order. If a payment reference was passed, reconcile it
    // server-side first, then re-check the order a few times so a lagging
    // Paystack webhook still surfaces the PAID status here.
    const run = async () => {
      if (paymentRef) {
        try {
          await api.reconcilePayment(paymentRef);
        } catch {
          // Non-fatal — the order status below is the source of truth.
        }
      }
      const poll = async () => {
        if (cancelled) return;
        try {
          const res = await api.getOrderByNumber(orderNumber);
          if (cancelled) return;
          setOrder(res.data);
          // If payment is still pending, give the webhook a moment.
          if (
            paymentRef &&
            attempts < 4 &&
            res.data.status !== 'PAID' &&
            res.data.status !== 'PROCESSING' &&
            res.data.status !== 'SHIPPED' &&
            res.data.status !== 'DELIVERED'
          ) {
            attempts += 1;
            setTimeout(poll, 3000);
          }
        } catch {
          if (!cancelled) setOrder(null);
        } finally {
          if (!cancelled) setLoading(false);
        }
      };
      await poll();
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [orderNumber, paymentRef]);

  if (loading) return <LoadingView />;

  return (
    <Screen scroll edges={['bottom']}>
      <View style={styles.heroBox}>
        <View style={styles.checkCircle}>
          <Ionicons name="checkmark" size={36} color="#fff" />
        </View>
        <Text style={styles.title}>Order Confirmed</Text>
        <Text style={styles.subtitle}>Thank you for shopping with Martinonoir.</Text>
        {orderNumber ? <Text style={styles.orderNumber}>Order #{orderNumber}</Text> : null}
      </View>

      {order ? (
        <View style={styles.card}>
          <Row label="Status" value={order.status.replace(/_/g, ' ').toUpperCase()} />
          <Row label="Total" value={formatPrice(order.grandTotal, order.currency)} bold />
          <Row label="Items" value={String(order.items.length)} />
        </View>
      ) : null}

      <Button
        title="View My Orders"
        variant="outline"
        fullWidth
        onPress={() => router.replace('/account/orders')}
        style={{ marginTop: spacing[4] }}
      />
      <Button
        title="Continue Shopping"
        fullWidth
        onPress={() => router.replace('/(tabs)')}
        style={{ marginTop: spacing[3] }}
      />
    </Screen>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, bold && { fontWeight: '700' }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  heroBox: { alignItems: 'center', paddingVertical: spacing[8] },
  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  title: { ...text['2xl'], fontWeight: '700', color: colors.ink[900], marginBottom: spacing[2] },
  subtitle: { ...text.sm, color: colors.ink[500], textAlign: 'center' },
  orderNumber: {
    ...text.sm,
    color: colors.ink[700],
    fontWeight: '700',
    marginTop: spacing[3],
  },
  card: {
    borderWidth: 1,
    borderColor: colors.ink[100],
    borderRadius: radius.xl,
    padding: spacing[4],
    marginTop: spacing[4],
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing[2],
  },
  rowLabel: { ...text.sm, color: colors.ink[500] },
  rowValue: { ...text.sm, color: colors.ink[900] },
});
