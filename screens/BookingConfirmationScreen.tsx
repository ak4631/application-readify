import React from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import QRCode from 'react-native-qrcode-svg';
import { useTheme } from '../context/ThemeContext';
import { useStyles } from '../hooks/useStyles';
import type { ThemeColors } from '../constants/colors';

export default function BookingConfirmationScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { colors } = useTheme();
  const styles = useStyles(createStyles);

  const {
    libraryName,
    bookingCode,
    selectedDateLabel,
    selectedTimeLabel,
    planName,
    totalAmount,
  } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.successSection}>
          <View style={styles.successIcon}>
            <Icon name="checkmark" size={36} color={colors.success} />
          </View>
          <Text style={styles.title}>Booking Confirmed</Text>
          <Text style={styles.subtitle}>Your study session has been booked successfully.</Text>
        </View>

        <View style={styles.bookingCard}>
          <Text style={styles.cardLabel}>BOOKING DETAILS</Text>
          <Text style={styles.libraryName}>{libraryName}</Text>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{selectedDateLabel}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Time</Text>
              <Text style={styles.detailValue}>{selectedTimeLabel}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Plan</Text>
              <Text style={styles.detailValue}>{planName}</Text>
            </View>
          </View>
        </View>

        <View style={styles.qrCard}>
          <Text style={styles.qrTitle}>Library Entry Pass</Text>
          <Text style={styles.qrSubtitle}>Show this QR code at the library entrance.</Text>
          <View style={styles.qrContainer}>
            <QRCode value={bookingCode} size={140} color="#111827" backgroundColor="#FFFFFF" />
          </View>
          <Text style={styles.qrBookingId}>{bookingCode}</Text>
          <Text style={styles.qrNote}>Keep this QR code ready when you arrive.</Text>
        </View>

        <View style={styles.paymentCard}>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Amount Paid</Text>
            <Text style={styles.paymentAmount}>₹{totalAmount}.00</Text>
          </View>
          <View style={styles.bookingCodeRow}>
            <Text style={styles.bookingCodeLabel}>Booking ID</Text>
            <Text style={styles.bookingCode}>{bookingCode}</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Icon name="information" size={16} color={colors.primary} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Save your Booking ID</Text>
            <Text style={styles.infoText}>Keep this ID handy when visiting the library or contacting support.</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.primaryButton} activeOpacity={0.8} onPress={() => navigation.navigate('Bookings')}>
          <Text style={styles.primaryButtonText}>View My Bookings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.8} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.secondaryButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { flex: 1 },
    contentContainer: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 32 },
    successSection: { alignItems: 'center', paddingHorizontal: 20 },
    successIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.successLight, justifyContent: 'center', alignItems: 'center' },
    title: { marginTop: 18, fontSize: 25, lineHeight: 31, fontWeight: '800', color: colors.text, textAlign: 'center' },
    subtitle: { marginTop: 8, fontSize: 13, lineHeight: 20, color: colors.subText, textAlign: 'center' },
    bookingCard: { marginTop: 28, padding: 16, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    cardLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, color: colors.primary },
    libraryName: { marginTop: 9, fontSize: 18, fontWeight: '700', color: colors.text },
    divider: { height: 1, marginVertical: 16, backgroundColor: colors.border },
    detailRow: { flexDirection: 'row', marginBottom: 15 },
    detailItem: { flex: 1, paddingRight: 8 },
    detailLabel: { fontSize: 10, color: colors.placeholder },
    detailValue: { marginTop: 4, fontSize: 11, lineHeight: 16, fontWeight: '600', color: colors.text },
    qrCard: { marginTop: 14, padding: 20, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
    qrTitle: { fontSize: 18, fontWeight: '800', color: colors.text, textAlign: 'center' },
    qrSubtitle: { marginTop: 6, fontSize: 11, lineHeight: 17, color: colors.subText, textAlign: 'center' },
    qrContainer: {
      marginTop: 18,
      padding: 14,
      borderRadius: 16,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: colors.border,
    },
    qrBookingId: { marginTop: 14, fontSize: 12, fontWeight: '800', letterSpacing: 0.5, color: colors.primary },
    qrNote: { marginTop: 6, fontSize: 10, color: colors.placeholder, textAlign: 'center' },
    paymentCard: { marginTop: 14, padding: 16, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    paymentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    paymentLabel: { fontSize: 13, fontWeight: '600', color: colors.subText },
    paymentAmount: { fontSize: 18, fontWeight: '800', color: colors.success },
    bookingCodeRow: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    bookingCodeLabel: { fontSize: 11, color: colors.placeholder },
    bookingCode: { fontSize: 11, fontWeight: '700', color: colors.text, letterSpacing: 0.3 },
    infoCard: { marginTop: 14, padding: 12, borderRadius: 14, backgroundColor: colors.surfaceSubtle, flexDirection: 'row', alignItems: 'center' },
    infoIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
    infoContent: { flex: 1, marginLeft: 10 },
    infoTitle: { fontSize: 11, fontWeight: '700', color: colors.text },
    infoText: { marginTop: 2, fontSize: 9, lineHeight: 14, color: colors.subText },
    primaryButton: { minHeight: 50, marginTop: 22, borderRadius: 14, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
    primaryButtonText: { fontSize: 14, fontWeight: '700', color: colors.onPrimary },
    secondaryButton: { minHeight: 50, marginTop: 10, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' },
    secondaryButtonText: { fontSize: 14, fontWeight: '700', color: colors.text },
  });
