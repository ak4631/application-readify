import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import ScreenHeader from './ScreenHeader';
import DayStepper from './DayStepper';
import { fetchPlans, formatPlanDuration, type Plan } from '../lib/plans';
import {
  fetchPurchaseOptions,
  toLocalDateId,
  type SlotOptions,
} from '../lib/libraryAvailability';
import { useTheme } from '../context/ThemeContext';
import { useStyles } from '../hooks/useStyles';
import type { ThemeColors } from '../constants/colors';

export default function PurchasePicker({
  kind,
}: {
  kind: 'flex' | 'subscription';
}) {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const { libraryId, libraryName } = route.params;
  const [plans, setPlans] = useState<Plan[]>([]);
  const [planId, setPlanId] = useState<string | null>(null);
  const [date, setDate] = useState(toLocalDateId(new Date()));
  const [days, setDays] = useState(1);
  const [time, setTime] = useState<string | null>(null);
  const [options, setOptions] = useState<SlotOptions>({
    totalSeats: 0,
    options: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const dates = useMemo(
    () =>
      Array.from({ length: 14 }, (_, index) => {
        const value = new Date();
        value.setDate(value.getDate() + index);
        return toLocalDateId(value);
      }),
    [],
  );
  const plan = plans.find(item => item.id === planId);
  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchPlans(libraryId)
      .then(data => {
        if (!active) return;
        const eligible = data.filter(item =>
          kind === 'flex'
            ? item.is_flexible
            : !item.is_flexible &&
              !!item.daily_start &&
              !!item.daily_hours &&
              ((item.duration_unit === 'MONTHS' &&
                [1, 3].includes(item.duration_value)) ||
                (item.duration_unit === 'YEARS' && item.duration_value === 1)),
        );
        setPlans(eligible);
        setPlanId(eligible[0]?.id ?? null);
      })
      .catch(() => {
        if (active)
          setError('Could not load plans. Please reopen this screen.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [libraryId, kind]);
  useEffect(() => {
    if (!planId) return;
    let active = true;
    setLoading(true);
    setTime(null);
    setOptions({ totalSeats: 0, options: [] });
    setError('');
    fetchPurchaseOptions(
      libraryId,
      planId,
      date,
      kind === 'flex' ? days : undefined,
    )
      .then(data => {
        if (!active) return;
        setOptions(data);
        if (kind === 'subscription')
          setTime(
            data.options.find(slot => slot.seats_available > 0)?.start_time ??
              null,
          );
      })
      .catch(() => {
        if (active)
          setError(
            'Could not check availability. Please choose the date again.',
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [libraryId, planId, date, days, kind]);
  const selected = options.options.find(
    slot => slot.start_time === time && slot.seats_available > 0,
  );
  const price = plan
    ? kind === 'flex'
      ? plan.price * (plan.daily_hours ?? 0) * days
      : plan.price
    : 0;
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader
          title={kind === 'flex' ? 'Flex Booking' : 'Subscriptions'}
        />
        <Text style={styles.title}>{libraryName}</Text>
        <Text style={styles.description}>
          {kind === 'flex'
            ? 'Choose 1–14 consecutive days and a daily time. Spans containing closed days cannot be booked.'
            : 'Choose a plan and start date. The same seat is held during the owner-defined daily access window for your whole term.'}
        </Text>
        {plans.map(item => (
          <TouchableOpacity
            key={item.id}
            onPress={() => setPlanId(item.id)}
            style={[styles.card, item.id === planId && styles.selected]}
          >
            <Text style={styles.heading}>{item.name}</Text>
            <Text style={styles.description}>
              ₹{item.price} · {formatPlanDuration(item)}
              {item.daily_start && !item.is_flexible
                ? ` · starts ${item.daily_start}`
                : ''}
            </Text>
          </TouchableOpacity>
        ))}
        {!loading && !plans.length && (
          <Text style={styles.description}>
            No {kind === 'flex' ? 'Flex' : 'subscription'} plans are available
            yet.
          </Text>
        )}
        <Text style={styles.heading}>Start date</Text>
        <ScrollView horizontal>
          {dates.map(value => (
            <TouchableOpacity
              key={value}
              onPress={() => setDate(value)}
              style={[styles.date, date === value && styles.selected]}
            >
              <Text style={{ color: colors.text }}>{value}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {kind === 'flex' && plan && (
          <DayStepper
            days={days}
            onChange={setDays}
            pricePerDay={plan.price * (plan.daily_hours ?? 0)}
            totalPrice={price}
          />
        )}
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          options.options.map(slot => (
            <TouchableOpacity
              key={slot.start_time}
              disabled={slot.seats_available === 0}
              onPress={() => setTime(slot.start_time)}
              style={[
                styles.slot,
                time === slot.start_time && styles.selected,
                !slot.seats_available && styles.disabled,
              ]}
            >
              <Text style={{ color: colors.text }}>
                {slot.start_time} – {slot.end_time} daily
              </Text>
              <Text style={styles.description}>
                {slot.seats_available === 0
                  ? 'Unavailable'
                  : slot.seats_available === options.totalSeats
                  ? 'Fully available'
                  : 'Partially available'}
              </Text>
            </TouchableOpacity>
          ))
        )}
        {!loading && plan && !options.options.length && (
          <Text style={styles.description}>
            No window is available for the entire selected span. A closure, plan
            window or existing reservation may prevent this booking. Try another
            date or a shorter Flex span.
          </Text>
        )}
        {!!error && (
          <Text accessibilityRole="alert" style={{ color: colors.danger }}>
            {error}
          </Text>
        )}
        <Text style={{ color: colors.text }}>
          Plan total: ₹{price.toFixed(2)}. The final total is calculated
          securely at checkout.
        </Text>
        <TouchableOpacity
          disabled={loading || !plan || !selected}
          onPress={() =>
            navigation.navigate('Payment', {
              kind,
              libraryId,
              libraryName,
              planId: plan!.id,
              planName: plan!.name,
              selectedDate: date,
              startTime: selected!.start_time,
              days: kind === 'flex' ? days : undefined,
              selectedTimeLabel: `${selected!.start_time} – ${
                selected!.end_time
              } daily`,
            })
          }
          style={[styles.button, (loading || !selected) && styles.disabled]}
        >
          <Text style={styles.buttonText}>Continue to checkout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, gap: 18 },
    title: { color: colors.text, fontSize: 20, fontWeight: '700' },
    heading: { color: colors.text, fontWeight: '700' },
    description: { color: colors.subText },
    card: {
      padding: 16,
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: 12,
    },
    selected: { borderColor: colors.primary },
    date: {
      padding: 12,
      marginRight: 8,
      borderWidth: 1,
      borderRadius: 8,
      borderColor: colors.border,
    },
    slot: {
      padding: 14,
      borderWidth: 1,
      borderRadius: 10,
      borderColor: colors.border,
    },
    disabled: { opacity: 0.5 },
    button: { backgroundColor: colors.primary, padding: 16, borderRadius: 12 },
    buttonText: {
      color: colors.onPrimary,
      textAlign: 'center',
      fontWeight: '700',
    },
  });
