import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Screen } from '@/components/Screen';
import { api, QuoteResult } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { formatPrice } from '@/lib/price';
import { colors, radius, spacing, text } from '@/theme';

type Step = 'shipping' | 'review';

const NG_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo',
  'Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa',
  'Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba',
  'Yobe','Zamfara',
];

export default function CheckoutScreen() {
  const { items, clearCart, getSubtotal } = useCart();
  const { isAuthenticated, currency } = useAuth();

  const [step, setStep] = useState<Step>('shipping');
  const [loading, setLoading] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState<QuoteResult | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [stateValue, setStateValue] = useState('Lagos');
  const [phone, setPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [customerNote, setCustomerNote] = useState('');
  const [couponCode, setCouponCode] = useState('');

  // Marketing-agent referral code. Optional. We validate against the
  // server before sending the order so a typo doesn't sit silently.
  const [agentCode, setAgentCode] = useState('');
  const [agentVerified, setAgentVerified] = useState<{
    code: string;
    name: string;
  } | null>(null);
  const [agentVerifying, setAgentVerifying] = useState(false);
  const [agentError, setAgentError] = useState<string | null>(null);

  async function verifyAgentCode() {
    const code = agentCode.trim().toUpperCase();
    if (!code) return;
    setAgentVerifying(true);
    setAgentError(null);
    try {
      const res = await api.validateAgentCode(code);
      if (res.ok) {
        setAgentVerified({ code, name: res.agentName });
      } else {
        setAgentError(res.error);
        setAgentVerified(null);
      }
    } catch (e) {
      setAgentError(
        e instanceof Error ? e.message : 'Could not verify code',
      );
      setAgentVerified(null);
    } finally {
      setAgentVerifying(false);
    }
  }
  const [showStates, setShowStates] = useState(false);

  const cur = currency ?? 'NGN';
  const subtotal = getSubtotal(cur);

  useEffect(() => {
    if (items.length === 0) router.replace('/(tabs)/cart');
  }, [items.length]);

  const handleProceedToReview = async () => {
    setError(null);
    if (!firstName.trim() || !lastName.trim() || !line1.trim() || !city.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    if (!isAuthenticated && !guestEmail.includes('@')) {
      setError('Please enter a valid email.');
      return;
    }
    setLoading(true);
    try {
      const quoteItems = items.map((item) => ({
        variantId: item.variantId,
        sku: item.sku,
        productName: item.productName,
        variantName: item.variantName,
        quantity: item.quantity,
        unitPrice: cur === 'USD' ? item.priceUsd : item.priceNgn,
        weightKg: 0.5,
      }));
      const res = await api.getQuote(quoteItems, {
        currency: cur,
        country: 'NG',
        state: stateValue,
        couponCode: couponCode.trim() || undefined,
        channel: 'MOBILE',
      });
      setQuote(res.data);
      setStep('review');
    } catch {
      setError('Failed to calculate order total. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    setError(null);
    setPlacing(true);
    try {
      const res = await api.checkout({
        items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
        shippingAddress: {
          firstName,
          lastName,
          line1,
          line2: line2 || undefined,
          city,
          state: stateValue,
          country: 'NG',
          phone: phone || undefined,
        },
        currency: cur,
        guestEmail: !isAuthenticated ? guestEmail : undefined,
        customerNote: customerNote || undefined,
        couponCode: couponCode.trim() || undefined,
        agentCode: agentVerified?.code,
        idempotencyKey: `checkout_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      });
      const order = res.data;

      // Begin payment. The server mediates all Paystack communication and
      // returns the hosted-checkout URL.
      const pay = await api.initiatePayment({
        orderId: order.id,
        channel: 'MOBILE',
        customerEmail: isAuthenticated ? undefined : guestEmail,
        customerName: `${firstName} ${lastName}`.trim(),
      });

      if (!pay.data.checkoutUrl) {
        throw new Error('Could not start payment. Please try again.');
      }

      // Cart is cleared only once we have a valid order + payment session.
      clearCart();

      // Open the Paystack hosted page in an in-app browser. This resolves
      // when the customer closes/finishes it.
      await WebBrowser.openBrowserAsync(pay.data.checkoutUrl);

      // Reconcile the payment server-side (the app never calls Paystack).
      // The confirmation screen also re-checks, so a still-pending result
      // here is fine — it will settle there.
      try {
        await api.reconcilePayment(pay.data.merchantReference);
      } catch {
        // Non-fatal — the confirmation screen reconciles again.
      }

      router.replace(
        `/order-confirmation?order=${order.orderNumber}&ref=${encodeURIComponent(pay.data.merchantReference)}`,
      );
    } catch (err: unknown) {
      const msg = (err as { message?: string | string[] })?.message;
      setError((Array.isArray(msg) ? msg[0] : msg) || 'Failed to place order.');
    } finally {
      setPlacing(false);
    }
  };

  if (items.length === 0) return null;

  return (
    <Screen scroll keyboardAware edges={['bottom']}>
      {/* Stepper */}
      <View style={styles.stepRow}>
        <StepPill label="Shipping" active={step === 'shipping'} done={step === 'review'} />
        <View style={styles.stepBar} />
        <StepPill label="Review & Pay" active={step === 'review'} />
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={16} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {step === 'shipping' ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Shipping Address</Text>
          <View style={{ gap: spacing[3] }}>
            {!isAuthenticated ? (
              <Input
                label="Email"
                required
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                value={guestEmail}
                onChangeText={setGuestEmail}
              />
            ) : null}
            <View style={{ flexDirection: 'row', gap: spacing[3] }}>
              <View style={{ flex: 1 }}>
                <Input
                  label="First name"
                  required
                  value={firstName}
                  onChangeText={setFirstName}
                  textContentType="givenName"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Last name"
                  required
                  value={lastName}
                  onChangeText={setLastName}
                  textContentType="familyName"
                />
              </View>
            </View>
            <Input
              label="Address line 1"
              required
              value={line1}
              onChangeText={setLine1}
              textContentType="streetAddressLine1"
            />
            <Input
              label="Address line 2"
              value={line2}
              onChangeText={setLine2}
              textContentType="streetAddressLine2"
            />
            <View style={{ flexDirection: 'row', gap: spacing[3] }}>
              <View style={{ flex: 1 }}>
                <Input
                  label="City"
                  required
                  value={city}
                  onChangeText={setCity}
                  textContentType="addressCity"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>State</Text>
                <Pressable onPress={() => setShowStates((v) => !v)} style={styles.select}>
                  <Text style={styles.selectText}>{stateValue}</Text>
                  <Ionicons
                    name={showStates ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={colors.ink[500]}
                  />
                </Pressable>
                {showStates ? (
                  <View style={styles.dropdown}>
                    <ScrollView style={{ maxHeight: 220 }}>
                      {NG_STATES.map((s) => (
                        <Pressable
                          key={s}
                          onPress={() => {
                            setStateValue(s);
                            setShowStates(false);
                          }}
                          style={styles.dropdownItem}
                        >
                          <Text
                            style={[
                              text.sm,
                              { color: s === stateValue ? colors.primary[700] : colors.ink[900] },
                            ]}
                          >
                            {s}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                ) : null}
              </View>
            </View>
            <Input
              label="Phone"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              textContentType="telephoneNumber"
            />
            <Input
              label="Order note"
              hint="Optional special instructions"
              multiline
              numberOfLines={2}
              value={customerNote}
              onChangeText={setCustomerNote}
            />
            <Input
              label="Promo code"
              hint="Optional — applied at the next step"
              autoCapitalize="characters"
              value={couponCode}
              onChangeText={setCouponCode}
            />
            {/* Marketing-agent referral code. Server-validated before checkout. */}
            {agentVerified ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: spacing[3],
                  paddingHorizontal: spacing[3],
                  paddingVertical: spacing[2] + 2,
                  backgroundColor: '#ECFDF5',
                  borderWidth: 1,
                  borderColor: '#A7F3D0',
                  borderRadius: 10,
                }}
              >
                <View style={{ flexShrink: 1 }}>
                  <Text
                    style={{
                      fontFamily: 'monospace',
                      fontWeight: '700',
                      color: '#047857',
                    }}
                  >
                    ✓ {agentVerified.code}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.ink[500], marginTop: 2 }}>
                    {agentVerified.name}
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    setAgentVerified(null);
                    setAgentCode('');
                    setAgentError(null);
                  }}
                >
                  <Text style={{ fontSize: 12, color: '#B91C1C', textDecorationLine: 'underline' }}>
                    Clear
                  </Text>
                </Pressable>
              </View>
            ) : (
              <>
                <Input
                  label="Agent code (optional)"
                  hint="If a marketing agent referred you, enter their code"
                  autoCapitalize="characters"
                  value={agentCode}
                  onChangeText={(t) => {
                    setAgentCode(t.toUpperCase());
                    setAgentError(null);
                  }}
                />
                {agentCode.trim().length > 0 && (
                  <Button
                    title={agentVerifying ? 'Verifying…' : 'Verify agent code'}
                    onPress={verifyAgentCode}
                    loading={agentVerifying}
                    variant="secondary"
                    fullWidth
                    size="md"
                    style={{ marginTop: spacing[2] }}
                  />
                )}
                {agentError ? (
                  <Text
                    style={{
                      fontSize: 12,
                      color: '#B91C1C',
                      marginTop: spacing[2],
                    }}
                  >
                    ⚠ {agentError}
                  </Text>
                ) : null}
              </>
            )}
          </View>

          <Button
            title={loading ? 'Calculating…' : 'Continue to Review'}
            loading={loading}
            onPress={handleProceedToReview}
            fullWidth
            size="lg"
            style={{ marginTop: spacing[5] }}
            iconRight={<Ionicons name="arrow-forward" size={16} color="#fff" />}
          />
        </View>
      ) : null}

      {step === 'review' && quote ? (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Order Items</Text>
            {quote.lines.map((line) => (
              <View key={line.variantId} style={styles.reviewItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{line.productName}</Text>
                  {line.variantName ? <Text style={styles.variant}>{line.variantName}</Text> : null}
                  <Text style={styles.qty}>Qty: {line.quantity}</Text>
                </View>
                <Text style={styles.price}>{formatPrice(line.lineTotal, cur)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Shipping To</Text>
            <Text style={styles.addrLine}>
              {firstName} {lastName}
            </Text>
            <Text style={styles.addrLine}>
              {line1}
              {line2 ? `, ${line2}` : ''}
            </Text>
            <Text style={styles.addrLine}>
              {city}, {stateValue}, Nigeria
            </Text>
            {phone ? <Text style={styles.addrLine}>{phone}</Text> : null}
            <Pressable onPress={() => setStep('shipping')} style={{ marginTop: spacing[2] }}>
              <Text style={styles.editLink}>Edit address</Text>
            </Pressable>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Order Summary</Text>
            <SummaryRow label="Subtotal" value={formatPrice(quote.subtotal, cur)} />
            {quote.discountTotal > 0 ? (
              <SummaryRow
                label="Discount"
                value={`-${formatPrice(quote.discountTotal, cur)}`}
                tone="success"
              />
            ) : null}
            <SummaryRow
              label="Shipping"
              value={quote.shippingTotal === 0 ? 'Free' : formatPrice(quote.shippingTotal, cur)}
            />
            <SummaryRow label="Tax" value={formatPrice(quote.taxTotal, cur)} />
            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatPrice(quote.grandTotal, cur)}</Text>
            </View>
          </View>

          <Button
            title={placing ? 'Placing order…' : 'Place Order'}
            loading={placing}
            onPress={handlePlaceOrder}
            fullWidth
            size="lg"
            style={{ marginTop: spacing[3] }}
            icon={<Ionicons name="lock-closed-outline" size={16} color="#fff" />}
          />
          <Pressable
            onPress={() => setStep('shipping')}
            style={{ alignItems: 'center', padding: spacing[4] }}
          >
            <Text style={[text.sm, { color: colors.ink[500], fontWeight: '600' }]}>
              Back to Shipping
            </Text>
          </Pressable>
        </>
      ) : null}

      {/* Fallback summary for shipping step */}
      {step === 'shipping' ? (
        <View style={[styles.card, { marginTop: spacing[4] }]}>
          <Text style={styles.cardTitle}>Order Summary</Text>
          <SummaryRow
            label={`Subtotal (${items.reduce((s, i) => s + i.quantity, 0)} items)`}
            value={formatPrice(subtotal, cur)}
          />
          <SummaryRow label="Shipping" value="Calculated next" />
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatPrice(subtotal, cur)}</Text>
          </View>
        </View>
      ) : null}

      <View style={{ height: spacing[8] }} />
    </Screen>
  );
}

function StepPill({
  label,
  active,
  done,
}: {
  label: string;
  active?: boolean;
  done?: boolean;
}) {
  return (
    <View
      style={[
        styles.pill,
        active && styles.pillActive,
        done && styles.pillDone,
      ]}
    >
      <Text
        style={[
          text.xs,
          { fontWeight: '700' },
          active && { color: colors.primary[800] },
          done && { color: colors.success },
          !active && !done && { color: colors.ink[500] },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function SummaryRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'success';
}) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text
        style={[
          styles.summaryValue,
          tone === 'success' && { color: colors.success, fontWeight: '700' },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[4],
  },
  stepBar: { flex: 1, height: 1, backgroundColor: colors.ink[200] },
  pill: {
    paddingHorizontal: spacing[3],
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.surface[1],
    borderWidth: 1,
    borderColor: colors.ink[100],
  },
  pillActive: { backgroundColor: colors.primary[100], borderColor: colors.primary[200] },
  pillDone: { backgroundColor: colors.successLight, borderColor: colors.success },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.dangerLight,
    padding: spacing[3],
    borderRadius: radius.md,
    marginBottom: spacing[3],
  },
  errorText: { ...text.sm, color: colors.danger, flex: 1 },
  card: {
    backgroundColor: colors.surface[0],
    borderWidth: 1,
    borderColor: colors.ink[100],
    borderRadius: radius.xl,
    padding: spacing[5],
    marginBottom: spacing[4],
  },
  cardTitle: { ...text.base, fontWeight: '700', color: colors.ink[900], marginBottom: spacing[4] },
  fieldLabel: { ...text.xs, fontWeight: '600', color: colors.ink[700], marginBottom: 6 },
  select: {
    height: 46,
    paddingHorizontal: spacing[4],
    borderWidth: 1,
    borderColor: colors.ink[200],
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface[0],
  },
  selectText: { ...text.sm, color: colors.ink[900] },
  dropdown: {
    marginTop: spacing[1],
    borderWidth: 1,
    borderColor: colors.ink[100],
    borderRadius: radius.md,
    backgroundColor: colors.surface[0],
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.ink[100],
  },
  reviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.ink[100],
  },
  name: { ...text.sm, fontWeight: '700', color: colors.ink[900] },
  variant: { ...text.xs, color: colors.ink[500], marginTop: 2 },
  qty: { ...text.xs, color: colors.ink[400], marginTop: 2 },
  price: { ...text.sm, fontWeight: '700', color: colors.ink[900] },
  addrLine: { ...text.sm, color: colors.ink[700], marginBottom: 2 },
  editLink: { ...text.xs, color: colors.primary[700], fontWeight: '700' },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryLabel: { ...text.sm, color: colors.ink[500] },
  summaryValue: { ...text.sm, color: colors.ink[900], fontWeight: '600' },
  totalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing[3],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.ink[100],
  },
  totalLabel: { ...text.base, fontWeight: '700', color: colors.ink[900] },
  totalValue: { ...text.xl, fontWeight: '700', color: colors.ink[900] },
});
