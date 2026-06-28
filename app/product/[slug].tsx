import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { api, Product, ProductVariant, StockLevel } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { formatPrice, getVariantPriceMinor } from '@/lib/price';
import { useWholesaleMinQty } from '@/lib/wholesale';
import { colors, radius, spacing, text } from '@/theme';

const { width: screenWidth } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { isAuthenticated, currency } = useAuth();
  const { addItem } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [variantId, setVariantId] = useState<string | null>(null);
  const [stock, setStock] = useState<StockLevel | null>(null);
  const [addingToCart, setAddingToCart] = useState(false);
  // Admin-configured wholesale minimum order quantity.
  const MIN_WHOLESALE_QTY = useWholesaleMinQty();
  // Wholesale: when on, line is priced at wholesale and qty must be ≥ minimum.
  const [isWholesaleMode, setIsWholesaleMode] = useState(false);
  const [wholesaleQty, setWholesaleQty] = useState(String(MIN_WHOLESALE_QTY));
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistError, setWishlistError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setLoading(true);
    api
      .getProductBySlug(slug)
      .then((res) => {
        if (cancelled) return;
        setProduct(res.data);
        // Default to first active variant.
        const first = res.data.variants?.find((v) => v.isActive) ?? res.data.variants?.[0];
        if (first) setVariantId(first.id);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const selectedVariant = useMemo(
    () => product?.variants?.find((v) => v.id === variantId) ?? null,
    [product, variantId],
  );

  // Whenever the user picks a different variant, snap the carousel
  // back to the first image so the dots and the displayed image agree
  // when the media list swaps from product-level to variant-specific
  // (and may have a different length).
  useEffect(() => {
    setActiveImage(0);
  }, [selectedVariant?.id]);

  useEffect(() => {
    if (!selectedVariant?.trackInventory) {
      setStock(null);
      return;
    }
    let cancelled = false;
    api
      .getStockLevel(selectedVariant.id)
      .then((res) => {
        if (!cancelled) setStock(res.data);
      })
      .catch(() => {
        if (!cancelled) setStock(null);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedVariant?.id, selectedVariant?.trackInventory]);

  // Keep wishlist state fresh when product/auth changes.
  useEffect(() => {
    if (!isAuthenticated || !product) {
      setIsWishlisted(false);
      return;
    }
    let cancelled = false;
    api
      .checkWishlisted([product.id])
      .then((res) => {
        if (!cancelled) setIsWishlisted(res.data.wishlisted.includes(product.id));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, product]);

  const onAddToCart = async () => {
    if (!product || !selectedVariant || addingToCart) return;
    const qty = isWholesaleMode ? parseInt(wholesaleQty, 10) || 0 : 1;
    if (isWholesaleMode && qty < MIN_WHOLESALE_QTY) return;
    setAddingToCart(true);
    try {
      // Cart thumbnail: prefer an image tagged to the selected variant
      // so the cart / checkout shows what the customer picked; fall back
      // to a product-level image. Display-only — variantId is unchanged.
      const variantImage =
        product.media?.find((m) => m.variantId === selectedVariant.id)?.url ??
        product.media?.find((m) => !m.variantId)?.url ??
        product.media?.[0]?.url;
      // Wholesale lines carry the wholesale price; server re-derives at checkout.
      const priceNgn = isWholesaleMode
        ? parseInt(selectedVariant.wholesalePriceNgn, 10)
        : parseInt(selectedVariant.retailPriceNgn, 10);
      const priceUsd = isWholesaleMode
        ? parseInt(selectedVariant.wholesalePriceUsd, 10)
        : parseInt(selectedVariant.retailPriceUsd, 10);
      addItem(
        {
          variantId: selectedVariant.id,
          productId: product.id,
          productName: product.name,
          productSlug: product.slug,
          variantName: selectedVariant.name,
          sku: selectedVariant.sku,
          priceNgn,
          priceUsd,
          options: selectedVariant.options ?? {},
          imageUrl: variantImage,
          isWholesale: isWholesaleMode,
        },
        qty,
      );
    } finally {
      // Give the optimistic update a tick before unlocking so the button can
      // display a small success pulse.
      setTimeout(() => setAddingToCart(false), 400);
    }
  };

  const onToggleWishlist = async () => {
    if (!product) return;
    setWishlistError(null);
    if (!isAuthenticated) {
      router.push(`/(auth)/login?next=/product/${product.slug}` as never);
      return;
    }
    setWishlistLoading(true);
    try {
      if (isWishlisted) {
        await api.removeFromWishlist(product.id);
        setIsWishlisted(false);
      } else {
        await api.addToWishlist(product.id, selectedVariant?.id);
        setIsWishlisted(true);
      }
    } catch (err: unknown) {
      const msg = (err as { message?: string | string[] })?.message;
      setWishlistError((Array.isArray(msg) ? msg[0] : msg) || 'Wishlist action failed.');
    } finally {
      setWishlistLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary[700]} />
      </View>
    );
  }

  if (notFound || !product) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'Not found' }} />
        <Text style={styles.title}>Product not found</Text>
        <Text style={styles.body}>It may have been removed.</Text>
        <Button
          title="Back to shop"
          onPress={() => router.replace('/(tabs)/shop')}
          style={{ marginTop: spacing[4] }}
        />
      </View>
    );
  }

  // Show variant-specific media when the selected variant has any;
  // otherwise fall back to the product's own gallery.
  const allMedia = product.media ?? [];
  const variantMedia = selectedVariant
    ? allMedia.filter((m) => m.variantId === selectedVariant.id)
    : [];
  const productMediaList = allMedia.filter((m) => !m.variantId);
  const media = variantMedia.length > 0 ? variantMedia : productMediaList;
  const stockLeft = stock ? stock.onHand - stock.reserved : null;
  // A tracked variant with NO stock-level row (stock === null) has nothing on
  // hand → out of stock. Previously this fell through to "addable" and the
  // server then rejected the order at checkout with "available 0".
  const outOfStock =
    !!selectedVariant?.trackInventory &&
    (stock === null || (stockLeft !== null && stockLeft <= 0));
  const inactive = selectedVariant && !selectedVariant.isActive;
  const wholesaleQtyNum = parseInt(wholesaleQty, 10) || 0;
  const wholesaleQtyOk = !isWholesaleMode || wholesaleQtyNum >= MIN_WHOLESALE_QTY;
  const canAdd = !!selectedVariant && !outOfStock && !inactive && wholesaleQtyOk;
  // Show wholesale unit price when wholesale mode is on.
  const priceMinor = selectedVariant
    ? isWholesaleMode
      ? Number(
          currency === 'USD'
            ? selectedVariant.wholesalePriceUsd
            : selectedVariant.wholesalePriceNgn,
        )
      : getVariantPriceMinor(selectedVariant, currency)
    : 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface[0] }}>
      <Stack.Screen options={{ title: '' }} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
        {/* Gallery */}
        <View>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
              setActiveImage(index);
            }}
          >
            {(media.length > 0 ? media : [null]).map((m, i) => (
              <View key={m?.id ?? i} style={[styles.galleryItem, { width: screenWidth }]}>
                {m ? (
                  <Image source={m.url} style={styles.galleryImage} contentFit="cover" />
                ) : (
                  <View style={[styles.galleryImage, styles.galleryPlaceholder]}>
                    <Ionicons name="image-outline" size={48} color={colors.ink[300]} />
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
          {media.length > 1 ? (
            <>
              {/* Image counter */}
              <View style={styles.imageCounter}>
                <Text style={styles.imageCounterText}>
                  {activeImage + 1}/{media.length}
                </Text>
              </View>
              {/* Swipe hint — fades out once the user has swiped. */}
              {activeImage === 0 ? (
                <View style={styles.swipeHint}>
                  <Ionicons name="chevron-back" size={12} color="#fff" />
                  <Text style={styles.swipeHintText}>Swipe for more</Text>
                  <Ionicons name="chevron-forward" size={12} color="#fff" />
                </View>
              ) : null}
              <View style={styles.dots}>
                {media.map((_, i) => (
                  <View
                    key={i}
                    style={[styles.dot, activeImage === i && styles.dotActive]}
                  />
                ))}
              </View>
            </>
          ) : null}
        </View>

        <View style={styles.body}>
          {product.category?.name ? (
            <Text style={styles.category}>{product.category.name.toUpperCase()}</Text>
          ) : null}
          <Text style={styles.title}>{product.name}</Text>

          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatPrice(priceMinor, currency)}</Text>
            {selectedVariant?.compareAtPriceNgn && currency === 'NGN' ? (
              <Text style={styles.compareAt}>
                {formatPrice(selectedVariant.compareAtPriceNgn, 'NGN')}
              </Text>
            ) : null}
          </View>

          {/* Stock badge */}
          {selectedVariant?.trackInventory ? (
            outOfStock ? (
              <Badge tone="danger" label="Out of stock: restocking" />
            ) : stockLeft === null ? null : stockLeft <= 5 ? (
              <Badge tone="warning" label={`Only ${stockLeft} left`} />
            ) : (
              <Badge tone="success" label="In stock" />
            )
          ) : null}

          {product.shortDescription ? (
            <Text style={styles.shortDesc}>{product.shortDescription}</Text>
          ) : null}

          {/* Variants */}
          {product.variants.length > 1 ? (
            <View style={{ marginTop: spacing[5] }}>
              <Text style={styles.sectionLabel}>Select variant</Text>
              <View style={styles.variantRow}>
                {product.variants.map((v) => (
                  <VariantChip
                    key={v.id}
                    variant={v}
                    currency={currency}
                    selected={v.id === variantId}
                    onPress={() => setVariantId(v.id)}
                  />
                ))}
              </View>
            </View>
          ) : null}

          {/* Wholesale toggle */}
          {canAdd || isWholesaleMode ? (
            <View style={{ marginTop: spacing[6] }}>
              <Pressable
                onPress={() =>
                  setIsWholesaleMode((v) => {
                    const next = !v;
                    // Seed the qty to the (configured) minimum when turning on.
                    if (next) setWholesaleQty(String(MIN_WHOLESALE_QTY));
                    return next;
                  })
                }
                style={[
                  styles.wholesaleToggle,
                  isWholesaleMode && styles.wholesaleToggleOn,
                ]}
              >
                <Ionicons
                  name={isWholesaleMode ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={isWholesaleMode ? colors.warning : colors.ink[400]}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.wholesaleTitle}>Buy wholesale</Text>
                  <Text style={styles.wholesaleSub}>
                    Wholesale pricing for bulk purchases
                  </Text>
                </View>
              </Pressable>
              {isWholesaleMode ? (
                <View style={{ marginTop: spacing[3] }}>
                  <Text style={styles.wholesaleNote}>
                    Minimum order quantity for wholesale is {MIN_WHOLESALE_QTY}.
                  </Text>
                  <Text style={styles.sectionLabel}>Wholesale quantity</Text>
                  <TextInput
                    value={wholesaleQty}
                    onChangeText={(t) => setWholesaleQty(t.replace(/[^0-9]/g, ''))}
                    keyboardType="number-pad"
                    style={styles.qtyInput}
                  />
                  {wholesaleQtyNum < MIN_WHOLESALE_QTY ? (
                    <Text style={styles.qtyError}>
                      Enter at least {MIN_WHOLESALE_QTY} to add a wholesale order.
                    </Text>
                  ) : null}
                </View>
              ) : null}
            </View>
          ) : null}

          {product.description ? (
            <View style={{ marginTop: spacing[6] }}>
              <Text style={styles.sectionLabel}>Description</Text>
              <Text style={styles.description}>{product.description}</Text>
            </View>
          ) : null}

          {wishlistError ? (
            <Text style={{ ...text.xs, color: colors.danger, marginTop: spacing[3] }}>
              {wishlistError}
            </Text>
          ) : null}
        </View>
      </ScrollView>

      {/* Bottom action bar */}
      <View style={styles.bottomBar}>
        <Pressable
          onPress={onToggleWishlist}
          disabled={wishlistLoading || !product}
          style={[styles.wishlistBtn, isWishlisted && styles.wishlistBtnActive]}
        >
          <Ionicons
            name={isWishlisted ? 'heart' : 'heart-outline'}
            size={22}
            color={isWishlisted ? colors.danger : colors.ink[700]}
          />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Button
            title={outOfStock ? 'Out of stock: restocking' : inactive ? 'Unavailable' : 'Add to Bag'}
            onPress={onAddToCart}
            disabled={!canAdd}
            loading={addingToCart}
            size="lg"
            fullWidth
          />
        </View>
      </View>
    </View>
  );
}

function VariantChip({
  variant,
  currency,
  selected,
  onPress,
}: {
  variant: ProductVariant;
  currency: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.variantChip, selected && styles.variantChipActive]}
    >
      <Text style={[styles.variantName, selected && { color: '#fff' }]}>
        {variant.name}
      </Text>
      <Text style={[styles.variantPrice, selected && { color: colors.primary[100] }]}>
        {formatPrice(getVariantPriceMinor(variant, currency), currency)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing[6] },
  galleryItem: { aspectRatio: 3 / 4, backgroundColor: colors.surface[2] },
  galleryImage: { flex: 1 },
  galleryPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  dots: {
    position: 'absolute',
    bottom: spacing[3],
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: { backgroundColor: '#fff', width: 18 },
  imageCounter: {
    position: 'absolute',
    top: spacing[3],
    right: spacing[3],
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radius.full,
    backgroundColor: 'rgba(17,17,17,0.6)',
  },
  imageCounterText: { ...text.xs, color: '#fff', fontWeight: '600' },
  swipeHint: {
    position: 'absolute',
    bottom: spacing[6],
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing[3],
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: 'rgba(17,17,17,0.7)',
  },
  swipeHintText: { ...text.xs, color: '#fff', fontWeight: '600' },
  body: { padding: spacing[5] },
  category: {
    ...text.xs,
    color: colors.primary[600],
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: spacing[2],
  },
  title: {
    ...text['2xl'],
    fontWeight: '700',
    color: colors.ink[900],
    marginBottom: spacing[3],
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  price: { ...text['2xl'], fontWeight: '700', color: colors.ink[900] },
  compareAt: {
    ...text.base,
    color: colors.ink[400],
    textDecorationLine: 'line-through',
  },
  shortDesc: {
    ...text.sm,
    color: colors.ink[600],
    marginTop: spacing[3],
    lineHeight: 22,
  },
  sectionLabel: {
    ...text.xs,
    fontWeight: '700',
    color: colors.ink[700],
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing[3],
  },
  wholesaleToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    borderWidth: 2,
    borderColor: colors.ink[200],
    borderRadius: radius.lg,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  wholesaleToggleOn: { borderColor: colors.warning, backgroundColor: '#FFFBEB' },
  wholesaleTitle: { ...text.sm, fontWeight: '700', color: colors.ink[900] },
  wholesaleSub: { ...text.xs, color: colors.ink[500] },
  wholesaleNote: {
    ...text.xs,
    color: '#92400E',
    backgroundColor: '#FEF3C7',
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    marginBottom: spacing[3],
  },
  qtyInput: {
    ...text.base,
    borderWidth: 1,
    borderColor: colors.ink[200],
    borderRadius: radius.lg,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    width: 120,
    color: colors.ink[900],
  },
  qtyError: { ...text.xs, color: colors.danger, marginTop: spacing[2] },
  variantRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  variantChip: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.ink[200],
    backgroundColor: colors.surface[0],
    minWidth: 100,
  },
  variantChipActive: {
    borderColor: colors.primary[700],
    backgroundColor: colors.primary[700],
  },
  variantName: { ...text.sm, fontWeight: '700', color: colors.ink[900] },
  variantPrice: { ...text.xs, color: colors.ink[500], marginTop: 2 },
  description: { ...text.sm, color: colors.ink[600], lineHeight: 22 },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: spacing[3],
    padding: spacing[4],
    paddingBottom: spacing[6],
    backgroundColor: colors.surface[0],
    borderTopWidth: 1,
    borderTopColor: colors.ink[100],
    alignItems: 'center',
  },
  wishlistBtn: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.ink[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  wishlistBtnActive: { borderColor: colors.dangerLight, backgroundColor: colors.dangerLight },
});
