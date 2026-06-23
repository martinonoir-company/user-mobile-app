import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Screen } from '@/components/Screen';
import { api, ShippingTracking } from '@/lib/api';
import { colors, radius, spacing, text } from '@/theme';

const STATUS_LABELS: Record<number, string> = {
  0: 'Label created',
  1: 'Picked up',
  2: 'In transit',
  3: 'Out for delivery',
  4: 'Delivered',
};

export default function TrackOrderScreen() {
  const [orderNumber, setOrderNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tracking, setTracking] = useState<ShippingTracking | null>(null);

  const handleSubmit = async () => {
    setError(null);
    setTracking(null);
    if (!orderNumber.trim()) {
      setError('Enter an order number.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.trackByOrderNumber(orderNumber.trim());
      setTracking(res.data);
    } catch (err: unknown) {
      const msg = (err as { message?: string | string[] })?.message;
      setError(Array.isArray(msg) ? msg[0]! : msg || 'Order not found.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll keyboardAware edges={['bottom']}>
      <Text style={styles.heading}>Track Order</Text>
      <Text style={styles.subhead}>Check the status of your delivery.</Text>

      <View style={{ gap: spacing[4], marginTop: spacing[5] }}>
        <Input
          label="Order number"
          autoCapitalize="characters"
          placeholder="e.g. MN-260623-00042"
          value={orderNumber}
          onChangeText={setOrderNumber}
        />
        <Button
          title="Track"
          onPress={handleSubmit}
          loading={loading}
          fullWidth
          size="lg"
          icon={<Ionicons name="navigate-outline" size={16} color="#fff" />}
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {tracking ? (
        <View style={styles.card}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: spacing[2],
            }}
          >
            <Text style={styles.cardTitle}>
              Order #{tracking.orderNumber ?? orderNumber.trim()}
            </Text>
            <Badge
              label={
                tracking.optedOut
                  ? 'Self-pickup'
                  : tracking.pending
                    ? 'Preparing'
                    : STATUS_LABELS[tracking.status ?? 0] ?? 'Processing'
              }
              tone={tracking.status === 4 ? 'success' : 'primary'}
            />
          </View>

          {tracking.trackingNumber ? (
            <Text style={styles.trackingNo}>AAJ {tracking.trackingNumber}</Text>
          ) : null}

          {tracking.optedOut ? (
            <Text style={styles.eventDesc}>
              This order was placed for self-pickup, so there is no delivery to
              track.
            </Text>
          ) : tracking.pending ? (
            <Text style={styles.eventDesc}>
              {tracking.description ||
                "We're still arranging your shipment. Check back shortly."}
            </Text>
          ) : (
            <>
              {tracking.etaDate && tracking.status !== 4 ? (
                <Text style={styles.eta}>
                  Estimated delivery{' '}
                  {new Date(tracking.etaDate).toLocaleDateString('en-NG', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
              ) : null}
              <View style={{ marginTop: spacing[3] }}>
                {[...tracking.events].reverse().map((e, i) => (
                  <View key={i} style={styles.event}>
                    <Text style={styles.eventStatus}>{e.description}</Text>
                    <Text style={styles.eventMeta}>
                      {e.location ? `${e.location} · ` : ''}
                      {new Date(e.dateTime).toLocaleString()}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { ...text['2xl'], fontWeight: '700', color: colors.ink[900], marginTop: spacing[4] },
  subhead: { ...text.sm, color: colors.ink[500], marginTop: 4 },
  error: { ...text.sm, color: colors.danger, marginTop: spacing[3] },
  card: {
    marginTop: spacing[5],
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.ink[100],
    borderRadius: radius.xl,
  },
  cardTitle: { ...text.base, fontWeight: '700', color: colors.ink[900] },
  trackingNo: {
    ...text.xs,
    color: colors.ink[500],
    fontFamily: 'monospace',
    marginBottom: spacing[2],
  },
  eta: { ...text.sm, color: colors.ink[700], marginTop: spacing[1] },
  event: {
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.ink[100],
  },
  eventStatus: { ...text.sm, fontWeight: '700', color: colors.ink[900] },
  eventDesc: { ...text.sm, color: colors.ink[600], marginTop: 2 },
  eventMeta: { ...text.xs, color: colors.ink[400], marginTop: 2 },
});
