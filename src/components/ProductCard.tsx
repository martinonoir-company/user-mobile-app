import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Product } from '@/lib/api';
import { getStartingPrice } from '@/lib/price';
import { colors, radius, spacing, text } from '@/theme';

interface Props {
  product: Product;
  currency?: string;
  width?: number | string;
}

export function ProductCard({ product, currency = 'NGN', width = '100%' }: Props) {
  const firstMedia = product.media?.[0];

  return (
    <Pressable
      onPress={() => router.push(`/product/${product.slug}` as never)}
      style={[styles.card, { width: width as number }]}
    >
      <View style={styles.imageBox}>
        {firstMedia?.url ? (
          <Image
            source={firstMedia.url}
            style={styles.image}
            contentFit="cover"
            transition={150}
          />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Ionicons name="image-outline" size={32} color={colors.ink[300]} />
          </View>
        )}
      </View>
      <View style={styles.body}>
        {product.category?.name ? (
          <Text style={styles.category}>{product.category.name.toUpperCase()}</Text>
        ) : null}
        <Text style={styles.name} numberOfLines={1}>
          {product.name}
        </Text>
        <Text style={styles.price}>
          {getStartingPrice(product.variants ?? [], currency)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface[0],
  },
  imageBox: {
    aspectRatio: 3 / 4,
    backgroundColor: colors.surface[2],
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  image: { flex: 1 },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  body: { marginTop: spacing[2] },
  category: {
    ...text.xs,
    color: colors.primary[600],
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 2,
  },
  name: {
    ...text.sm,
    color: colors.ink[900],
    fontWeight: '600',
    marginBottom: 2,
  },
  price: {
    ...text.sm,
    color: colors.ink[900],
    fontWeight: '700',
  },
});
