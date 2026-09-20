import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { useBottomInset } from '@/lib/use-bottom-inset';
import { colors } from '@/theme';

interface Props {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  backgroundColor?: string;
  edges?: Edge[];
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  keyboardAware?: boolean;
}

export function Screen({
  children,
  scroll = false,
  padded = true,
  backgroundColor = colors.surface[0],
  edges = ['top', 'bottom'],
  style,
  contentContainerStyle,
  keyboardAware = false,
}: Props) {
  const bottomInset = useBottomInset();

  // Handle the bottom safe area ourselves (via paddingBottom) rather than
  // through SafeAreaView's `bottom` edge: on some Android devices the reported
  // bottom inset is ~0, so SafeAreaView adds no padding and content is clipped
  // behind the system nav bar. useBottomInset() guarantees a correct value.
  // The top (and any other) edges still go through SafeAreaView.
  const wantsBottom = edges.includes('bottom');
  const safeAreaEdges = edges.filter((e) => e !== 'bottom');
  const bottomPad = wantsBottom ? { paddingBottom: bottomInset } : null;

  const content = scroll ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        padded && styles.padded,
        bottomPad,
        contentContainerStyle,
      ]}
      style={[styles.flex, style]}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, padded && styles.padded, bottomPad, style]}>
      {children}
    </View>
  );

  const body = keyboardAware ? (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.flex}
    >
      {content}
    </KeyboardAvoidingView>
  ) : (
    content
  );

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor }]} edges={safeAreaEdges}>
      {body}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  padded: { paddingHorizontal: 16 },
});
