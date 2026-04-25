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
  View,
} from 'react-native';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { api, Product, ProductVariant, StockLevel } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { formatPrice, getVariantPriceMinor } from '@/lib/price';
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
    setAddingToCart(true);
    try {
      addItem({
        variantId: selectedVariant.id,
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        variantName: selectedVariant.name,
        sku: selectedVariant.sku,
        priceNgn: parseInt(selectedVariant.retailPriceNgn, 10),
        priceUsd: parseInt(selectedVariant.retailPriceUsd, 10),
        options: selectedVariant.options ?? {},
        imageUrl: product.media?.[0]?.url,
      });
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

  const media = product.media ?? [];
  const stockLeft = stock ? stock.onHand - stock.reserved : null;
  const outOfStock = selectedVariant?.trackInventory && stockLeft !== null && stockLeft <= 0;
  const inactive = selectedVariant && !selectedVariant.isActive;
  const canAdd = !!selectedVariant && !outOfStock && !inactive;
  const priceMinor = selectedVariant ? getVariantPriceMinor(selectedVariant, currency) : 0;

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
            <View style={styles.dots}>
              {media.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, activeImage === i && styles.dotActive]}
                />
              ))}
            </View>
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
            stockLeft === null ? null : stockLeft <= 0 ? (
              <Badge tone="danger" label="Out of stock" />
            ) : stockLeft <= 5 ? (
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
            title={outOfStock ? 'Out of stock' : inactive ? 'Unavailable' : 'Add to Bag'}
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
