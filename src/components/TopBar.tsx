import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, text } from '@/theme';

interface Props {
  title?: string;
  showSearch?: boolean;
}

export function TopBar({ title = 'Martinonoir', showSearch = true }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.brand}>{title}</Text>
      {showSearch ? (
        <Pressable
          onPress={() => router.push('/search')}
          hitSlop={8}
          style={({ pressed }) => [styles.searchBtn, pressed && { opacity: 0.6 }]}
          accessibilityRole="button"
          accessibilityLabel="Search"
        >
          <Ionicons name="search" size={20} color={colors.ink[800]} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
    paddingBottom: spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface[0],
  },
  brand: {
    ...text.xl,
    fontFamily: undefined,
    fontWeight: '700',
    color: colors.ink[900],
    letterSpacing: 0.3,
  },
  searchBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.surface[1],
    alignItems: 'center',
    justifyContent: 'center',
  },
});
