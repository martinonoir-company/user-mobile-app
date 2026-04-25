import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { EmptyState } from '@/components/EmptyState';
import { CONTACT, ContentSection, STATIC_CONTENT } from '@/lib/static-content';
import { colors, radius, spacing, text } from '@/theme';

export default function StaticContentScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const content = useMemo(
    () => (slug ? STATIC_CONTENT[slug] : undefined),
    [slug],
  );

  if (!content) {
    return (
      <>
        <Stack.Screen options={{ title: 'Not Found' }} />
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <EmptyState
            icon={<Ionicons name="document-text-outline" size={48} color={colors.ink[200]} />}
            title="Page Not Found"
            subtitle="The page you are looking for does not exist."
          />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: content.title }} />
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.surface[0] }}
        contentContainerStyle={styles.container}
      >
        <Text style={styles.title}>{content.title}</Text>
        <Text style={styles.intro}>{content.intro}</Text>

        {content.sections.map((section, idx) => (
          <Section key={idx} section={section} />
        ))}

        {slug === 'contact' ? <ContactActions /> : null}

        <View style={{ height: spacing[10] }} />
      </ScrollView>
    </>
  );
}

function Section({ section }: { section: ContentSection }) {
  return (
    <View style={styles.section}>
      {section.heading ? <Text style={styles.heading}>{section.heading}</Text> : null}

      {section.paragraphs?.map((p, i) => (
        <Text key={i} style={styles.paragraph}>
          {p}
        </Text>
      ))}

      {section.bullets ? (
        <View style={{ marginTop: spacing[2] }}>
          {section.bullets.map((b, i) => (
            <View key={i} style={styles.bulletRow}>
              <View style={styles.bulletDot} />
              <Text style={styles.bulletText}>{b}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {section.items ? (
        <View style={styles.itemsBox}>
          {section.items.map((it, i) => (
            <View
              key={i}
              style={[
                styles.itemRow,
                i > 0 && { borderTopWidth: 1, borderTopColor: colors.ink[100] },
              ]}
            >
              <Text style={styles.itemLabel}>{it.label}</Text>
              <View style={{ flex: 1, marginLeft: spacing[3] }}>
                <Text style={styles.itemValue}>{it.value}</Text>
                {it.note ? <Text style={styles.itemNote}>{it.note}</Text> : null}
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {section.faq ? (
        <View style={{ marginTop: spacing[2] }}>
          {section.faq.map((f, i) => (
            <FaqItem key={i} q={f.q} a={f.a} />
          ))}
        </View>
      ) : null}

      {section.callout ? (
        <View style={styles.callout}>
          <Text style={styles.calloutTitle}>{section.callout.title}</Text>
          <Text style={styles.calloutBody}>{section.callout.body}</Text>
        </View>
      ) : null}
    </View>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Pressable onPress={() => setOpen((v) => !v)} style={styles.faqCard}>
      <View style={styles.faqHead}>
        <Text style={styles.faqQ}>{q}</Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colors.ink[400]}
        />
      </View>
      {open ? <Text style={styles.faqA}>{a}</Text> : null}
    </Pressable>
  );
}

function ContactActions() {
  const openEmail = () => {
    void Linking.openURL(`mailto:${CONTACT.email}`);
  };
  const openPhone = () => {
    void Linking.openURL(`tel:${CONTACT.phoneTel}`);
  };
  return (
    <View style={styles.contactActions}>
      <Pressable onPress={openEmail} style={styles.actionBtn}>
        <Ionicons name="mail-outline" size={18} color="#fff" />
        <Text style={styles.actionText}>Email Us</Text>
      </Pressable>
      <Pressable
        onPress={openPhone}
        style={[styles.actionBtn, { backgroundColor: colors.ink[900] }]}
      >
        <Ionicons name="call-outline" size={18} color="#fff" />
        <Text style={styles.actionText}>Call {CONTACT.phone}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing[5] },
  title: {
    ...text['3xl'],
    fontWeight: '700',
    color: colors.ink[900],
  },
  intro: {
    ...text.base,
    color: colors.ink[500],
    lineHeight: 24,
    marginTop: spacing[3],
  },
  section: { marginTop: spacing[8] },
  heading: {
    ...text.lg,
    fontWeight: '700',
    color: colors.ink[900],
    marginBottom: spacing[3],
  },
  paragraph: {
    ...text.sm,
    color: colors.ink[700],
    lineHeight: 22,
    marginBottom: spacing[2],
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    marginBottom: spacing[2],
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
    backgroundColor: colors.primary[600],
  },
  bulletText: { ...text.sm, color: colors.ink[700], flex: 1, lineHeight: 22 },
  itemsBox: {
    marginTop: spacing[2],
    borderWidth: 1,
    borderColor: colors.ink[100],
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.surface[0],
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing[4],
  },
  itemLabel: {
    ...text.xs,
    fontWeight: '700',
    color: colors.primary[700],
    letterSpacing: 1,
    textTransform: 'uppercase',
    minWidth: 92,
  },
  itemValue: { ...text.sm, color: colors.ink[900], fontWeight: '600' },
  itemNote: { ...text.xs, color: colors.ink[500], marginTop: 2, lineHeight: 18 },
  faqCard: {
    borderWidth: 1,
    borderColor: colors.ink[100],
    borderRadius: radius.lg,
    padding: spacing[4],
    marginBottom: spacing[2],
    backgroundColor: colors.surface[0],
  },
  faqHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  faqQ: {
    ...text.sm,
    fontWeight: '700',
    color: colors.ink[900],
    flex: 1,
  },
  faqA: {
    ...text.sm,
    color: colors.ink[600],
    marginTop: spacing[3],
    lineHeight: 22,
  },
  callout: {
    marginTop: spacing[3],
    padding: spacing[4],
    borderRadius: radius.xl,
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[100],
  },
  calloutTitle: {
    ...text.base,
    fontWeight: '700',
    color: colors.primary[800],
    marginBottom: spacing[2],
  },
  calloutBody: { ...text.sm, color: colors.ink[700], lineHeight: 22 },
  contactActions: {
    marginTop: spacing[6],
    gap: spacing[3],
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[4],
    borderRadius: radius.lg,
    backgroundColor: colors.primary[700],
  },
  actionText: { ...text.sm, color: '#fff', fontWeight: '700' },
});
