import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
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

      {/* Post-payment dispatch progress — only when paid. */}
      {order &&
      ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status) ? (
        <DispatchProgress orderId={order.id} />
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

/**
 * Polls GET /orders/:id/shipping every ~3s and animates a progress bar
 * as AAJ create-booking → process-booking complete:
 *   0% paid → 66% booked → 100% tracking ready.
 * Shows a self-pickup state when the order opted out, and a friendly
 * "we'll keep trying" state when AAJ retries are in flight.
 */
function DispatchProgress({ orderId }: { orderId: string }) {
  const [progress, setProgress] = useState(0);
  const [trackingId, setTrackingId] = useState<string | null>(null);
  const [optedOut, setOptedOut] = useState(false);
  const [stalled, setStalled] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const poll = useCallback(async () => {
    try {
      const res = await api.getShippingState(orderId);
      const d = res.data;
      setOptedOut(d.optedOut);
      setProgress(d.progress);
      setTrackingId(d.trackingId);
      if (d.trackingId || d.optedOut) return;
      if (d.retryCount >= 3) setStalled(true);
      timer.current = setTimeout(poll, d.retryCount >= 3 ? 8000 : 3000);
    } catch {
      timer.current = setTimeout(poll, 5000);
    }
  }, [orderId]);

  useEffect(() => {
    void poll();
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [poll]);

  if (optedOut) {
    return (
      <View style={styles.dispatchCard}>
        <View style={styles.dispatchHeader}>
          <Ionicons name="cube-outline" size={18} color={colors.ink[600]} />
          <Text style={styles.dispatchTitle}>Self-pickup selected</Text>
        </View>
        <Text style={styles.dispatchSub}>
          No delivery was booked. Please arrange to collect your order.
        </Text>
      </View>
    );
  }

  const done = progress >= 100 && !!trackingId;

  return (
    <View style={styles.dispatchCard}>
      <View style={styles.dispatchHeader}>
        <Ionicons
          name={done ? 'checkmark-circle' : 'car-outline'}
          size={18}
          color={done ? colors.success : colors.primary[600]}
        />
        <Text style={styles.dispatchTitle}>
          {done ? 'Shipment booked' : 'Booking your shipment…'}
        </Text>
        {!done && !stalled ? (
          <ActivityIndicator
            size="small"
            color={colors.primary[500]}
            style={{ marginLeft: 'auto' }}
          />
        ) : null}
      </View>
      <Text style={styles.dispatchSub}>
        {done
          ? 'AAJ Express has your parcel. Tracking is ready.'
          : stalled
            ? "Taking a little longer than usual — we'll keep trying. Your payment is safe."
            : "We're arranging delivery with AAJ Express."}
      </Text>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${Math.max(8, progress)}%`,
              backgroundColor: done ? colors.success : colors.primary[600],
            },
          ]}
        />
      </View>
      <View style={styles.progressLabels}>
        <Text style={styles.progressLabel}>Paid</Text>
        <Text
          style={[
            styles.progressLabel,
            progress >= 66 ? { color: colors.ink[700], fontWeight: '600' } : null,
          ]}
        >
          Booked
        </Text>
        <Text
          style={[
            styles.progressLabel,
            done ? { color: colors.success, fontWeight: '600' } : null,
          ]}
        >
          Tracking ready
        </Text>
      </View>

      {done && trackingId ? (
        <View style={styles.trackingRow}>
          <Text style={styles.dispatchSub}>Tracking number</Text>
          <Text style={styles.trackingValue}>{trackingId}</Text>
        </View>
      ) : null}
    </View>
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
  dispatchCard: {
    borderWidth: 1,
    borderColor: colors.ink[100],
    borderRadius: radius.xl,
    padding: spacing[4],
    marginTop: spacing[4],
    backgroundColor: colors.surface[1],
  },
  dispatchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  dispatchTitle: { ...text.sm, fontWeight: '700', color: colors.ink[900] },
  dispatchSub: { ...text.xs, color: colors.ink[500] },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.ink[100],
    overflow: 'hidden',
    marginTop: spacing[3],
  },
  progressFill: { height: '100%', borderRadius: 4 },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing[1],
  },
  progressLabel: { ...text.xs, color: colors.ink[400] },
  trackingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing[3],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.ink[100],
  },
  trackingValue: {
    ...text.xs,
    fontWeight: '700',
    color: colors.ink[900],
    fontFamily: 'monospace',
  },
});
