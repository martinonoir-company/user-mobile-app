import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { EmptyState } from '@/components/EmptyState';
import { ProductCard } from '@/components/ProductCard';
import { api, Category, Product } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { colors, spacing } from '@/theme';

export default function CategoryScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { currency } = useAuth();
  const [category, setCategory] = useState<Category | null>(null);
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!slug) return;
      try {
        const cat = await api.getCategoryBySlug(slug);
        if (cancelled) return;
        setCategory(cat.data);
        const res = await api.getProducts({ category: cat.data.id, limit: 50 });
        if (cancelled) return;
        setItems(res.data.items);
      } catch {
        // ignored; fall back to empty
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface[0] }}>
      <Stack.Screen options={{ title: category?.name ?? '' }} />
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary[700]} />
        </View>
      ) : items.length === 0 ? (
        <EmptyState title="No products in this category yet" />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(p) => p.id}
          numColumns={2}
          columnWrapperStyle={styles.column}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => (
            <View style={{ width: '48%' }}>
              <ProductCard product={item} currency={currency} />
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { padding: spacing[4], gap: spacing[3] },
  column: { gap: spacing[3], marginBottom: spacing[3] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
