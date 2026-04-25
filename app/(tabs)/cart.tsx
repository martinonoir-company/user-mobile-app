import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { TopBar } from '@/components/TopBar';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { formatPrice } from '@/lib/price';
import { colors, radius, spacing, text } from '@/theme';

export default function CartScreen() {
  const { items, itemCount, syncing, updateQuantity, removeItem, clearCart, getSubtotal } =
    useCart();
  const { currency } = useAuth();

  const subtotal = getSubtotal(currency);
  const hasUnavailable = items.some((i) => i.unavailable);
  const canCheckout = !hasUnavailable && !syncing && items.length > 0;

  if (items.length === 0) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.surface[0] }}>
        <TopBar title="Bag" showSearch={false} />
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <EmptyState
            icon={<Ionicons name="bag-outline" size={60} color={colors.ink[200]} />}
            title="Your bag is empty"
            subtitle="Looks like you haven't added anything yet."
            action={<Button title="Continue Shopping" onPress={() => router.push('/(tabs)/shop')} />}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.surface[0] }}>
      <TopBar title="Bag" showSearch={false} />

      <ScrollView contentContainerStyle={{ paddingBottom: spacing[10] }}>
        <View style={styles.countRow}>
          <Text style={styles.countText}>
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </Text>
          <Pressable onPress={clearCart} hitSlop={8}>
            <Text style={styles.clearText}>Clear all</Text>
          </Pressable>
        </View>

        {items.map((item) => (
          <View key={item.variantId} style={styles.row}>
            <Pressable
              onPress={() => router.push(`/product/${item.productSlug}` as never)}
              style={styles.imageBox}
            >
              {item.imageUrl ? (
                <Image source={item.imageUrl} style={styles.image} contentFit="cover" />
              ) : (
                <View style={[styles.image, styles.imagePlaceholder]}>
                  <Ionicons name="image-outline" size={24} color={colors.ink[300]} />
                </View>
              )}
            </Pressable>

            <View style={{ flex: 1 }}>
              <Pressable onPress={() => router.push(`/product/${item.productSlug}` as never)}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.productName}
                </Text>
              </Pressable>
              {item.variantName ? (
                <Text style={styles.variant}>{item.variantName}</Text>
              ) : null}
              <Text style={styles.sku}>SKU: {item.sku}</Text>

              {item.unavailable ? (
                <View style={{ marginTop: 4 }}>
                  <Badge tone="danger" label="No longer available" />
                </View>
              ) : item.priceChanged ? (
                <View style={{ marginTop: 4 }}>
                  <Badge
                    tone="warning"
                    label={`New price ${formatPrice(
                      (currency === 'USD' ? item.currentPriceUsd : item.currentPriceNgn) ?? 0,
                      currency,
                    )}`}
                  />
                </View>
              ) : null}

              <View style={styles.ctrlRow}>
                <View style={styles.qtyBox}>
                  <Pressable
                    onPress={() => updateQuantity(item.variantId, item.quantity - 1)}
                    style={styles.qtyBtn}
                  >
                    <Ionicons name="remove" size={16} color={colors.ink[700]} />
                  </Pressable>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <Pressable
                    onPress={() => updateQuantity(item.variantId, item.quantity + 1)}
                    style={styles.qtyBtn}
                  >
                    <Ionicons name="add" size={16} color={colors.ink[700]} />
                  </Pressable>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
                  <Text style={styles.price}>
                    {formatPrice(
                      (currency === 'USD' ? item.priceUsd : item.priceNgn) * item.quantity,
                      currency,
                    )}
                  </Text>
                  <Pressable onPress={() => removeItem(item.variantId)} hitSlop={8}>
                    <Ionicons name="trash-outline" size={18} color={colors.ink[400]} />
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        ))}

        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatPrice(subtotal, currency)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping</Text>
            <Text style={styles.summaryValue}>Calculated at checkout</Text>
          </View>
          <View style={[styles.summaryRow, { marginTop: spacing[2] }]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatPrice(subtotal, currency)}</Text>
          </View>

          {hasUnavailable ? (
            <Text style={styles.warning}>Remove unavailable items before checkout.</Text>
          ) : null}

          <Button
            title={syncing ? 'Syncing…' : 'Proceed to Checkout'}
            onPress={() => router.push('/checkout')}
            disabled={!canCheckout}
            fullWidth
            size="lg"
            style={{ marginTop: spacing[4] }}
            iconRight={
              canCheckout ? <Ionicons name="arrow-forward" size={16} color="#fff" /> : undefined
            }
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  countRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[2],
  },
  countText: { ...text.sm, color: colors.ink[500] },
  clearText: { ...text.sm, color: colors.danger, fontWeight: '600' },
  row: {
    flexDirection: 'row',
    gap: spacing[3],
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.ink[100],
  },
  imageBox: {
    width: 80,
    height: 96,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface[2],
  },
  image: { flex: 1 },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  name: { ...text.sm, fontWeight: '700', color: colors.ink[900] },
  variant: { ...text.xs, color: colors.ink[500], marginTop: 2 },
  sku: { ...text.xs, color: colors.ink[400], marginTop: 2 },
  ctrlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing[3],
  },
  qtyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.ink[200],
    borderRadius: radius.md,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: { ...text.sm, fontWeight: '700', color: colors.ink[900], width: 32, textAlign: 'center' },
  price: { ...text.sm, fontWeight: '700', color: colors.ink[900] },
  summary: {
    margin: spacing[4],
    padding: spacing[5],
    backgroundColor: colors.surface[1],
    borderRadius: radius.xl,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  summaryLabel: { ...text.sm, color: colors.ink[500] },
  summaryValue: { ...text.sm, color: colors.ink[900], fontWeight: '600' },
  totalLabel: { ...text.base, color: colors.ink[900], fontWeight: '700' },
  totalValue: { ...text.xl, color: colors.ink[900], fontWeight: '700' },
  warning: {
    ...text.xs,
    color: colors.danger,
    marginTop: spacing[3],
  },
});
