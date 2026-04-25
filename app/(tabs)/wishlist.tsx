import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { LoadingView } from '@/components/LoadingView';
import { api, WishlistItem } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { getVariantPrice } from '@/lib/price';
import { colors, radius, spacing, text } from '@/theme';

export default function WishlistScreen() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { addItem } = useCart();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const loadWishlist = useCallback(async () => {
    try {
      const res = await api.getWishlist();
      setItems(res.data);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    loadWishlist().finally(() => setLoading(false));
  }, [isAuthenticated, authLoading, loadWishlist]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadWishlist();
    setRefreshing(false);
  }, [loadWishlist]);

  const handleRemove = useCallback(async (productId: string) => {
    setRemovingId(productId);
    const snapshot = items;
    setItems((prev) => prev.filter((i) => i.productId !== productId));
    try {
      await api.removeFromWishlist(productId);
    } catch {
      setItems(snapshot);
    } finally {
      setRemovingId(null);
    }
  }, [items]);

  const handleMoveToBag = useCallback(
    (item: WishlistItem) => {
      const v = item.variant ?? item.product.variants?.[0];
      if (!v) {
        Alert.alert('Unavailable', 'This product has no available variant.');
        return;
      }
      addItem({
        variantId: v.id,
        productId: item.productId,
        productName: item.product.name,
        productSlug: item.product.slug,
        variantName: v.name,
        sku: v.sku,
        priceNgn: parseInt(v.retailPriceNgn, 10),
        priceUsd: parseInt(v.retailPriceUsd, 10),
        options: v.options ?? {},
        imageUrl: item.product.media?.[0]?.url,
      });
      void handleRemove(item.productId);
    },
    [addItem, handleRemove],
  );

  const handleClearAll = useCallback(() => {
    if (items.length === 0) return;
    Alert.alert(
      'Clear Wishlist',
      'Remove all items from your wishlist?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            const snapshot = items;
            setItems([]);
            try {
              await api.clearWishlist();
            } catch {
              setItems(snapshot);
            }
          },
        },
      ],
    );
  }, [items]);

  if (authLoading) return <LoadingView />;

  if (!isAuthenticated) {
    return (
      <View style={styles.gate}>
        <Ionicons name="heart-outline" size={48} color={colors.ink[200]} />
        <Text style={styles.gateTitle}>Sign In to View Wishlist</Text>
        <Text style={styles.gateSub}>Save your favorite items for later.</Text>
        <Button
          title="Sign In"
          onPress={() => router.push('/(auth)/login?next=/(tabs)/wishlist' as never)}
          size="lg"
          style={{ marginTop: spacing[5], minWidth: 200 }}
        />
      </View>
    );
  }

  if (loading) return <LoadingView />;

  if (items.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <EmptyState
          icon={<Ionicons name="heart-outline" size={64} color={colors.ink[200]} />}
          title="Your Wishlist is Empty"
          subtitle="Browse our collection and save your favorites."
          action={
            <Button
              title="Explore Products"
              onPress={() => router.push('/(tabs)/shop')}
              size="lg"
              style={{ minWidth: 220 }}
            />
          }
        />
      </View>
    );
  }

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: colors.surface[0] }}
      data={items}
      keyExtractor={(i) => i.id}
      numColumns={2}
      columnWrapperStyle={{ gap: spacing[3] }}
      contentContainerStyle={{ padding: spacing[4], gap: spacing[4] }}
      ListHeaderComponent={
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Wishlist</Text>
            <Text style={styles.countText}>
              {items.length} {items.length === 1 ? 'item' : 'items'} saved
            </Text>
          </View>
          <Pressable onPress={handleClearAll} hitSlop={8}>
            <Text style={styles.clearText}>Clear All</Text>
          </Pressable>
        </View>
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.primary[700]}
        />
      }
      renderItem={({ item }) => {
        const product = item.product;
        const firstVariant = item.variant ?? product.variants?.[0];
        const firstMedia = product.media?.[0];
        const isRemoving = removingId === item.productId;

        return (
          <View style={styles.card}>
            <Pressable
              onPress={() => router.push(`/product/${product.slug}` as never)}
              style={styles.imageWrap}
            >
              {firstMedia?.url ? (
                <Image
                  source={{ uri: firstMedia.url }}
                  style={styles.image}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="bag-outline" size={40} color={colors.ink[300]} />
                </View>
              )}
            </Pressable>

            <View style={styles.body}>
              <Text style={styles.category} numberOfLines={1}>
                {product.category?.name ?? 'Bags'}
              </Text>
              <Pressable onPress={() => router.push(`/product/${product.slug}` as never)}>
                <Text style={styles.name} numberOfLines={2}>
                  {product.name}
                </Text>
              </Pressable>
              {firstVariant ? (
                <Text style={styles.price}>
                  {getVariantPrice(firstVariant, 'NGN')}
                </Text>
              ) : null}

              <View style={styles.actions}>
                <Pressable
                  onPress={() => handleMoveToBag(item)}
                  style={({ pressed }) => [
                    styles.bagBtn,
                    pressed && { opacity: 0.85 },
                    (!firstVariant || isRemoving) && { opacity: 0.5 },
                  ]}
                  disabled={!firstVariant || isRemoving}
                >
                  <Ionicons name="bag-outline" size={13} color="#fff" />
                  <Text style={styles.bagBtnText}>Add to Bag</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleRemove(item.productId)}
                  disabled={isRemoving}
                  style={({ pressed }) => [
                    styles.trashBtn,
                    pressed && { borderColor: colors.danger },
                    isRemoving && { opacity: 0.5 },
                  ]}
                  hitSlop={4}
                >
                  <Ionicons name="trash-outline" size={14} color={colors.ink[500]} />
                </Pressable>
              </View>
            </View>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  gate: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
    backgroundColor: colors.surface[0],
  },
  gateTitle: {
    ...text['2xl'],
    fontWeight: '700',
    color: colors.ink[900],
    marginTop: spacing[4],
    textAlign: 'center',
  },
  gateSub: {
    ...text.sm,
    color: colors.ink[500],
    marginTop: spacing[2],
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  title: { ...text['2xl'], fontWeight: '700', color: colors.ink[900] },
  countText: { ...text.sm, color: colors.ink[500], marginTop: 2 },
  clearText: { ...text.sm, color: colors.ink[500], fontWeight: '600' },
  card: {
    flex: 1,
    maxWidth: '49%',
  },
  imageWrap: {
    aspectRatio: 3 / 4,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface[1],
  },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { marginTop: spacing[2] },
  category: {
    ...text.xs,
    color: colors.primary[600],
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  name: {
    ...text.sm,
    fontWeight: '700',
    color: colors.ink[900],
    marginTop: 4,
    minHeight: 36,
  },
  price: {
    ...text.sm,
    fontWeight: '700',
    color: colors.ink[900],
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[3],
  },
  bagBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing[2],
    backgroundColor: colors.ink[900],
    borderRadius: radius.md,
  },
  bagBtnText: { ...text.xs, color: '#fff', fontWeight: '700' },
  trashBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.ink[200],
    borderRadius: radius.md,
  },
});
