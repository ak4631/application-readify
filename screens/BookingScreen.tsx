import React, { useEffect, useMemo, useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { useStyles } from '../hooks/useStyles';
import { getLibraryImage } from '../constants/dummyImages';
import { fetchPlans, formatPlanDuration, type Plan } from '../lib/plans';
import { fetchSlotAvailability, type SlotAvailability } from '../lib/slots';
import type { ThemeColors } from '../constants/colors';

type BookingDate = {
  id: string;
  day: string;
  date: string;
  month: string;
  fullDate: string;
};

const timeSlots = [
  { id: 'morning', title: 'Morning', time: '6:00 AM - 12:00 PM', icon: 'sunny-outline' },
  { id: 'afternoon', title: 'Afternoon', time: '12:00 PM - 5:00 PM', icon: 'partly-sunny-outline' },
  { id: 'evening', title: 'Evening', time: '5:00 PM - 10:00 PM', icon: 'cloudy-night-outline' },
  { id: 'night', title: 'Night', time: '10:00 PM - 6:00 AM', icon: 'moon-outline' },
];

const TAXES_AND_FEES = 6;

function getBookingDates(): BookingDate[] {
  const dates: BookingDate[] = [];
  const now = new Date();

  for (let index = 0; index < 7; index += 1) {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(now.getDate() + index);

    dates.push({
      id: date.toISOString().split('T')[0],
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      date: String(date.getDate()).padStart(2, '0'),
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      fullDate: date.toLocaleDateString('en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }),
    });
  }

  return dates;
}

export default function BookingScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const { libraryId, libraryName } = route.params;

  const dates = useMemo(() => getBookingDates(), []);
  const [selectedDate, setSelectedDate] = useState(dates[0]?.id ?? '');
  const [selectedTime, setSelectedTime] = useState('morning');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [slotAvailability, setSlotAvailability] = useState<SlotAvailability[]>([]);

  useEffect(() => {
    let isMounted = true;

    fetchPlans(libraryId)
      .then(data => {
        if (!isMounted) {
          return;
        }
        setPlans(data);
        setSelectedPlanId(data[0]?.id ?? null);
      })
      .catch(() => {
        if (isMounted) {
          setPlans([]);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingPlans(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [libraryId]);

  useEffect(() => {
    if (!selectedDate) {
      return;
    }
    let isMounted = true;

    fetchSlotAvailability(libraryId, selectedDate)
      .then(data => {
        if (isMounted) {
          setSlotAvailability(data);
        }
      })
      .catch(() => {
        if (isMounted) {
          setSlotAvailability([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [libraryId, selectedDate]);

  useEffect(() => {
    if (slotAvailability.length === 0) {
      return;
    }
    const current = slotAvailability.find(slot => slot.time_slot === selectedTime);
    if (current && current.available_capacity <= 0) {
      const firstAvailable = slotAvailability.find(slot => slot.available_capacity > 0);
      if (firstAvailable) {
        setSelectedTime(firstAvailable.time_slot);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slotAvailability]);

  const selectedDateData = dates.find(date => date.id === selectedDate);
  const selectedTimeSlot = timeSlots.find(slot => slot.id === selectedTime);
  const selectedPlan = plans.find(plan => plan.id === selectedPlanId);

  const planPrice = selectedPlan?.price ?? 0;
  const totalAmount = planPrice + TAXES_AND_FEES;

  const handleContinueToPayment = () => {
    if (!selectedPlan) {
      return;
    }

    navigation.navigate('Payment', {
      libraryId,
      libraryName,
      selectedDate,
      selectedDateLabel: selectedDateData?.fullDate ?? '',
      selectedTime,
      selectedTimeLabel: selectedTimeSlot?.time ?? '',
      planId: selectedPlan.id,
      planName: selectedPlan.name,
      planPrice,
      taxesAndFees: TAXES_AND_FEES,
      totalAmount,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
          >
            <Icon name="chevron-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Book Your Study Session</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.libraryCard}>
          <Image
            source={{ uri: getLibraryImage(libraryId) }}
            style={styles.libraryImage}
            resizeMode="cover"
          />
          <View style={styles.libraryInfo}>
            <Text style={styles.libraryName}>{libraryName}</Text>
            <Text style={styles.libraryRating}>★ 4.8 · Study space</Text>
          </View>
        </View>

        <View style={styles.stepSection}>
          <View style={styles.stepHeader}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepTitle}>Select Date</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRow}>
            {dates.map(item => {
              const isSelected = selectedDate === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.dateCard, isSelected && styles.selectedDateCard]}
                  activeOpacity={0.8}
                  onPress={() => setSelectedDate(item.id)}
                >
                  <Text style={[styles.dateDay, isSelected && styles.selectedDateText]}>{item.day}</Text>
                  <Text style={[styles.dateNumber, isSelected && styles.selectedDateText]}>{item.date}</Text>
                  <Text style={[styles.dateMonth, isSelected && styles.selectedDateText]}>{item.month}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.stepSection}>
          <View style={styles.stepHeader}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepTitle}>Select Time Slot</Text>
          </View>

          <View style={styles.timeGrid}>
            {timeSlots.map(slot => {
              const isSelected = selectedTime === slot.id;
              const availability = slotAvailability.find(s => s.time_slot === slot.id);
              const isFull = availability != null && availability.available_capacity <= 0;
              return (
                <TouchableOpacity
                  key={slot.id}
                  style={[
                    styles.timeCard,
                    isSelected && styles.selectedTimeCard,
                    isFull && styles.timeCardDisabled,
                  ]}
                  activeOpacity={0.8}
                  disabled={isFull}
                  onPress={() => setSelectedTime(slot.id)}
                >
                  <Icon
                    name={slot.icon}
                    size={16}
                    color={isSelected ? colors.primary : colors.subText}
                  />
                  <Text style={[styles.timeTitle, isSelected && styles.selectedTimeText]}>{slot.title}</Text>
                  <Text style={styles.timeRange}>{slot.time}</Text>
                  {isFull ? (
                    <Text style={styles.timeFullText}>Full</Text>
                  ) : (
                    availability != null &&
                    availability.available_capacity <= 5 && (
                      <Text style={styles.timeLeftText}>{availability.available_capacity} left</Text>
                    )
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.stepSection}>
          <View style={styles.stepHeader}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepTitle}>Select Plan</Text>
          </View>

          {isLoadingPlans ? (
            <ActivityIndicator color={colors.primary} style={styles.plansLoader} />
          ) : plans.length > 0 ? (
            <View style={styles.planList}>
              {plans.map(plan => {
                const isSelected = selectedPlanId === plan.id;
                return (
                  <TouchableOpacity
                    key={plan.id}
                    style={[styles.planCard, isSelected && styles.selectedPlanCard]}
                    activeOpacity={0.8}
                    onPress={() => setSelectedPlanId(plan.id)}
                  >
                    {isSelected && (
                      <View style={styles.selectedIndicator}>
                        <Icon name="checkmark" size={11} color={colors.onPrimary} />
                      </View>
                    )}
                    <Text style={[styles.planTitle, isSelected && styles.selectedPlanText]}>{plan.name}</Text>
                    <Text style={styles.planDuration}>{formatPlanDuration(plan)}</Text>
                    <Text style={[styles.planPrice, isSelected && styles.selectedPlanText]}>
                      ₹{plan.price}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.noPlansCard}>
              <Icon name="pricetags-outline" size={22} color={colors.subText} />
              <Text style={styles.noPlansText}>
                This listing hasn't added any plans yet. Check back soon.
              </Text>
            </View>
          )}
        </View>

        {selectedPlan && (
          <View style={styles.stepSection}>
            <View style={styles.stepHeader}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>4</Text>
              </View>
              <Text style={styles.stepTitle}>Booking Summary</Text>
            </View>

            <View style={styles.summaryCard}>
              <SummaryRow styles={styles} label="Library" value={libraryName} />
              <SummaryRow styles={styles} label="Date" value={selectedDateData?.fullDate ?? ''} />
              <SummaryRow styles={styles} label="Time" value={selectedTimeSlot?.time ?? ''} />
              <SummaryRow styles={styles} label="Plan" value={`${selectedPlan.name} (${formatPlanDuration(selectedPlan)})`} />
              <View style={styles.summaryDivider} />
              <SummaryRow styles={styles} label="Plan Price" value={`₹${planPrice}.00`} />
              <SummaryRow styles={styles} label="Taxes & Fees" value={`₹${TAXES_AND_FEES}.00`} />
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalValue}>₹{totalAmount}.00</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.paymentSection}>
          <View style={styles.stepHeader}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>5</Text>
            </View>
            <Text style={styles.stepTitle}>Payment</Text>
          </View>

          <TouchableOpacity
            style={[styles.paymentButton, !selectedPlan && styles.paymentButtonDisabled]}
            activeOpacity={0.8}
            onPress={handleContinueToPayment}
            disabled={!selectedPlan}
          >
            <Text style={styles.paymentButtonText}>Continue to Payment</Text>
            {selectedPlan && <Text style={styles.paymentAmount}>₹{totalAmount}.00</Text>}
            <Icon name="chevron-forward" size={20} color={colors.onPrimary} />
          </TouchableOpacity>

          <View style={styles.policyRow}>
            <Icon name="information-circle-outline" size={13} color={colors.subText} />
            <Text style={styles.policyText}>
              You can cancel or reschedule according to the library policy.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryRow({
  label,
  value,
  styles,
}: {
  label: string;
  value: string;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { flex: 1 },
    contentContainer: { paddingHorizontal: 16, paddingBottom: 32 },
    header: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
    headerSpacer: { width: 36 },
    libraryCard: {
      flexDirection: 'row',
      padding: 10,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    libraryImage: { width: 92, height: 68, borderRadius: 10, backgroundColor: colors.surfaceAlt, justifyContent: 'center', alignItems: 'center' },
    libraryInfo: { flex: 1, marginLeft: 12, justifyContent: 'center' },
    libraryName: { fontSize: 14, fontWeight: '700', color: colors.text },
    libraryRating: { marginTop: 5, fontSize: 11, color: colors.subText },
    stepSection: { marginTop: 22 },
    stepHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    stepNumber: { width: 22, height: 22, borderRadius: 7, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
    stepNumberText: { fontSize: 11, fontWeight: '700', color: colors.onPrimary },
    stepTitle: { marginLeft: 8, fontSize: 15, fontWeight: '700', color: colors.text },
    dateRow: { paddingRight: 4 },
    dateCard: {
      width: 48,
      height: 64,
      marginRight: 8,
      borderRadius: 11,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    selectedDateCard: { backgroundColor: colors.primary, borderColor: colors.primary },
    dateDay: { fontSize: 9, fontWeight: '600', color: colors.subText },
    dateNumber: { marginTop: 2, fontSize: 16, fontWeight: '700', color: colors.text },
    dateMonth: { marginTop: 1, fontSize: 9, color: colors.subText },
    selectedDateText: { color: colors.onPrimary },
    timeGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    timeCard: {
      width: '48.5%',
      minHeight: 88,
      marginBottom: 10,
      padding: 10,
      borderRadius: 13,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    selectedTimeCard: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
    timeCardDisabled: { opacity: 0.45 },
    timeTitle: { marginTop: 4, fontSize: 12, fontWeight: '700', color: colors.text },
    selectedTimeText: { color: colors.primary },
    timeRange: { marginTop: 3, fontSize: 8, color: colors.subText },
    timeFullText: { marginTop: 3, fontSize: 9, fontWeight: '700', color: colors.danger },
    timeLeftText: { marginTop: 3, fontSize: 9, fontWeight: '700', color: colors.warning },
    plansLoader: { marginTop: 10 },
    planList: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    planCard: {
      width: '48.5%',
      minHeight: 96,
      marginBottom: 10,
      padding: 10,
      borderRadius: 13,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    selectedPlanCard: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
    selectedIndicator: {
      position: 'absolute',
      top: 7,
      right: 7,
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    planTitle: { fontSize: 12, lineHeight: 16, fontWeight: '700', color: colors.text, textAlign: 'center' },
    selectedPlanText: { color: colors.primary },
    planDuration: { marginTop: 4, fontSize: 10, color: colors.subText },
    planPrice: { marginTop: 6, fontSize: 14, fontWeight: '800', color: colors.text },
    noPlansCard: {
      minHeight: 88,
      borderRadius: 13,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
      gap: 8,
    },
    noPlansText: { fontSize: 12, lineHeight: 18, color: colors.subText, textAlign: 'center' },
    summaryCard: { padding: 14, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    summaryRow: { minHeight: 26, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    summaryLabel: { fontSize: 11, color: colors.subText },
    summaryValue: { maxWidth: '62%', fontSize: 11, fontWeight: '600', color: colors.text, textAlign: 'right' },
    summaryDivider: { height: 1, marginVertical: 7, backgroundColor: colors.border },
    totalRow: {
      marginTop: 6,
      paddingTop: 9,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    totalLabel: { fontSize: 13, fontWeight: '700', color: colors.text },
    totalValue: { fontSize: 16, fontWeight: '800', color: colors.primary },
    paymentSection: { marginTop: 22 },
    paymentButton: {
      minHeight: 52,
      paddingHorizontal: 16,
      borderRadius: 14,
      backgroundColor: colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
    },
    paymentButtonDisabled: { opacity: 0.5 },
    paymentButtonText: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.onPrimary },
    paymentAmount: { marginRight: 8, fontSize: 13, fontWeight: '700', color: colors.onPrimary },
    policyRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 12, paddingHorizontal: 6 },
    policyText: { flex: 1, fontSize: 11, lineHeight: 16, color: colors.subText },
  });
