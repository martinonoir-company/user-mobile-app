import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing, text } from '@/theme';

interface Props {
  title?: string;
  showSearch?: boolean;
}

export function TopBar({ title = 'Martinonoir', showSearch = true }: Props) {
  // Pad for the status bar / notch directly, so the bar is never clipped at
  // the top edge regardless of how the parent screen wraps it. A minimum keeps
  // it comfortable on devices that report a 0 top inset.
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { paddingTop: Math.max(insets.top, spacing[2]) + spacing[2] }]}>
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
