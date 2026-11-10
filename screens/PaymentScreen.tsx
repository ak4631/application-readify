import { useAppAlert } from '../context/DialogContext';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import RazorpayCheckout, { type RazorpayError } from 'react-native-razorpay';
import Icon from 'react-native-vector-icons/Ionicons';
import ScreenHeader from '../components/ScreenHeader';
import { useTheme } from '../context/ThemeContext';
import { useStyles } from '../hooks/useStyles';
import type { ThemeColors } from '../constants/colors';
import {
  fetchCheckoutStatus,
  newCheckoutKey,
  prepareCheckout,
  verifyPayment,
  type CheckoutOrder,
  type CheckoutStatus,
} from '../lib/checkout';
import { supabase } from '../lib/supabase';

// Razorpay's code for a sheet the customer closed themselves.
const PAYMENT_CANCELLED = 0;

export default function PaymentScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const Alert = useAppAlert();
  const params = route.params;
  const [order, setOrder] = useState<CheckoutOrder | null>(null);
  const [status, setStatus] = useState<CheckoutStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [preparing, setPreparing] = useState(true);
  const [prepareError, setPrepareError] = useState('');
  const [prepareAttempt, setPrepareAttempt] = useState(0);
  const [message, setMessage] = useState('');
  const key = useRef(newCheckoutKey());
  // State lags a render behind; checks right after payment read this instead.
  const orderRef = useRef<CheckoutOrder | null>(null);
  const finished = useRef(false);
  const checking = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const check = useCallback(async () => {
    const target = order ?? orderRef.current;
    if (!target || finished.current || checking.current) return;
    checking.current = true;
    try {
      const current = await fetchCheckoutStatus(target.id);
      if (!mounted.current) return;
      setStatus(current);
      if (current.status === 'CAPTURED') {
        finished.current = true;
        if (params.kind === 'subscription')
          navigation.reset({
            index: 0,
            routes: [
              {
                name: 'Main',
                params: {
                  screen: 'Bookings',
                  params: { section: 'subscriptions' },
                },
              },
            ],
          });
        else
          navigation.replace('BookingConfirmation', {
            libraryName: params.libraryName,
            category: params.category,
            bookingCode: current.bookingCode,
            selectedDateLabel: new Date(current.startsAt).toLocaleDateString(
              'en-IN',
              { timeZone: current.timeZone },
            ),
            selectedTimeLabel: params.selectedTimeLabel,
            planName: params.planName,
            totalAmount: current.amountPaise / 100,
            seatNumber: current.seatNumber,
          });
      } else if (current.status === 'REFUNDED')
        setMessage(
          'Your payment has been refunded. You can choose another booking.',
        );
      else if (current.status === 'REFUND_PENDING')
        setMessage(
          'This reservation could not be confirmed. Your payment is being refunded. Check the latest status here.',
        );
      else if (['EXPIRED', 'CANCELLED'].includes(current.status))
        setMessage(
          'This reservation has expired or was cancelled. Return to availability to start a new checkout.',
        );
    } catch {
      if (mounted.current)
        setMessage(
          'Could not verify payment yet. Check again before starting another payment.',
        );
    } finally {
      checking.current = false;
    }
  }, [order, params, navigation]);
  useEffect(() => {
    if (!order) return;
    const timer = setInterval(() => {
      if (AppState.currentState === 'active') check();
    }, 5000);
    const listener = AppState.addEventListener('change', state => {
      if (state === 'active') check();
    });
    check();
    return () => {
      clearInterval(timer);
      listener.remove();
    };
  }, [order, check]);
  // Prepare the server-priced reservation before enabling the payment action.
  useEffect(() => {
    let active = true;
    setPreparing(true);
    setPrepareError('');
    prepareCheckout(
      params.kind === 'extension'
        ? {
            kind: 'extension',
            targetId: params.targetId,
            planId: params.planId,
            hours: params.hours,
          }
        : {
            kind: params.kind,
            vendorId: params.libraryId,
            planId: params.planId,
            date: params.selectedDate,
            startTime: params.startTime,
            days: params.days,
          },
      key.current,
    )
      .then(prepared => {
        if (!active) return;
        orderRef.current = prepared;
        setOrder(prepared);
      })
      .catch((error: Error) => {
        if (active)
          setPrepareError(
            error.message ||
              'Could not prepare your booking. Please try again.',
          );
      })
      .finally(() => {
        if (active) setPreparing(false);
      });
    return () => {
      active = false;
    };
  }, [params, prepareAttempt]);

  async function start() {
    if (!order || order.status !== 'CREATED' || busy || preparing) return;
    setBusy(true);
    setMessage('');
    try {
      if (order.razorpay) await payInApp(order);
      else await Linking.openURL(order.checkoutUrl);
    } catch (error: any) {
      Alert.alert('Checkout unavailable', error.message ?? 'Please try again.');
    } finally {
      if (mounted.current) setBusy(false);
    }
  }
  async function payInApp(prepared: CheckoutOrder) {
    const { data } = await supabase.auth.getSession();
    let result;
    try {
      result = await RazorpayCheckout.open({
        key: prepared.razorpay!.keyId,
        order_id: prepared.razorpay!.orderId,
        amount: prepared.amountPaise,
        currency: 'INR',
        name: 'Vriddhora',
        description: `${params.libraryName} - ${params.planName}`,
        prefill: { email: data.session?.user?.email ?? undefined },
        theme: { color: colors.primary },
      });
    } catch (error) {
      if (!mounted.current) return;
      const { code } = (error ?? {}) as Partial<RazorpayError>;
      setMessage(
        code === PAYMENT_CANCELLED
          ? 'Payment cancelled. Your reservation stays held for a few minutes; tap Pay to retry.'
          : 'Payment did not go through. If money was debited, it will be confirmed or refunded automatically. Check the status before paying again.',
      );
      check();
      return;
    }
    if (mounted.current) setMessage('Verifying your payment...');
    try {
      await verifyPayment(prepared, result);
    } catch {
      // Webhook confirmation and polling below still settle the order.
    }
    check();
  }
  const terminal =
    status &&
    ['EXPIRED', 'CANCELLED', 'REFUND_PENDING', 'REFUNDED'].includes(
      status.status,
    );
  const paymentDisabled =
    busy || preparing || !order || order.status !== 'CREATED' || !!terminal;
  const dateLabel = params.selectedDate
    ? new Date(`${params.selectedDate}T12:00:00`).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Today';
  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Review & pay" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.progress}>
          <Text style={styles.progressDone}>1 Choose plan</Text>
          <Icon name="chevron-forward" size={16} color={colors.subText} />
          <Text style={styles.progressActive}>2 Review & pay</Text>
        </View>
        <Text style={styles.pageTitle}>One step from your next visit</Text>
        <Text style={styles.description}>
          Check your booking details before you pay.
        </Text>
        <View style={styles.bookingCard}>
          <View style={styles.cardHeading}>
            <View style={styles.venueIcon}>
              <Icon name="business-outline" size={24} color={colors.primary} />
            </View>
            <View style={styles.cardCopy}>
              <Text style={styles.title}>{params.libraryName}</Text>
              <Text style={styles.planName}>{params.planName}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Icon name="calendar-outline" size={19} color={colors.primary} />
            <Text style={styles.detailText}>
              {dateLabel}
              {params.days
                ? ` / ${params.days} day${params.days === 1 ? '' : 's'}`
                : ''}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Icon name="time-outline" size={19} color={colors.primary} />
            <Text style={styles.detailText}>{params.selectedTimeLabel}</Text>
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            disabled={busy}
            style={styles.secondaryAction}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.link}>Edit booking</Text>
          </TouchableOpacity>
        </View>
        {preparing && (
          <View style={styles.summary}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.description}>
              Checking availability and final price...
            </Text>
          </View>
        )}
        {!!prepareError && (
          <View accessibilityRole="alert" style={styles.summary}>
            <Text style={styles.error}>{prepareError}</Text>
            <TouchableOpacity
              accessibilityRole="button"
              style={styles.secondaryAction}
              onPress={() => setPrepareAttempt(value => value + 1)}
            >
              <Text style={styles.link}>Try again</Text>
            </TouchableOpacity>
          </View>
        )}
        {order && (
          <View style={styles.summary}>
            <Text style={styles.sectionTitle}>Price details</Text>
            <View style={styles.priceRow}>
              <Text style={styles.description}>Booking amount</Text>
              <Text style={styles.amount}>
                ₹{((order.amountPaise - 600) / 100).toFixed(2)}
              </Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.description}>Booking fee</Text>
              <Text style={styles.amount}>₹6.00</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.priceRow}>
              <Text style={styles.sectionTitle}>Total to pay</Text>
              <Text style={styles.total}>
                ₹{(order.amountPaise / 100).toFixed(2)}
              </Text>
            </View>
            <Text style={styles.hint}>
              Your reservation is held temporarily while you pay.
            </Text>
          </View>
        )}
        <View style={styles.policyCard}>
          <Icon
            name="shield-checkmark-outline"
            size={22}
            color={colors.primary}
          />
          <View style={styles.cardCopy}>
            <Text style={styles.sectionTitle}>Book with confidence</Text>
            <Text style={styles.description}>
              Full refund if you cancel before your reserved start. No refund
              afterward.
            </Text>
          </View>
        </View>
        <View style={styles.detailRow}>
          <Icon name="qr-code-outline" size={20} color={colors.primary} />
          <Text style={styles.description}>
            After confirmation, your entry pass is ready in My bookings.
          </Text>
        </View>
        {!!message && (
          <View accessibilityRole="alert" style={styles.summary}>
            <Text style={styles.detailText}>{message}</Text>
          </View>
        )}
        {!!terminal && (
          <TouchableOpacity
            accessibilityRole="button"
            style={styles.secondaryAction}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.link}>Back to availability</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
      <View style={styles.footer}>
        <View style={styles.priceRow}>
          <Text style={styles.description}>Total payable</Text>
          <Text style={styles.footerTotal}>
            {order ? `₹${(order.amountPaise / 100).toFixed(2)}` : '--'}
          </Text>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={
            order
              ? `Pay ₹${(order.amountPaise / 100).toFixed(2)}`
              : 'Preparing checkout'
          }
          disabled={paymentDisabled}
          onPress={start}
          style={[styles.button, paymentDisabled && styles.disabled]}
        >
          {busy ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <>
              <Icon
                name="lock-closed-outline"
                size={18}
                color={colors.onPrimary}
              />
              <Text style={styles.buttonText}>
                {order
                  ? `Pay ₹${(order.amountPaise / 100).toFixed(2)}`
                  : preparing
                  ? 'Preparing checkout...'
                  : 'Payment unavailable'}
              </Text>
              <Icon name="arrow-forward" size={20} color={colors.onPrimary} />
            </>
          )}
        </TouchableOpacity>
        <Text style={styles.secureNote}>
          Secure payment powered by Razorpay
        </Text>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surfaceSubtle },
    content: { padding: 20, gap: 16, paddingBottom: 28 },
    progress: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    progressDone: { color: colors.subText, fontSize: 12 },
    progressActive: { color: colors.primary, fontWeight: '700', fontSize: 12 },
    pageTitle: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
      lineHeight: 34,
    },
    bookingCard: {
      borderRadius: 24,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 20,
      gap: 14,
    },
    cardHeading: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    venueIcon: {
      width: 48,
      height: 48,
      borderRadius: 16,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardCopy: { flex: 1, gap: 6 },
    title: { fontSize: 20, fontWeight: '700', color: colors.text },
    planName: { color: colors.primary, fontWeight: '600', fontSize: 14 },
    divider: { height: 1, backgroundColor: colors.border },
    detailRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    detailText: {
      color: colors.text,
      fontSize: 14,
      lineHeight: 21,
      flexShrink: 1,
    },
    description: {
      color: colors.subText,
      fontSize: 14,
      lineHeight: 21,
      flexShrink: 1,
    },
    hint: { color: colors.subText, fontSize: 12, lineHeight: 18 },
    summary: {
      padding: 20,
      gap: 16,
      backgroundColor: colors.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sectionTitle: { color: colors.text, fontWeight: '700', fontSize: 16 },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
    },
    amount: { color: colors.text, fontSize: 15, fontWeight: '500' },
    total: { color: colors.primary, fontSize: 22, fontWeight: '700' },
    policyCard: {
      flexDirection: 'row',
      gap: 12,
      backgroundColor: colors.primaryLight,
      borderRadius: 20,
      padding: 16,
    },
    secondaryAction: { minHeight: 48, justifyContent: 'center' },
    link: { color: colors.primary, fontWeight: '600', fontSize: 14 },
    error: { color: colors.danger, fontSize: 14, lineHeight: 21 },
    footer: {
      backgroundColor: colors.surface,
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 8,
      gap: 12,
      borderTopWidth: 1,
      borderColor: colors.border,
    },
    footerTotal: { color: colors.text, fontSize: 22, fontWeight: '700' },
    button: {
      minHeight: 56,
      borderRadius: 18,
      backgroundColor: colors.primary,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 12,
      padding: 16,
    },
    buttonText: { color: colors.onPrimary, fontSize: 16, fontWeight: '700' },
    disabled: { opacity: 0.5 },
    secureNote: { color: colors.subText, fontSize: 11, textAlign: 'center' },
  });
