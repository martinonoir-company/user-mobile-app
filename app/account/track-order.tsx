import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Screen } from '@/components/Screen';
import { api } from '@/lib/api';
import { colors, radius, spacing, text } from '@/theme';

type TrackingResult = {
  trackingNumber: string;
  carrier: string;
  currentStatus: string;
  events: Array<{ timestamp: string; status: string; location: string; description: string }>;
};

export default function TrackOrderScreen() {
  const [mode, setMode] = useState<'order' | 'tracking'>('order');
  const [orderNumber, setOrderNumber] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tracking, setTracking] = useState<TrackingResult | null>(null);
  const [orderStatus, setOrderStatus] = useState<string | null>(null);

  const reset = () => {
    setError(null);
    setTracking(null);
    setOrderStatus(null);
  };

  const handleSubmit = async () => {
    reset();
    setLoading(true);
    try {
      if (mode === 'order') {
        if (!orderNumber.trim()) {
          setError('Enter an order number.');
          return;
        }
        const res = await api.getOrderByNumber(orderNumber.trim());
        setOrderStatus(res.data.status);
      } else {
        if (!trackingNumber.trim()) {
          setError('Enter a tracking number.');
          return;
        }
        const res = await api.trackShipment(trackingNumber.trim());
        setTracking(res.data);
      }
    } catch (err: unknown) {
      const msg = (err as { message?: string | string[] })?.message;
      setError(Array.isArray(msg) ? msg[0]! : msg || 'Not found.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll keyboardAware edges={['bottom']}>
      <Text style={styles.heading}>Track Order</Text>
      <Text style={styles.subhead}>Check the status of your delivery.</Text>

      <View style={styles.tabs}>
        <Tab label="By Order #" active={mode === 'order'} onPress={() => setMode('order')} />
        <Tab
          label="By Tracking #"
          active={mode === 'tracking'}
          onPress={() => setMode('tracking')}
        />
      </View>

      <View style={{ gap: spacing[4], marginTop: spacing[4] }}>
        {mode === 'order' ? (
          <Input
            label="Order number"
            autoCapitalize="characters"
            value={orderNumber}
            onChangeText={setOrderNumber}
          />
        ) : (
          <Input
            label="Tracking number"
            autoCapitalize="characters"
            value={trackingNumber}
            onChangeText={setTrackingNumber}
          />
        )}

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

      {orderStatus ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order #{orderNumber}</Text>
          <Badge label={orderStatus.replace(/_/g, ' ').toUpperCase()} tone="primary" />
        </View>
      ) : null}

      {tracking ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {tracking.carrier} • {tracking.trackingNumber}
          </Text>
          <Badge label={tracking.currentStatus} tone="primary" />
          <ScrollView style={{ marginTop: spacing[4] }}>
            {tracking.events.map((e, i) => (
              <View key={i} style={styles.event}>
                <Text style={styles.eventStatus}>{e.status}</Text>
                <Text style={styles.eventDesc}>{e.description}</Text>
                <Text style={styles.eventMeta}>
                  {e.location} · {new Date(e.timestamp).toLocaleString()}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </Screen>
  );
}

function Tab({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Text
      onPress={onPress}
      style={[styles.tab, active && styles.tabActive]}
    >
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  heading: { ...text['2xl'], fontWeight: '700', color: colors.ink[900], marginTop: spacing[4] },
  subhead: { ...text.sm, color: colors.ink[500], marginTop: 4 },
  tabs: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[5],
  },
  tab: {
    ...text.sm,
    fontWeight: '600',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
    backgroundColor: colors.surface[1],
    color: colors.ink[600],
  },
  tabActive: {
    backgroundColor: colors.ink[900],
    color: '#fff',
  },
  error: { ...text.sm, color: colors.danger, marginTop: spacing[3] },
  card: {
    marginTop: spacing[5],
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.ink[100],
    borderRadius: radius.xl,
  },
  cardTitle: { ...text.base, fontWeight: '700', color: colors.ink[900], marginBottom: spacing[2] },
  event: {
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.ink[100],
  },
  eventStatus: { ...text.sm, fontWeight: '700', color: colors.ink[900] },
  eventDesc: { ...text.sm, color: colors.ink[600], marginTop: 2 },
  eventMeta: { ...text.xs, color: colors.ink[400], marginTop: 2 },
});
