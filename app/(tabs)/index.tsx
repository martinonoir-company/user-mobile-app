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
import { EmptyState } from '@/components/EmptyState';
import { ProductCard } from '@/components/ProductCard';
import { TopBar } from '@/components/TopBar';
import { api, Category, Product } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { colors, radius, spacing, text } from '@/theme';

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
        api.getProducts({ featured: true, limit: 8 }),
      ]);
      setCategories(catRes.data);
      setFeatured(featRes.data.items);
    } catch {
      // Show empty state; don't crash the home screen.
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

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.surface[0] }}>
      <TopBar />
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Signature leather goods,{'\n'}crafted in Lagos.</Text>
          <Text style={styles.heroSubtitle}>
            Timeless bags and accessories designed for everyday elegance.
          </Text>
          <Pressable style={styles.heroCta} onPress={() => router.push('/(tabs)/shop')}>
            <Text style={styles.heroCtaText}>Shop the collection</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </Pressable>
        </View>

        {/* Featured categories */}
        <Section title="Shop by category">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: spacing[4], gap: spacing[3] }}
          >
            {categories.slice(0, 8).map((cat) => (
              <Pressable
                key={cat.id}
                style={styles.categoryCard}
                onPress={() => router.push(`/category/${cat.slug}` as never)}
              >
                {cat.imageUrl ? (
                  <Image source={cat.imageUrl} style={styles.categoryImage} contentFit="cover" />
                ) : (
                  <View style={[styles.categoryImage, styles.categoryPlaceholder]}>
                    <Ionicons name="cube-outline" size={28} color={colors.ink[300]} />
                  </View>
                )}
                <Text style={styles.categoryName} numberOfLines={1}>
                  {cat.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </Section>

        {/* Featured products */}
        <Section title="Featured" onSeeAll={() => router.push('/(tabs)/shop')}>
          {loading ? (
            <Text style={{ paddingHorizontal: spacing[4], color: colors.ink[500] }}>Loading…</Text>
          ) : featured.length === 0 ? (
            <EmptyState title="No featured products yet" />
          ) : (
            <View style={styles.grid}>
              {featured.map((product) => (
                <View key={product.id} style={styles.gridItem}>
                  <ProductCard product={product} currency={currency} />
                </View>
              ))}
            </View>
          )}
        </Section>

        {/* Trust */}
        <View style={styles.trust}>
          {[
            { icon: 'shield-checkmark-outline' as const, title: 'Secure payments', body: 'All transactions are encrypted.' },
            { icon: 'boat-outline' as const, title: 'Worldwide shipping', body: 'Fast and trackable delivery.' },
            { icon: 'refresh-outline' as const, title: '30-day returns', body: 'Not quite right? Send it back.' },
          ].map((t) => (
            <View key={t.title} style={styles.trustItem}>
              <Ionicons name={t.icon} size={22} color={colors.primary[700]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.trustTitle}>{t.title}</Text>
                <Text style={styles.trustBody}>{t.body}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: spacing[10] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({
  title,
  children,
  onSeeAll,
}: {
  title: string;
  children: React.ReactNode;
  onSeeAll?: () => void;
}) {
  return (
    <View style={{ marginTop: spacing[6] }}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {onSeeAll ? (
          <Pressable onPress={onSeeAll}>
            <Text style={styles.seeAll}>See all</Text>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    margin: spacing[4],
    padding: spacing[6],
    borderRadius: radius.xl,
    backgroundColor: colors.primary[900],
  },
  heroTitle: {
    ...text['3xl'],
    color: '#fff',
    fontWeight: '700',
    marginBottom: spacing[2],
  },
  heroSubtitle: { ...text.sm, color: colors.primary[200], marginBottom: spacing[5] },
  heroCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.accentGold,
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderRadius: radius.lg,
    alignSelf: 'flex-start',
  },
  heroCtaText: { ...text.sm, color: '#fff', fontWeight: '700' },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  sectionTitle: {
    ...text.xl,
    fontWeight: '700',
    color: colors.ink[900],
  },
  seeAll: { ...text.sm, color: colors.primary[700], fontWeight: '600' },
  categoryCard: { width: 120 },
  categoryImage: {
    width: 120,
    height: 120,
    borderRadius: radius.lg,
    backgroundColor: colors.surface[2],
  },
  categoryPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  categoryName: {
    ...text.sm,
    fontWeight: '600',
    color: colors.ink[900],
    marginTop: spacing[2],
    textAlign: 'center',
  },
  grid: {
    paddingHorizontal: spacing[4],
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  gridItem: { width: '47.5%' },
  trust: {
    marginTop: spacing[8],
    marginHorizontal: spacing[4],
    padding: spacing[4],
    backgroundColor: colors.surface[1],
    borderRadius: radius.xl,
    gap: spacing[3],
  },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  trustTitle: { ...text.sm, fontWeight: '700', color: colors.ink[900] },
  trustBody: { ...text.xs, color: colors.ink[500] },
});
