import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { LoadingView } from '@/components/LoadingView';
import { Screen } from '@/components/Screen';
import { api, Order } from '@/lib/api';
import { formatPrice } from '@/lib/price';
import { colors, radius, spacing, text } from '@/theme';

// Order statuses that mean the customer has actually paid. Only these may show
// a "confirmed" receipt — anything else is still awaiting payment.
const PAID_STATUSES = ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
const isPaidStatus = (status?: string) =>
  !!status && PAID_STATUSES.includes(status);

export default function OrderConfirmationScreen() {
  const params = useLocalSearchParams<{
    order?: string;
    ref?: string;
    unpaid?: string;
  }>();
  const orderNumber = typeof params.order === 'string' ? params.order : '';
  const paymentRef = typeof params.ref === 'string' ? params.ref : '';
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  // Resolve the true payment state: reconcile the reference, then poll the
  // order a few times so a lagging Paystack webhook still surfaces PAID.
  const resolveState = useCallback(
    async (cancelledRef: { v: boolean }) => {
      if (!orderNumber) {
        setLoading(false);
        return;
      }
      setLoading(true);
      if (paymentRef) {
        try {
          await api.reconcilePayment(paymentRef);
        } catch {
          // Non-fatal — the order status below is the source of truth.
        }
      }
      let attempts = 0;
      const poll = async () => {
        if (cancelledRef.v) return;
        try {
          const res = await api.getOrderByNumber(orderNumber);
          if (cancelledRef.v) return;
          setOrder(res.data);
          // Still unpaid and a payment was attempted? Give the webhook a moment.
          if (paymentRef && attempts < 4 && !isPaidStatus(res.data.status)) {
            attempts += 1;
            setTimeout(poll, 3000);
            return;
          }
        } catch {
          if (!cancelledRef.v) setOrder(null);
        }
        if (!cancelledRef.v) setLoading(false);
      };
      await poll();
    },
    [orderNumber, paymentRef],
  );

  useEffect(() => {
    const ref = { v: false };
    void resolveState(ref);
    return () => {
      ref.v = true;
    };
  }, [resolveState]);

  // Retry payment for an order that wasn't paid (customer closed the Paystack
  // window). Re-initiates a Paystack session for the SAME order, reopens the
  // hosted page, then re-resolves the true state.
  const retryPayment = useCallback(async () => {
    if (!order) return;
    setRetryError(null);
    setRetrying(true);
    try {
      const pay = await api.initiatePayment({ orderId: order.id, channel: 'MOBILE' });
      if (!pay.data.checkoutUrl) {
        throw new Error('Could not start payment. Please try again.');
      }
      await WebBrowser.openBrowserAsync(pay.data.checkoutUrl);
      const ref = { v: false };
      await resolveState(ref);
    } catch (err: unknown) {
      const msg = (err as { message?: string | string[] })?.message;
      setRetryError(
        (Array.isArray(msg) ? msg[0] : msg) || 'Could not start payment.',
      );
    } finally {
      setRetrying(false);
    }
  }, [order, resolveState]);

  if (loading) return <LoadingView />;

  const paid = isPaidStatus(order?.status);

  return (
    <Screen scroll edges={['bottom']}>
      {paid ? (
        <View style={styles.heroBox}>
          <View style={styles.checkCircle}>
            <Ionicons name="checkmark" size={36} color="#fff" />
          </View>
          <Text style={styles.title}>Order Confirmed</Text>
          <Text style={styles.subtitle}>
            Thank you for shopping with Martinonoir.
          </Text>
          {orderNumber ? (
            <Text style={styles.orderNumber}>Order #{orderNumber}</Text>
          ) : null}
        </View>
      ) : (
        <View style={styles.heroBox}>
          <View style={styles.pendingCircle}>
            <Ionicons name="alert" size={36} color="#fff" />
          </View>
          <Text style={styles.title}>Payment Not Completed</Text>
          <Text style={styles.subtitle}>
            Your payment wasn&apos;t confirmed, so this order hasn&apos;t been
            placed yet. You haven&apos;t been charged.
          </Text>
          {orderNumber ? (
            <Text style={styles.orderNumber}>Order #{orderNumber}</Text>
          ) : null}
        </View>
      )}

      {order ? (
        <View style={styles.card}>
          <Row
            label="Status"
            value={order.status.replace(/_/g, ' ').toUpperCase()}
          />
          <Row
            label="Total"
            value={formatPrice(order.grandTotal, order.currency)}
            bold
          />
          <Row label="Items" value={String(order.items.length)} />
        </View>
      ) : null}

      {/* Post-payment dispatch progress — only when actually paid. */}
      {order && paid ? <DispatchProgress orderId={order.id} /> : null}

      {retryError ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={16} color={colors.danger} />
          <Text style={styles.errorText}>{retryError}</Text>
        </View>
      ) : null}

      {paid ? (
        <>
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
        </>
      ) : (
        <>
          <Button
            title={retrying ? 'Opening payment…' : 'Retry Payment'}
            loading={retrying}
            fullWidth
            onPress={retryPayment}
            style={{ marginTop: spacing[4] }}
            icon={<Ionicons name="lock-closed-outline" size={16} color="#fff" />}
          />
          <Button
            title="View My Orders"
            variant="outline"
            fullWidth
            onPress={() => router.replace('/account/orders')}
            style={{ marginTop: spacing[3] }}
          />
          <Button
            title="Continue Shopping"
            variant="ghost"
            fullWidth
            onPress={() => router.replace('/(tabs)')}
            style={{ marginTop: spacing[2] }}
          />
        </>
      )}
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
  pendingCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.dangerLight,
    padding: spacing[3],
    borderRadius: radius.md,
    marginTop: spacing[4],
  },
  errorText: { ...text.sm, color: colors.danger, flex: 1 },
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
