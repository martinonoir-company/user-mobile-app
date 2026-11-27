import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { api } from '@/lib/api';
import { colors, radius, spacing, text } from '@/theme';

/**
 * Order rating + review card.
 *
 * A 5-star picker plus an optional comment, for rating a completed order.
 * Shown ONLY for successfully-paid orders — the caller gates on paid status
 * and the server independently rejects ratings on unpaid/cancelled orders.
 *
 * Loads any existing rating on mount so it doubles as an editor (one rating
 * per order, upserted server-side). Self-contained card — drop it into an
 * existing ScrollView; it never overlaps other UI.
 */
const STAR_GOLD = colors.accentGold;

export function OrderRating({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(true);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getOrderRating(orderId)
      .then((res) => {
        if (cancelled || !res.data) return;
        setStars(res.data.stars);
        setComment(res.data.comment ?? '');
        setSaved(true);
      })
      .catch(() => {
        /* no existing rating / not reachable — show the empty form */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  async function submit() {
    if (stars < 1 || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.submitOrderRating({
        orderId,
        stars,
        comment: comment.trim() || undefined,
      });
      setSaved(true);
    } catch {
      setError("Sorry, we couldn't save your rating. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return null;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.cardTitle}>
          {saved ? 'Your rating' : 'How was your order?'}
        </Text>
        {saved ? (
          <View style={styles.savedPill}>
            <Ionicons name="checkmark-circle" size={14} color={colors.success} />
            <Text style={styles.savedText}>Saved</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.subtitle}>
        {saved
          ? 'Thanks for your feedback — you can update it any time.'
          : 'Tap a star to rate your experience.'}
      </Text>

      {/* Stars */}
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable
            key={n}
            hitSlop={6}
            onPress={() => {
              setStars(n);
              setSaved(false);
            }}
            style={styles.starBtn}
            accessibilityLabel={`${n} star${n > 1 ? 's' : ''}`}
          >
            <Ionicons
              name={n <= stars ? 'star' : 'star-outline'}
              size={32}
              color={n <= stars ? STAR_GOLD : colors.ink[300]}
            />
          </Pressable>
        ))}
      </View>

      {/* Comment */}
      <TextInput
        value={comment}
        onChangeText={(v) => {
          setComment(v);
          setSaved(false);
        }}
        placeholder="Add a comment (optional)…"
        placeholderTextColor={colors.ink[400]}
        multiline
        maxLength={1000}
        style={styles.input}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        onPress={submit}
        disabled={stars < 1 || submitting}
        style={({ pressed }) => [
          styles.submitBtn,
          (stars < 1 || submitting) && styles.submitBtnDisabled,
          pressed && stars >= 1 && !submitting && { opacity: 0.85 },
        ]}
      >
        {submitting ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.submitText}>
            {saved ? 'Update rating' : 'Submit rating'}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface[0],
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.ink[100],
    padding: spacing[4],
    marginTop: spacing[4],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    ...text.base,
    fontWeight: '700',
    color: colors.ink[900],
  },
  savedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  savedText: {
    ...text.xs,
    color: colors.success,
    fontWeight: '600',
  },
  subtitle: {
    ...text.sm,
    color: colors.ink[500],
    marginTop: 2,
  },
  starsRow: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[3],
  },
  starBtn: {
    padding: 2,
  },
  input: {
    marginTop: spacing[3],
    borderWidth: 1,
    borderColor: colors.ink[200],
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    minHeight: 72,
    textAlignVertical: 'top',
    color: colors.ink[900],
    ...text.sm,
  },
  error: {
    ...text.xs,
    color: colors.danger,
    marginTop: spacing[2],
  },
  submitBtn: {
    marginTop: spacing[4],
    backgroundColor: colors.ink[900],
    borderRadius: radius.full,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitText: {
    ...text.sm,
    color: '#fff',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
