import React, { useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  ActivityIndicator,
  Alert,
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
import { useAuth } from '../context/AuthContext';
import { createBooking } from '../lib/bookings';
import type { ThemeColors } from '../constants/colors';

const paymentMethods = [
  { id: 'upi', title: 'UPI', subtitle: 'Pay using UPI apps', icon: 'phone-portrait-outline' },
  { id: 'card', title: 'Credit / Debit Card', subtitle: 'Visa, Mastercard, RuPay', icon: 'card-outline' },
  { id: 'netbanking', title: 'Net Banking', subtitle: 'Pay through your bank', icon: 'business-outline' },
];

export default function PaymentScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const { session } = useAuth();

  const {
    libraryId,
    libraryName,
    selectedDate,
    selectedDateLabel,
    selectedTime,
    selectedTimeLabel,
    planId,
    planName,
    planPrice,
    taxesAndFees,
    totalAmount,
  } = route.params;

  const [selectedMethod, setSelectedMethod] = useState('upi');
  const [isPaying, setIsPaying] = useState(false);

  const handlePay = async () => {
    if (!session) {
      return;
    }

    setIsPaying(true);
    try {
      const booking = await createBooking({
        userId: session.user.id,
        libraryId,
        libraryName,
        planId,
        bookingDate: selectedDate,
        dateLabel: selectedDateLabel,
        timeSlot: selectedTime,
        timeLabel: selectedTimeLabel,
      });

      navigation.navigate('BookingConfirmation', {
        libraryName,
        bookingCode: booking.booking_code,
        selectedDateLabel,
        selectedTimeLabel,
        planName,
        totalAmount,
      });
    } catch (error: any) {
      Alert.alert('Payment failed', error.message ?? 'Could not save your booking. Please try again.');
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} activeOpacity={0.7} onPress={() => navigation.goBack()}>
            <Icon name="chevron-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.bookingCard}>
          <Text style={styles.sectionLabel}>BOOKING SUMMARY</Text>
          <Text style={styles.libraryName}>{libraryName}</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Date</Text>
              <Text style={styles.infoValue}>{selectedDateLabel}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Time</Text>
              <Text style={styles.infoValue}>{selectedTimeLabel}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Plan</Text>
              <Text style={styles.infoValue}>{planName}</Text>
            </View>
          </View>
        </View>

        <View style={styles.amountCard}>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Plan Price</Text>
            <Text style={styles.amountValue}>₹{planPrice}.00</Text>
          </View>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Taxes & Fees</Text>
            <Text style={styles.amountValue}>₹{taxesAndFees}.00</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>₹{totalAmount}.00</Text>
          </View>
        </View>

        <View style={styles.paymentSection}>
          <Text style={styles.sectionTitle}>Payment Method</Text>

          {paymentMethods.map(method => {
            const isSelected = selectedMethod === method.id;
            return (
              <TouchableOpacity
                key={method.id}
                style={[styles.paymentMethod, isSelected && styles.selectedPaymentMethod]}
                activeOpacity={0.8}
                onPress={() => setSelectedMethod(method.id)}
              >
                <View style={[styles.methodIcon, isSelected && styles.selectedMethodIcon]}>
                  <Icon
                    name={method.icon}
                    size={19}
                    color={isSelected ? colors.onPrimary : colors.subText}
                  />
                </View>

                <View style={styles.methodInfo}>
                  <Text style={[styles.methodTitle, isSelected && styles.selectedMethodTitle]}>{method.title}</Text>
                  <Text style={styles.methodSubtitle}>{method.subtitle}</Text>
                </View>

                <View style={[styles.radioOuter, isSelected && styles.selectedRadioOuter]}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.securityCard}>
          <View style={styles.securityIconCircle}>
            <Icon name="shield-checkmark" size={16} color={colors.success} />
          </View>
          <View style={styles.securityInfo}>
            <Text style={styles.securityTitle}>Secure Payment</Text>
            <Text style={styles.securityText}>Your payment information is protected with secure encryption.</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.payButton, isPaying && styles.payButtonDisabled]}
          activeOpacity={0.8}
          onPress={handlePay}
          disabled={isPaying}
        >
          {isPaying ? (
            <ActivityIndicator color={colors.onPrimary} style={styles.payButtonText} />
          ) : (
            <>
              <Text style={styles.payButtonText}>Pay ₹{totalAmount}.00</Text>
              <Icon name="chevron-forward" size={20} color={colors.onPrimary} />
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.footerText}>By continuing, you agree to the booking and cancellation policy.</Text>
      </ScrollView>
    </SafeAreaView>
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
    headerTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
    headerSpacer: { width: 36 },
    bookingCard: { padding: 16, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, color: colors.primary },
    libraryName: { marginTop: 8, fontSize: 18, fontWeight: '700', color: colors.text },
    infoRow: { flexDirection: 'row', marginTop: 18 },
    infoItem: { flex: 1 },
    infoLabel: { fontSize: 10, color: colors.placeholder },
    infoValue: { marginTop: 4, fontSize: 12, fontWeight: '600', color: colors.text },
    amountCard: { marginTop: 16, padding: 16, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    amountRow: { minHeight: 28, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    amountLabel: { fontSize: 12, color: colors.subText },
    amountValue: { fontSize: 12, fontWeight: '600', color: colors.text },
    divider: { height: 1, marginVertical: 8, backgroundColor: colors.border },
    totalRow: { minHeight: 34, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    totalLabel: { fontSize: 14, fontWeight: '700', color: colors.text },
    totalValue: { fontSize: 18, fontWeight: '800', color: colors.primary },
    paymentSection: { marginTop: 24 },
    sectionTitle: { marginBottom: 12, fontSize: 16, fontWeight: '700', color: colors.text },
    paymentMethod: {
      minHeight: 72,
      marginBottom: 10,
      paddingHorizontal: 12,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      flexDirection: 'row',
      alignItems: 'center',
    },
    selectedPaymentMethod: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
    methodIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surfaceAlt, justifyContent: 'center', alignItems: 'center' },
    selectedMethodIcon: { backgroundColor: colors.primary },
    methodInfo: { flex: 1, marginLeft: 12 },
    methodTitle: { fontSize: 13, fontWeight: '700', color: colors.text },
    selectedMethodTitle: { color: colors.primary },
    methodSubtitle: { marginTop: 3, fontSize: 10, color: colors.subText },
    radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: colors.border, justifyContent: 'center', alignItems: 'center' },
    selectedRadioOuter: { borderColor: colors.primary },
    radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
    securityCard: { marginTop: 14, padding: 12, borderRadius: 14, backgroundColor: colors.surfaceSubtle, flexDirection: 'row', alignItems: 'center' },
    securityIconCircle: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.successLight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    securityInfo: { flex: 1, marginLeft: 10 },
    securityTitle: { fontSize: 11, fontWeight: '700', color: colors.text },
    securityText: { marginTop: 2, fontSize: 9, lineHeight: 13, color: colors.subText },
    payButton: { minHeight: 52, marginTop: 18, paddingHorizontal: 16, borderRadius: 14, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center' },
    payButtonDisabled: { opacity: 0.7 },
    payButtonText: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.onPrimary },
    footerText: { marginTop: 10, paddingHorizontal: 8, fontSize: 9, lineHeight: 14, color: colors.placeholder, textAlign: 'center' },
  });
