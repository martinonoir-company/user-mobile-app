import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
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

const LIMIT = 12;

export default function ShopScreen() {
  const { currency } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [items, setItems] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadPage = useCallback(
    async (targetPage: number, category: string | null, append: boolean) => {
      const res = await api.getProducts({
        page: targetPage,
        limit: LIMIT,
        category: category ?? undefined,
      });
      setItems((prev) => (append ? [...prev, ...res.data.items] : res.data.items));
      setPage(res.data.page);
      setPages(res.data.pages);
    },
    [],
  );

  useEffect(() => {
    api
      .getCategories()
      .then((res) => setCategories(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadPage(1, selectedCategory, false)
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedCategory, loadPage]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPage(1, selectedCategory, false).catch(() => {});
    setRefreshing(false);
  }, [selectedCategory, loadPage]);

  const onEndReached = useCallback(async () => {
    if (loadingMore || page >= pages) return;
    setLoadingMore(true);
    try {
      await loadPage(page + 1, selectedCategory, true);
    } catch {
      // ignored
    } finally {
      setLoadingMore(false);
    }
  }, [page, pages, loadingMore, selectedCategory, loadPage]);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.surface[0] }}>
      <TopBar title="Shop" />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={{ flexGrow: 0 }}
      >
        <Pressable
          style={[styles.chip, selectedCategory === null && styles.chipActive]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={[styles.chipText, selectedCategory === null && styles.chipTextActive]}>
            All
          </Text>
        </Pressable>
        {categories.map((cat) => (
          <Pressable
            key={cat.id}
            style={[styles.chip, selectedCategory === cat.id && styles.chipActive]}
            onPress={() => setSelectedCategory(cat.id)}
          >
            <Text
              style={[styles.chipText, selectedCategory === cat.id && styles.chipTextActive]}
            >
              {cat.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary[700]} />
        </View>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Ionicons name="cube-outline" size={48} color={colors.ink[300]} />}
          title="No products found"
          subtitle="Try a different category."
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(p) => p.id}
          numColumns={2}
          columnWrapperStyle={styles.column}
          contentContainerStyle={styles.grid}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          renderItem={({ item }) => (
            <View style={{ width: '48%' }}>
              <ProductCard product={item} currency={currency} />
            </View>
          )}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ padding: spacing[5] }}>
                <ActivityIndicator color={colors.primary[700]} />
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  filterRow: {
    paddingHorizontal: spacing[4],
    gap: spacing[2],
    paddingVertical: spacing[3],
  },
  chip: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
    backgroundColor: colors.surface[1],
    borderWidth: 1,
    borderColor: colors.ink[100],
  },
  chipActive: {
    backgroundColor: colors.ink[900],
    borderColor: colors.ink[900],
  },
  chipText: { ...text.sm, color: colors.ink[700], fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  grid: { padding: spacing[4], gap: spacing[3] },
  column: { gap: spacing[3], marginBottom: spacing[3] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
