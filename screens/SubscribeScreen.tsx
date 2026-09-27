import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '../components/ScreenHeader';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { useStyles } from '../hooks/useStyles';
import { fetchPlans, formatPlanDuration, type Plan } from '../lib/plans';
import {
  fetchSlotOptions,
  fetchSubscriptionOptions,
  toLocalDateId,
  type SlotOption,
} from '../lib/libraryAvailability';
import SlotPicker from '../components/SlotPicker';
import DayStepper, { MIN_FLEX_DAYS } from '../components/DayStepper';
import {
  cancelSubscription,
  createSubscription,
  fetchActiveSubscription,
  type Subscription,
} from '../lib/subscriptions';
import type { ThemeColors } from '../constants/colors';

// A SESSIONS-unit plan is a visit-count pass, not a calendar range -- it has
// no meaningful start/end date, so it isn't offered as a subscription here
// (the server-side RPC rejects it too, this just keeps the button honest).
// A flexible plan is stored as duration_unit HOURS (the rate's unit) but IS
// offered here -- it's always a customer-chosen-length subscription.
const SUBSCRIBABLE_UNITS: Plan['duration_unit'][] = ['DAYS', 'MONTHS', 'YEARS'];
const isSubscribable = (plan: Plan) => plan.is_flexible || SUBSCRIBABLE_UNITS.includes(plan.duration_unit);

export default function SubscribeScreen() {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const route = useRoute<any>();
  const { libraryId, libraryName } = route.params;

  const [plans, setPlans] = useState<Plan[]>([]);
  const [activeSubscription, setActiveSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [subscribingPlanId, setSubscribingPlanId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  // Libraries with individually-tracked seats: the subscriber picks a daily
  // time slot and the server assigns a seat that is free for the whole plan.
  // Customers only ever see counts, never seat numbers.
  const [isSeatVendor, setIsSeatVendor] = useState(false);
  const [totalSeats, setTotalSeats] = useState(0);
  const [pickerPlanId, setPickerPlanId] = useState<string | null>(null);
  const [slotOptions, setSlotOptions] = useState<SlotOption[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [selectedStart, setSelectedStart] = useState<string | null>(null);
  // Flexible plans only: how many of the 1-14 days the customer has picked.
  const [selectedDays, setSelectedDays] = useState(MIN_FLEX_DAYS);

  const loadData = useCallback(async () => {
    try {
      const [plansData, subscription, seatProbe] = await Promise.all([
        fetchPlans(libraryId),
        fetchActiveSubscription(libraryId),
        fetchSlotOptions(libraryId, toLocalDateId(new Date()), null).catch(() => ({ totalSeats: 0, options: [] })),
      ]);
      setPlans(plansData.filter(isSubscribable));
      setActiveSubscription(subscription);
      setIsSeatVendor(seatProbe.totalSeats > 0);
      setTotalSeats(seatProbe.totalSeats);
    } catch (error: any) {
      console.error('Failed to load plans:', error.message);
    } finally {
      setIsLoading(false);
    }
  }, [libraryId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const loadOptionsForDays = async (plan: Plan, days: number) => {
    setIsLoadingOptions(true);
    try {
      const data = await fetchSubscriptionOptions(libraryId, plan.id, plan.is_flexible ? days : undefined);
      setSlotOptions(data.options);
      setTotalSeats(data.totalSeats);
    } catch (error: any) {
      Alert.alert('Could not load availability', error.message);
    } finally {
      setIsLoadingOptions(false);
    }
  };

  const openTimePicker = async (plan: Plan) => {
    setPickerPlanId(plan.id);
    setSelectedStart(null);
    setSlotOptions([]);
    setSelectedDays(MIN_FLEX_DAYS);
    // A flexible non-seat plan has nothing to check availability for -- just
    // the day count, which the customer hasn't set yet, so there's nothing to
    // fetch until they open the picker (and, for seat vendors, nothing to show
    // until they do).
    if (isSeatVendor) {
      await loadOptionsForDays(plan, MIN_FLEX_DAYS);
    }
  };

  const handleDaysChange = (plan: Plan, days: number) => {
    setSelectedDays(days);
    setSelectedStart(null);
    if (isSeatVendor) {
      loadOptionsForDays(plan, days);
    }
  };

  const handleSubscribe = async (plan: Plan) => {
    const needsPicker = plan.is_flexible || isSeatVendor;
    const pickerReady = pickerPlanId === plan.id && (!isSeatVendor || !!selectedStart);

    if (needsPicker && !pickerReady) {
      // First tap opens the picker (day stepper and/or time picker); the
      // confirm tap subscribes.
      await openTimePicker(plan);
      return;
    }

    setSubscribingPlanId(plan.id);
    try {
      const subscription = await createSubscription(
        libraryId,
        plan.id,
        isSeatVendor ? selectedStart ?? undefined : undefined,
        plan.is_flexible ? selectedDays : undefined,
      );
      setPickerPlanId(null);
      await loadData();
      Alert.alert(
        'Subscribed',
        subscription.seat_number
          ? `Your ${plan.name} plan is now active. Your seat is ${subscription.seat_number}.`
          : `Your ${plan.name} plan is now active.`,
      );
    } catch (error: any) {
      Alert.alert('Could not subscribe', error.message);
    } finally {
      setSubscribingPlanId(null);
    }
  };

  const handleCancel = () => {
    if (!activeSubscription) {
      return;
    }
    Alert.alert('Cancel subscription', `Cancel your ${activeSubscription.plan_name} plan?`, [
      { text: 'Keep plan', style: 'cancel' },
      {
        text: 'Cancel plan',
        style: 'destructive',
        onPress: async () => {
          setIsCancelling(true);
          try {
            await cancelSubscription(activeSubscription.id);
            await loadData();
          } catch (error: any) {
            Alert.alert('Could not cancel plan', error.message);
          } finally {
            setIsCancelling(false);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Plans" />
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Plans</Text>
          <Text style={styles.subtitle}>{libraryName}</Text>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : (
          <>
            {activeSubscription ? (
              <View style={styles.activeBanner}>
                <Icon name="checkmark-circle" size={20} color={colors.success} />
                <Text style={styles.activeBannerText}>
                  Your {activeSubscription.plan_name} plan is active until{' '}
                  {new Date(activeSubscription.end_date).toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                  .
                </Text>
              </View>
            ) : (
              <View style={styles.featureCard}>
                <Text style={styles.featureTitle}>Subscribe to {libraryName}</Text>
                <Text style={styles.featureText}>
                  Choose a plan for flexible, recurring access to this library.
                </Text>
              </View>
            )}

            {activeSubscription && (
              <TouchableOpacity
                style={styles.cancelButton}
                activeOpacity={0.8}
                onPress={handleCancel}
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <ActivityIndicator color={colors.danger} />
                ) : (
                  <Text style={styles.cancelButtonText}>Cancel subscription</Text>
                )}
              </TouchableOpacity>
            )}

            <Text style={styles.sectionTitle}>Choose Your Plan</Text>

            {plans.length === 0 && (
              <Text style={styles.emptyText}>No subscription plans available for this library yet.</Text>
            )}

            {plans.map(plan => {
              const isCurrentPlan = activeSubscription?.plan_id === plan.id;
              const disableButton =
                subscribingPlanId !== null || isCurrentPlan || !!activeSubscription;
              const isPickerOpenForThisPlan = pickerPlanId === plan.id;
              const flexTotal = plan.is_flexible
                ? Math.round(plan.price * (plan.daily_hours ?? 0) * selectedDays)
                : 0;

              return (
                <View key={plan.id} style={styles.planCard}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <View style={styles.priceRow}>
                    {plan.is_flexible ? (
                      <Text style={styles.price}>₹{plan.price}/hr</Text>
                    ) : (
                      <>
                        <Text style={styles.price}>₹{plan.price}</Text>
                        <Text style={styles.duration}>/{formatPlanDuration(plan)}</Text>
                      </>
                    )}
                  </View>
                  {plan.description && (
                    <Text style={styles.planDescription}>{plan.description}</Text>
                  )}

                  {isPickerOpenForThisPlan && plan.is_flexible && (
                    <View style={styles.pickerWrap}>
                      <DayStepper
                        days={selectedDays}
                        onChange={days => handleDaysChange(plan, days)}
                        pricePerDay={Math.round(plan.price * (plan.daily_hours ?? 0))}
                        totalPrice={flexTotal}
                      />
                    </View>
                  )}

                  {isPickerOpenForThisPlan && isSeatVendor && (
                    <View style={styles.pickerWrap}>
                      <SlotPicker
                        options={slotOptions}
                        totalSeats={totalSeats}
                        loading={isLoadingOptions}
                        selectedStart={selectedStart}
                        onSelect={setSelectedStart}
                        countSuffix={
                          plan.is_flexible
                            ? `for your ${selectedDays}-day pass`
                            : `for the full ${formatPlanDuration(plan)}`
                        }
                      />
                    </View>
                  )}

                  <TouchableOpacity
                    style={[styles.selectButton, disableButton && styles.selectButtonDisabled]}
                    activeOpacity={0.8}
                    onPress={() => handleSubscribe(plan)}
                    disabled={disableButton}
                  >
                    {subscribingPlanId === plan.id ? (
                      <ActivityIndicator color={colors.onPrimary} />
                    ) : (
                      <Text style={styles.selectButtonText}>
                        {isCurrentPlan
                          ? 'Current Plan'
                          : activeSubscription
                          ? 'Cancel current plan first'
                          : plan.is_flexible
                          ? !isPickerOpenForThisPlan
                            ? 'Choose your days'
                            : isSeatVendor && !selectedStart
                            ? 'Select a time above'
                            : `Confirm ${selectedDays}-day pass · ₹${flexTotal}`
                          : isSeatVendor && !isPickerOpenForThisPlan
                          ? 'Choose daily time'
                          : isSeatVendor && !selectedStart
                          ? 'Select a time above'
                          : `Subscribe for ${formatPlanDuration(plan)}`}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { flex: 1 },
    contentContainer: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 },
    header: { marginTop: 8 },
    title: { fontSize: 30, lineHeight: 36, fontWeight: '700', color: colors.text },
    subtitle: { marginTop: 8, fontSize: 16, lineHeight: 24, color: colors.subText },
    loader: { marginTop: 40 },
    activeBanner: {
      marginTop: 24,
      padding: 16,
      borderRadius: 16,
      backgroundColor: colors.successLight,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    activeBannerText: { flex: 1, fontSize: 13, lineHeight: 19, fontWeight: '600', color: colors.text },
    featureCard: { marginTop: 24, padding: 20, borderRadius: 18, backgroundColor: colors.primaryLight, borderWidth: 1, borderColor: colors.border },
    featureTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
    featureText: { marginTop: 8, fontSize: 14, lineHeight: 21, color: colors.subText },
    cancelButton: { marginTop: 14, alignSelf: 'flex-start' },
    cancelButtonText: { fontSize: 14, fontWeight: '600', color: colors.danger },
    sectionTitle: { marginTop: 28, marginBottom: 14, fontSize: 20, fontWeight: '700', color: colors.text },
    emptyText: { fontSize: 14, color: colors.subText },
    planCard: { position: 'relative', marginBottom: 16, padding: 20, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    planName: { fontSize: 20, fontWeight: '700', color: colors.text },
    priceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 10 },
    price: { fontSize: 28, fontWeight: '700', color: colors.primary },
    duration: { marginLeft: 4, fontSize: 14, color: colors.subText },
    pickerWrap: { marginTop: 14 },
    planDescription: { marginTop: 8, marginBottom: 4, fontSize: 14, lineHeight: 21, color: colors.subText },
    selectButton: { height: 48, marginTop: 20, borderRadius: 12, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
    selectButtonDisabled: { backgroundColor: colors.subText },
    selectButtonText: { fontSize: 15, fontWeight: '700', color: colors.onPrimary, textAlign: 'center' },
  });
