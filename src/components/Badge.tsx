import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, text } from '@/theme';

type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'gold';

interface Props {
  label: string;
  tone?: Tone;
}

export function Badge({ label, tone = 'neutral' }: Props) {
  const s = toneStyles[tone];
  return (
    <View style={[styles.base, { backgroundColor: s.bg }]}>
      <Text style={[styles.text, { color: s.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  text: {
    ...text.xs,
    fontWeight: '600',
  },
});

const toneStyles = {
  neutral: { bg: colors.surface[2], fg: colors.ink[700] },
  primary: { bg: colors.primary[100], fg: colors.primary[800] },
  success: { bg: colors.successLight, fg: colors.success },
  warning: { bg: colors.warningLight, fg: colors.warning },
  danger: { bg: colors.dangerLight, fg: colors.danger },
  gold: { bg: colors.accentGoldLight, fg: colors.accentGoldDark },
} as const;
