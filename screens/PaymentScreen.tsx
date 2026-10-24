import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import RazorpayCheckout, { type RazorpayError } from 'react-native-razorpay';
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
  const params = route.params;
  const [order, setOrder] = useState<CheckoutOrder | null>(null);
  const [status, setStatus] = useState<CheckoutStatus | null>(null);
  const [busy, setBusy] = useState(false);
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
          navigation.replace('MySubscriptions');
        else
          navigation.replace('BookingConfirmation', {
            libraryName: params.libraryName,
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
      } else if (['REFUND_PENDING', 'REFUNDED'].includes(current.status))
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
  async function start() {
    setBusy(true);
    setMessage('');
    try {
      const prepared =
        order ??
        (await prepareCheckout(
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
        ));
      orderRef.current = prepared;
      setOrder(prepared);
      if (prepared.status !== 'CREATED') return;
      if (prepared.razorpay) await payInApp(prepared);
      else await Linking.openURL(prepared.checkoutUrl);
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
          ? 'Payment cancelled. Your seat stays held for a few minutes; tap Pay now to retry.'
          : 'Payment did not go through. If money was debited, it will be confirmed or refunded automatically. Check the status before paying again.',
      );
      check();
      return;
    }
    if (mounted.current) setMessage('Verifying your paymentâ€¦');
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
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="Secure checkout" />
        <Text style={styles.title}>{params.libraryName}</Text>
        <Text style={{ color: colors.text }}>
          {params.planName} - {params.selectedDate}
        </Text>
        <Text style={styles.description}>{params.selectedTimeLabel}</Text>
        <Text style={styles.description}>
          Pay securely with Razorpay without leaving the app. Access is
          confirmed only after the server verifies your payment.
        </Text>
        {order && (
          <Text style={styles.heading}>
            Total: INR {(order.amountPaise / 100).toFixed(2)}
          </Text>
        )}
        <Text style={styles.description}>
          Customer cancellations receive a full refund before the reserved
          start, and no refund afterward.
        </Text>
        <TouchableOpacity
          disabled={busy || !!terminal}
          onPress={start}
          style={[styles.button, !!terminal && styles.disabled]}
        >
          {busy ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={styles.buttonText}>
              {order ? 'Retry payment' : 'Pay now'}
            </Text>
          )}
        </TouchableOpacity>
        {order && (
          <TouchableOpacity onPress={check}>
            <Text style={{ color: colors.primary }}>Check payment status</Text>
          </TouchableOpacity>
        )}
        {!!message && <Text style={styles.description}>{message}</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, gap: 20 },
    title: { color: colors.text, fontSize: 22, fontWeight: '700' },
    heading: { color: colors.text, fontWeight: '700' },
    description: { color: colors.subText },
    button: { backgroundColor: colors.primary, padding: 16, borderRadius: 12 },
    disabled: { opacity: 0.5 },
    buttonText: {
      color: colors.onPrimary,
      textAlign: 'center',
      fontWeight: '700',
    },
  });
