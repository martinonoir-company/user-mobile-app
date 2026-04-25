import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Badge } from '@/components/Badge';
import { LoadingView } from '@/components/LoadingView';
import { api, Order } from '@/lib/api';
import { formatPrice } from '@/lib/price';
import { colors, radius, spacing, text } from '@/theme';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api
      .getOrder(id)
      .then((res) => setOrder(res.data))
      .catch(() => setError('Order not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingView />;
  if (error || !order) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing[6] }}>
        <Text style={text.base}>{error ?? 'Order not found.'}</Text>
      </View>
    );
  }

  const addr = order.shippingAddress as Record<string, string>;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.surface[0] }}>
      <View style={{ padding: spacing[4] }}>
        <View style={styles.headRow}>
          <Text style={styles.orderNo}>#{order.orderNumber}</Text>
          <Badge label={order.status.replace(/_/g, ' ')} tone="primary" />
        </View>
        <Text style={styles.date}>
          Placed {new Date(order.createdAt).toLocaleString()}
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Items</Text>
          {order.items.map((line) => (
            <View key={line.id} style={styles.lineRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{line.productName}</Text>
                {line.variantName ? (
                  <Text style={styles.itemVariant}>{line.variantName}</Text>
                ) : null}
                <Text style={styles.itemQty}>Qty {line.quantity}</Text>
              </View>
              <Text style={styles.itemPrice}>
                {formatPrice(line.lineTotal, order.currency)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Shipping To</Text>
          <Text style={styles.addrLine}>
            {addr.firstName} {addr.lastName}
          </Text>
          <Text style={styles.addrLine}>{addr.line1}</Text>
          {addr.line2 ? <Text style={styles.addrLine}>{addr.line2}</Text> : null}
          <Text style={styles.addrLine}>
            {addr.city}, {addr.state}, {addr.country}
          </Text>
          {addr.phone ? <Text style={styles.addrLine}>{addr.phone}</Text> : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Summary</Text>
          <Row label="Subtotal" value={formatPrice(order.subtotal, order.currency)} />
          {Number(order.discountTotal) > 0 ? (
            <Row
              label="Discount"
              value={`-${formatPrice(order.discountTotal, order.currency)}`}
            />
          ) : null}
          <Row label="Shipping" value={formatPrice(order.shippingTotal, order.currency)} />
          <Row label="Tax" value={formatPrice(order.taxTotal, order.currency)} />
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              {formatPrice(order.grandTotal, order.currency)}
            </Text>
          </View>
        </View>

        {order.statusHistory.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Status History</Text>
            {order.statusHistory.map((h, i) => (
              <View key={i} style={styles.historyRow}>
                <Text style={styles.historyStatus}>
                  {h.fromStatus} → {h.toStatus}
                </Text>
                <Text style={styles.historyDate}>
                  {new Date(h.createdAt).toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={{ height: spacing[10] }} />
      </View>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderNo: { ...text['2xl'], fontWeight: '700', color: colors.ink[900] },
  date: { ...text.sm, color: colors.ink[500], marginTop: 2 },
  card: {
    marginTop: spacing[5],
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.ink[100],
    borderRadius: radius.xl,
  },
  cardTitle: { ...text.base, fontWeight: '700', color: colors.ink[900], marginBottom: spacing[3] },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.ink[100],
  },
  itemName: { ...text.sm, fontWeight: '700', color: colors.ink[900] },
  itemVariant: { ...text.xs, color: colors.ink[500], marginTop: 2 },
  itemQty: { ...text.xs, color: colors.ink[400], marginTop: 2 },
  itemPrice: { ...text.sm, fontWeight: '700', color: colors.ink[900] },
  addrLine: { ...text.sm, color: colors.ink[700], marginBottom: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  rowLabel: { ...text.sm, color: colors.ink[500] },
  rowValue: { ...text.sm, color: colors.ink[900] },
  totalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing[3],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.ink[100],
  },
  totalLabel: { ...text.base, fontWeight: '700', color: colors.ink[900] },
  totalValue: { ...text.xl, fontWeight: '700', color: colors.ink[900] },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  historyStatus: { ...text.sm, color: colors.ink[700], fontWeight: '600' },
  historyDate: { ...text.xs, color: colors.ink[500] },
});
