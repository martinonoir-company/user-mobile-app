import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, text } from '@/theme';

interface Props {
  title?: string;
  showSearch?: boolean;
}

export function TopBar({ title = 'Martinonoir', showSearch = true }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 6 }]}>
      <Text style={styles.brand}>{title}</Text>
      {showSearch ? (
        <Pressable
          onPress={() => router.push('/search')}
          hitSlop={8}
          style={styles.searchBtn}
        >
          <Ionicons name="search-outline" size={22} color={colors.ink[700]} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface[0],
    borderBottomWidth: 1,
    borderBottomColor: colors.ink[100],
  },
  brand: {
    ...text.xl,
    fontWeight: '700',
    color: colors.ink[900],
    letterSpacing: 0.5,
  },
  searchBtn: {
    padding: spacing[2],
  },
});
