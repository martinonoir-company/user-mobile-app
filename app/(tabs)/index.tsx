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
import { ProductCard } from '@/components/ProductCard';
import { TopBar } from '@/components/TopBar';
import { api, Category, Product } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { colors, radius, spacing, text } from '@/theme';

export default function HomeScreen() {
  const { currency, user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [catRes, featRes, newRes] = await Promise.all([
        api.getCategories(),
        api.getProducts({ featured: true, limit: 6 }),
        api.getProducts({ limit: 6 }),
      ]);
      setCategories(catRes.data);
      setFeatured(featRes.data.items);
      setNewArrivals(newRes.data.items);
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

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.surface[0] }}>
      <TopBar />
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing[10] }}
      >
        {/* Greeting */}
        <View style={styles.greetingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greetingLabel}>{greeting}{user ? ',' : ''}</Text>
            <Text style={styles.greetingName} numberOfLines={1}>
              {user?.email ? user.email.split('@')[0] : 'Welcome'}
            </Text>
          </View>
        </View>

        {/* Hero */}
        <Pressable
          onPress={() => router.push('/(tabs)/shop')}
          style={({ pressed }) => [styles.hero, pressed && { opacity: 0.95 }]}
        >
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <Text style={styles.heroEyebrow}>NEW SEASON</Text>
            <Text style={styles.heroTitle}>
              Crafted{'\n'}in Lagos.
            </Text>
            <Text style={styles.heroSubtitle}>
              Signature leather goods designed for everyday elegance.
            </Text>
            <View style={styles.heroCta}>
              <Text style={styles.heroCtaText}>Shop the collection</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.ink[900]} />
            </View>
          </View>
        </Pressable>

        {/* Category chips */}
        <View style={{ marginTop: spacing[6] }}>
          <SectionHeader title="Browse" />
          {loading && categories.length === 0 ? (
            <ChipSkeleton />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {categories.slice(0, 10).map((cat) => (
                <Pressable
                  key={cat.id}
                  onPress={() => router.push(`/category/${cat.slug}` as never)}
                  style={({ pressed }) => [styles.chip, pressed && { opacity: 0.7 }]}
                >
                  <Text style={styles.chipText} numberOfLines={1}>
                    {cat.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Featured products — horizontal */}
        <View style={{ marginTop: spacing[8] }}>
          <SectionHeader title="Featured" onSeeAll={() => router.push('/(tabs)/shop')} />
          {loading && featured.length === 0 ? (
            <ProductRailSkeleton />
          ) : featured.length === 0 ? null : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.rail}
            >
              {featured.map((product) => (
                <View key={product.id} style={styles.railItem}>
                  <ProductCard product={product} currency={currency} />
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Editorial promo */}
        <Pressable
          onPress={() => router.push('/(tabs)/shop')}
          style={({ pressed }) => [styles.editorial, pressed && { opacity: 0.95 }]}
        >
          <View style={styles.editorialLeft}>
            <Text style={styles.editorialEyebrow}>EDITORIAL</Text>
            <Text style={styles.editorialTitle}>
              The art of{'\n'}quiet luxury.
            </Text>
            <Text style={styles.editorialBody}>
              Pieces meant to outlast trends.
            </Text>
            <View style={styles.editorialLink}>
              <Text style={styles.editorialLinkText}>Read story</Text>
              <Ionicons name="arrow-forward" size={14} color={colors.ink[900]} />
            </View>
          </View>
          <View style={styles.editorialRight}>
            <Ionicons name="bag-handle-outline" size={48} color={colors.ink[200]} />
          </View>
        </Pressable>

        {/* Categories visual grid */}
        {categories.length > 0 ? (
          <View style={{ marginTop: spacing[8] }}>
            <SectionHeader title="Shop by category" />
            <View style={styles.catGrid}>
              {categories.slice(0, 4).map((cat) => (
                <Pressable
                  key={cat.id}
                  onPress={() => router.push(`/category/${cat.slug}` as never)}
                  style={({ pressed }) => [styles.catTile, pressed && { opacity: 0.85 }]}
                >
                  {cat.imageUrl ? (
                    <Image
                      source={cat.imageUrl}
                      style={styles.catImage}
                      contentFit="cover"
                      transition={150}
                    />
                  ) : (
                    <View style={[styles.catImage, styles.catPlaceholder]}>
                      <Ionicons name="cube-outline" size={28} color={colors.ink[300]} />
                    </View>
                  )}
                  <View style={styles.catTileOverlay} />
                  <View style={styles.catTileText}>
                    <Text style={styles.catTileName} numberOfLines={1}>
                      {cat.name}
                    </Text>
                    <Ionicons name="arrow-forward" size={16} color="#fff" />
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {/* New arrivals */}
        {newArrivals.length > 0 ? (
          <View style={{ marginTop: spacing[8] }}>
            <SectionHeader
              title="New arrivals"
              onSeeAll={() => router.push('/(tabs)/shop')}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.rail}
            >
              {newArrivals.map((product) => (
                <View key={product.id} style={styles.railItem}>
                  <ProductCard product={product} currency={currency} />
                </View>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* Trust ribbon */}
        <View style={styles.trust}>
          {[
            {
              icon: 'shield-checkmark-outline' as const,
              title: 'Secure checkout',
              body: 'End-to-end encrypted payments.',
            },
            {
              icon: 'paper-plane-outline' as const,
              title: 'Worldwide shipping',
              body: 'Tracked delivery to your door.',
            },
            {
              icon: 'refresh-outline' as const,
              title: '30-day returns',
              body: 'Send it back, no questions.',
            },
          ].map((t) => (
            <View key={t.title} style={styles.trustItem}>
              <View style={styles.trustIcon}>
                <Ionicons name={t.icon} size={20} color={colors.ink[900]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.trustTitle}>{t.title}</Text>
                <Text style={styles.trustBody}>{t.body}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({
  title,
  onSeeAll,
}: {
  title: string;
  onSeeAll?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onSeeAll ? (
        <Pressable onPress={onSeeAll} hitSlop={8}>
          <Text style={styles.seeAll}>See all</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function ChipSkeleton() {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipRow}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={[styles.chip, styles.skeleton, { width: 90 }]} />
      ))}
    </ScrollView>
  );
}

function ProductRailSkeleton() {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.rail}
    >
      {[1, 2, 3].map((i) => (
        <View key={i} style={[styles.railItem, { gap: spacing[2] }]}>
          <View style={[styles.skeleton, { aspectRatio: 3 / 4, borderRadius: radius.lg }]} />
          <View
            style={[
              styles.skeleton,
              { height: 14, width: '60%', borderRadius: 4, marginTop: spacing[2] },
            ]}
          />
          <View
            style={[
              styles.skeleton,
              { height: 14, width: '40%', borderRadius: 4, marginTop: 4 },
            ]}
          />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    marginTop: spacing[2],
    marginBottom: spacing[4],
  },
  greetingLabel: { ...text.sm, color: colors.ink[500] },
  greetingName: {
    ...text['2xl'],
    fontWeight: '700',
    color: colors.ink[900],
    letterSpacing: -0.3,
  },

  hero: {
    marginHorizontal: spacing[4],
    height: 320,
    borderRadius: radius['2xl'],
    backgroundColor: colors.ink[900],
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.ink[900],
  },
  heroContent: { padding: spacing[6] },
  heroEyebrow: {
    ...text.xs,
    color: colors.accentGold,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: spacing[3],
  },
  heroTitle: {
    fontSize: 44,
    lineHeight: 48,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -1,
    marginBottom: spacing[3],
  },
  heroSubtitle: {
    ...text.sm,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: spacing[5],
    lineHeight: 20,
  },
  heroCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: '#fff',
    paddingHorizontal: spacing[5],
    paddingVertical: 12,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  heroCtaText: {
    ...text.sm,
    color: colors.ink[900],
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  sectionTitle: {
    ...text['2xl'],
    fontWeight: '700',
    color: colors.ink[900],
    letterSpacing: -0.3,
  },
  seeAll: { ...text.sm, color: colors.ink[600], fontWeight: '600' },

  chipRow: {
    paddingHorizontal: spacing[4],
    gap: spacing[2],
  },
  chip: {
    paddingHorizontal: spacing[4],
    height: 38,
    borderRadius: radius.full,
    backgroundColor: colors.surface[1],
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    ...text.sm,
    color: colors.ink[800],
    fontWeight: '600',
  },

  rail: {
    paddingHorizontal: spacing[4],
    gap: spacing[3],
  },
  railItem: { width: 170 },

  editorial: {
    marginHorizontal: spacing[4],
    marginTop: spacing[8],
    backgroundColor: colors.accentGoldLight,
    borderRadius: radius['2xl'],
    padding: spacing[5],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    overflow: 'hidden',
  },
  editorialLeft: { flex: 1 },
  editorialRight: {
    width: 80,
    height: 80,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editorialEyebrow: {
    ...text.xs,
    color: colors.accentGoldDark,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: spacing[2],
  },
  editorialTitle: {
    ...text['2xl'],
    fontWeight: '700',
    color: colors.ink[900],
    letterSpacing: -0.3,
    marginBottom: spacing[2],
  },
  editorialBody: {
    ...text.sm,
    color: colors.ink[600],
    marginBottom: spacing[3],
  },
  editorialLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editorialLinkText: {
    ...text.sm,
    color: colors.ink[900],
    fontWeight: '700',
  },

  catGrid: {
    paddingHorizontal: spacing[4],
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  catTile: {
    width: '47.5%',
    aspectRatio: 1,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.surface[2],
  },
  catImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  catPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  catTileOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,10,0.25)',
  },
  catTileText: {
    position: 'absolute',
    left: spacing[3],
    right: spacing[3],
    bottom: spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  catTileName: {
    ...text.base,
    color: '#fff',
    fontWeight: '700',
    flex: 1,
    letterSpacing: 0.2,
  },

  trust: {
    marginTop: spacing[10],
    marginHorizontal: spacing[4],
    padding: spacing[5],
    backgroundColor: colors.surface[1],
    borderRadius: radius['2xl'],
    gap: spacing[4],
  },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  trustIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustTitle: {
    ...text.sm,
    fontWeight: '700',
    color: colors.ink[900],
    marginBottom: 2,
  },
  trustBody: { ...text.xs, color: colors.ink[500] },

  skeleton: {
    backgroundColor: colors.surface[2],
  },
});
