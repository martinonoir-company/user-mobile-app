import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProductCard } from '@/components/ProductCard';
import { api, Product } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { colors, spacing, text } from '@/theme';

export default function SearchScreen() {
  const { currency } = useAuth();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  // Debounced search.
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const handle = setTimeout(async () => {
      try {
        const res = await api.getProducts({ search: q, limit: 20 });
        setResults(res.data.items);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    const id = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(id);
  }, []);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.surface[0] }}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={20} color={colors.ink[500]} />
        <TextInput
          ref={inputRef}
          value={query}
          onChangeText={setQuery}
          placeholder="Search products, categories…"
          placeholderTextColor={colors.ink[400]}
          style={styles.input}
          returnKeyType="search"
          autoCapitalize="none"
        />
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.cancel}>Cancel</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary[700]} />
        </View>
      ) : query.trim() === '' ? (
        <View style={styles.empty}>
          <Ionicons name="search-outline" size={48} color={colors.ink[200]} />
          <Text style={styles.emptyTitle}>Search the shop</Text>
          <Text style={styles.emptySubtitle}>Find bags, accessories and more.</Text>
        </View>
      ) : results.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No results for "{query}"</Text>
          <Text style={styles.emptySubtitle}>Try a different keyword.</Text>
        </View>
      ) : (
        <FlatList
          data={results}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.ink[100],
  },
  input: {
    flex: 1,
    ...text.base,
    color: colors.ink[900],
    paddingVertical: spacing[2],
  },
  cancel: { ...text.sm, color: colors.primary[700], fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[8],
    gap: spacing[2],
  },
  emptyTitle: { ...text.lg, fontWeight: '700', color: colors.ink[900] },
  emptySubtitle: { ...text.sm, color: colors.ink[500] },
  grid: { padding: spacing[4], gap: spacing[3] },
  column: { gap: spacing[3], marginBottom: spacing[3] },
});
