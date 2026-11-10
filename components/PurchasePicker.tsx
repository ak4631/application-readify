import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useServiceCatalog } from '../hooks/useServiceCatalog';
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
  kind: initialKind,
}: {
  kind: 'flex' | 'subscription';
}) {
  const [kind, setKind] = useState(initialKind);
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const { libraryId, libraryName, category = 'library' } = route.params;
  const services = useServiceCatalog();
  const categoryEnabled =
    !services.loading && !services.error && services.enabled(category);
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
  const [retry, setRetry] = useState(0);
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
    setError('');
    setOptions({ totalSeats: 0, options: [] });
    if (!categoryEnabled) {
      setLoading(false);
      return;
    }
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
  }, [libraryId, kind, retry, categoryEnabled]);
  useEffect(() => {
    if (!planId || !categoryEnabled) return;
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
  }, [libraryId, planId, date, days, kind, retry, categoryEnabled]);
  const selected = options.options.find(
    slot => slot.start_time === time && slot.seats_available > 0,
  );
  const price = plan
    ? kind === 'flex'
      ? plan.price * (plan.daily_hours ?? 0) * days
      : plan.price
    : 0;
  if (services.loading || services.error || !services.enabled(category)) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="Choose your plan" />
        <View style={styles.content}>
          <Text style={styles.title}>{libraryName}</Text>
          {services.loading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text style={styles.description}>
              {services.error
                ? 'Could not check service availability. Please try again.'
                : 'This category is coming soon. Explore another category to find an available space.'}
            </Text>
          )}
          {services.error && (
            <TouchableOpacity
              style={styles.retryAction}
              onPress={services.retry}
            >
              <Text style={{ color: colors.primary }}>Try again</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="Choose your plan" />
        <Text style={styles.title}>{libraryName}</Text>
        <View style={styles.types}>
          {(['flex', 'subscription'] as const).map(value => (
            <TouchableOpacity
              key={value}
              accessibilityRole="tab"
              accessibilityState={{ selected: kind === value }}
              onPress={() => {
                if (kind !== value) {
                  setPlans([]);
                  setPlanId(null);
                  setTime(null);
                  setKind(value);
                }
              }}
              style={[
                styles.type,
                kind === value && { backgroundColor: colors.primary },
              ]}
            >
              <Text
                style={{
                  color: kind === value ? colors.onPrimary : colors.text,
                  ...styles.typeTitle,
                }}
              >
                {value === 'flex' ? 'Day pass' : 'Longer plan'}
              </Text>
              <Text
                style={{
                  color: kind === value ? colors.onPrimary : colors.subText,
                  ...styles.typeCaption,
                }}
              >
                {value === 'flex' ? '1-14 days' : 'Monthly, quarterly, yearly'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.heading}>1. Choose a plan</Text>
        <Text style={styles.description}>
          {kind === 'flex'
            ? 'For a short stay. Choose consecutive days and the same daily hours.'
            : 'For a regular routine. Your plan includes access during the daily hours shown below.'}
        </Text>
        {plans.map(item => (
          <TouchableOpacity
            key={item.id}
            onPress={() => setPlanId(item.id)}
            style={[styles.card, item.id === planId && styles.selected]}
          >
            <Text style={styles.heading}>{item.name}</Text>
            <Text style={styles.description}>
              {item.is_flexible
                ? formatPlanDuration(item)
                : `₹${item.price} · ${formatPlanDuration(item)}`}
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
        <Text style={styles.heading}>2. Choose a start date</Text>
        <ScrollView horizontal>
          {dates.map(value => (
            <TouchableOpacity
              key={value}
              accessibilityRole="button"
              accessibilityLabel={`Start date ${value}`}
              accessibilityState={{ selected: date === value }}
              onPress={() => setDate(value)}
              style={[styles.date, date === value && styles.selectedDate]}
            >
              <Text
                style={[
                  styles.dateText,
                  date === value && styles.selectedDateText,
                ]}
              >
                {date === value && '\u2713 '}
                {new Date(`${value}T12:00:00`).toLocaleDateString('en-IN', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                })}
              </Text>
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
        <Text style={styles.heading}>3. Daily access hours</Text>
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
                  ? 'Seats available'
                  : 'Seats available'}
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
          <View accessibilityRole="alert">
            <Text style={{ color: colors.danger }}>{error}</Text>
            <TouchableOpacity
              style={styles.retryAction}
              onPress={() => setRetry(value => value + 1)}
            >
              <Text style={{ color: colors.primary }}>Try again</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      <View style={styles.footer}>
        <Text style={{ color: colors.text }}>
          {plan
            ? `Plan ₹${price.toFixed(2)} + ₹6 booking fee`
            : 'Choose a plan to see pricing.'}
        </Text>
        <TouchableOpacity
          disabled={loading || !plan || !selected}
          onPress={() =>
            navigation.navigate('Payment', {
              kind,
              category,
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
          <Text style={styles.buttonText}>Review booking</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, gap: 18 },
    retryAction: { minHeight: 48, justifyContent: 'center' },
    footer: {
      padding: 20,
      gap: 12,
      borderTopWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    typeTitle: { fontWeight: '700' },
    typeCaption: { fontSize: 12 },
    types: {
      flexDirection: 'row',
      padding: 4,
      borderRadius: 18,
      backgroundColor: colors.surfaceAlt,
      gap: 4,
    },
    type: {
      flex: 1,
      minHeight: 72,
      padding: 12,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 14,
      gap: 6,
    },
    title: { color: colors.text, fontSize: 26, fontWeight: '700' },
    heading: { color: colors.text, fontWeight: '700' },
    description: { color: colors.subText },
    card: {
      padding: 20,
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: 20,
    },
    selected: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryLight,
    },
    dateText: { color: colors.text, fontWeight: '500' },
    selectedDate: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    selectedDateText: { color: colors.onPrimary, fontWeight: '700' },
    date: {
      minHeight: 48,
      justifyContent: 'center',
      padding: 12,
      marginRight: 8,
      borderWidth: 1,
      borderRadius: 8,
      borderColor: colors.border,
    },
    slot: {
      padding: 14,
      borderWidth: 1,
      borderRadius: 16,
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
