import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, text } from '@/theme';

interface Props {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, subtitle, action }: Props) {
  return (
    <View style={styles.container}>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {action ? <View style={{ marginTop: spacing[6] }}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[8],
  },
  icon: { marginBottom: spacing[4] },
  title: {
    ...text.xl,
    fontWeight: '700',
    color: colors.ink[900],
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  subtitle: {
    ...text.sm,
    color: colors.ink[500],
    textAlign: 'center',
    maxWidth: 320,
  },
});
