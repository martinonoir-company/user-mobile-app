import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, Category, Product } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { getStartingPrice } from '@/lib/price';
import { colors, radius, spacing, text } from '@/theme';

/**
 * Home screen — dark, editorial "Martinonoir Collection" layout.
 *
 * Data flow is unchanged from the previous design: one parallel fetch on
 * mount (+ pull-to-refresh) for categories, featured products (Curated
 * Picks), and the hero. Rails render empty rather than crashing on error.
 */
export default function HomeScreen() {
  const { currency } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [catRes, featRes] = await Promise.all([
        api.getCategories(),
        api.getProducts({ featured: true, limit: 6 }),
      ]);
      setCategories(catRes.data);
      // Fall back to newest products if no products are flagged featured, so
      // Curated Picks is never empty when the catalogue has items.
      if (featRes.data.items.length > 0) {
        setFeatured(featRes.data.items);
      } else {
        const newest = await api.getProducts({ limit: 6 });
        setFeatured(newest.data.items);
      }
    } catch {
      // Render empty rails rather than crash the whole home screen.
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await load();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  // Lead featured product photo for the hero backdrop (optional).
  const heroImage = featured[0]?.media?.[0]?.url;

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accentGold}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing[10] }}
      >
        {/* Minimal dark header — brand + search */}
        <View style={styles.header}>
          <Text style={styles.brand}>
            MARTINO<Text style={styles.brandAccent}>NOIR</Text>
          </Text>
          <Pressable
            onPress={() => router.push('/search')}
            hitSlop={8}
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
            accessibilityLabel="Search"
          >
            <Ionicons name="search" size={20} color="#fff" />
          </Pressable>
        </View>

        {/* Hero — uses the lead featured product photo over a dark scrim so
            it always has real imagery without bundling a static asset. The
            dark base shows through until/if the image loads. */}
        <Pressable
          onPress={() => router.push('/(tabs)/shop')}
          style={({ pressed }) => [styles.hero, pressed && { opacity: 0.96 }]}
        >
          {heroImage ? (
            <Image
              source={heroImage}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={250}
            />
          ) : null}
          <View style={styles.heroScrim} />
          <View style={styles.heroContent}>
            <Text style={styles.heroEyebrow}>NEW RELEASE</Text>
            <Text style={styles.heroTitle}>THE{'\n'}MARTINONOIR{'\n'}COLLECTION</Text>
            <View style={styles.heroCta}>
              <Text style={styles.heroCtaText}>SHOP NOW</Text>
            </View>
          </View>
        </Pressable>

        {/* Collections */}
        <View style={{ marginTop: spacing[8] }}>
          <SectionHeader
            title="COLLECTIONS"
            actionLabel="View All"
            onAction={() => router.push('/(tabs)/shop')}
          />
          {loading && categories.length === 0 ? (
            <CollectionsSkeleton />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.collRow}
            >
              {categories.slice(0, 12).map((cat) => (
                <Pressable
                  key={cat.id}
                  onPress={() => router.push(`/category/${cat.slug}` as never)}
                  style={({ pressed }) => [styles.collItem, pressed && { opacity: 0.7 }]}
                >
                  <View style={styles.collThumb}>
                    {cat.imageUrl ? (
                      <Image
                        source={cat.imageUrl}
                        style={StyleSheet.absoluteFill}
                        contentFit="cover"
                        transition={150}
                      />
                    ) : (
                      <Ionicons name="bag-handle-outline" size={22} color={colors.ink[400]} />
                    )}
                  </View>
                  <Text style={styles.collLabel} numberOfLines={1}>
                    {cat.name.toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Curated picks — featured products in a 2-column grid */}
        <View style={{ marginTop: spacing[8] }}>
          <SectionHeader title="CURATED PICKS" />
          {loading && featured.length === 0 ? (
            <GridSkeleton />
          ) : (
            <View style={styles.grid}>
              {featured.map((product) => (
                <FeaturedCard key={product.id} product={product} currency={currency} />
              ))}
            </View>
          )}
        </View>

        {/* The Noir Club */}
        <View style={styles.club}>
          <Text style={styles.clubTitle}>THE NOIR CLUB</Text>
          <Text style={styles.clubBody}>
            Gain top access to limited editions and exclusive products.
          </Text>
          <Pressable
            onPress={() => router.push('/(auth)/register' as never)}
            style={({ pressed }) => [styles.clubBtn, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.clubBtnText}>SIGN UP NOW</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * Premium product card for the dark home grid. The image sits on a light
 * tile with a hairline border so products photographed on EITHER a black or
 * white background stay fully visible against the dark page.
 */
function FeaturedCard({ product, currency }: { product: Product; currency?: string }) {
  const firstMedia = product.media?.[0];
  return (
    <Pressable
      onPress={() => router.push(`/product/${product.slug}` as never)}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
    >
      <View style={styles.cardImageBox}>
        {firstMedia?.url ? (
          <Image
            source={firstMedia.url}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={150}
          />
        ) : (
          <View style={styles.cardPlaceholder}>
            <Ionicons name="image-outline" size={30} color={colors.ink[300]} />
          </View>
        )}
        <View style={styles.heart}>
          <Ionicons name="heart-outline" size={16} color={colors.ink[900]} />
        </View>
      </View>
      {product.category?.name ? (
        <Text style={styles.cardCategory} numberOfLines={1}>
          {product.category.name.toUpperCase()}
        </Text>
      ) : null}
      <Text style={styles.cardName} numberOfLines={1}>
        {product.name}
      </Text>
      <Text style={styles.cardPrice}>
        {getStartingPrice(product.variants ?? [], currency)}
      </Text>
    </Pressable>
  );
}

function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={styles.sectionAction}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function CollectionsSkeleton() {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.collRow}
    >
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={styles.collItem}>
          <View style={[styles.collThumb, styles.skeleton]} />
          <View style={[styles.skeleton, { height: 10, width: 48, borderRadius: 3, marginTop: spacing[2] }]} />
        </View>
      ))}
    </ScrollView>
  );
}

function GridSkeleton() {
  return (
    <View style={styles.grid}>
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={styles.card}>
          <View style={[styles.cardImageBox, styles.skeleton]} />
          <View style={[styles.skeleton, { height: 10, width: '50%', borderRadius: 3, marginTop: spacing[2] }]} />
          <View style={[styles.skeleton, { height: 12, width: '70%', borderRadius: 3, marginTop: 6 }]} />
        </View>
      ))}
    </View>
  );
}

const CARD_GAP = spacing[3];

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ink[900] },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
    paddingBottom: spacing[3],
  },
  brand: {
    ...text.lg,
    color: '#fff',
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  brandAccent: { color: colors.accentGold },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  hero: {
    marginHorizontal: spacing[4],
    height: 460,
    borderRadius: radius['2xl'],
    backgroundColor: colors.ink[800],
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  heroScrim: {
    ...StyleSheet.absoluteFillObject,
    // Strong enough that white-background product photos still read white
    // text + CTA clearly. Sits under the content block.
    backgroundColor: 'rgba(10,10,10,0.5)',
  },
  heroContent: {
    padding: spacing[6],
    paddingTop: spacing[10],
    alignItems: 'center',
    // Extra darkening behind the text for guaranteed contrast over any image.
    backgroundColor: 'rgba(10,10,10,0.35)',
  },
  heroEyebrow: {
    ...text.xs,
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 3,
    marginBottom: spacing[3],
    opacity: 0.85,
  },
  heroTitle: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: spacing[5],
  },
  heroCta: {
    backgroundColor: '#fff',
    paddingHorizontal: spacing[8],
    paddingVertical: 14,
    borderRadius: radius.sm,
  },
  heroCtaText: {
    ...text.sm,
    color: colors.ink[900],
    fontWeight: '700',
    letterSpacing: 1.5,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    marginBottom: spacing[4],
  },
  sectionTitle: {
    ...text.lg,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1.5,
  },
  sectionAction: {
    ...text.xs,
    color: colors.accentGold,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  collRow: { paddingHorizontal: spacing[4], gap: spacing[5] },
  collItem: { alignItems: 'center', width: 64 },
  collThumb: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.surface[1],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  collLabel: {
    ...text.xs,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: spacing[2],
  },

  grid: {
    paddingHorizontal: spacing[4],
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },
  card: { width: `${(100 - 4) / 2}%` },
  cardImageBox: {
    aspectRatio: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
    // Neutral light tile + hairline border so BOTH black-bg and white-bg
    // product photos stay clearly visible against the dark page.
    backgroundColor: colors.surface[1],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  cardPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heart: {
    position: 'absolute',
    top: spacing[2],
    right: spacing[2],
    width: 30,
    height: 30,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCategory: {
    ...text.xs,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
    letterSpacing: 1,
    marginTop: spacing[3],
  },
  cardName: {
    ...text.sm,
    color: '#fff',
    fontWeight: '600',
    marginTop: 2,
  },
  cardPrice: {
    ...text.sm,
    color: colors.accentGold,
    fontWeight: '700',
    marginTop: 2,
  },

  club: {
    marginTop: spacing[10],
    marginHorizontal: spacing[4],
    padding: spacing[8],
    borderRadius: radius['2xl'],
    backgroundColor: colors.ink[800],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },
  clubTitle: {
    ...text.xl,
    color: '#fff',
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: spacing[2],
  },
  clubBody: {
    ...text.sm,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing[5],
  },
  clubBtn: {
    borderWidth: 1,
    borderColor: colors.accentGold,
    paddingHorizontal: spacing[8],
    paddingVertical: 13,
    borderRadius: radius.sm,
  },
  clubBtnText: {
    ...text.sm,
    color: colors.accentGold,
    fontWeight: '700',
    letterSpacing: 1.5,
  },

  skeleton: { backgroundColor: 'rgba(255,255,255,0.08)' },
});
