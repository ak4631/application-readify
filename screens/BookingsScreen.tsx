import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { useStyles } from '../hooks/useStyles';
import { useAuth } from '../context/AuthContext';
import { fetchBookings, cancelBooking, type Booking } from '../lib/bookings';
import type { ThemeColors } from '../constants/colors';

type BookingTab = 'Upcoming' | 'Completed' | 'Cancelled';

const tabs: BookingTab[] = ['Upcoming', 'Completed', 'Cancelled'];

const emptyStateContent: Record<BookingTab, { icon: string; title: string; description: string }> = {
  Upcoming: {
    icon: 'book-outline',
    title: 'No upcoming bookings',
    description: 'Your upcoming library sessions will appear here.',
  },
  Completed: {
    icon: 'checkmark-done-outline',
    title: 'No completed bookings',
    description: 'Your completed library sessions will appear here.',
  },
  Cancelled: {
    icon: 'close-circle-outline',
    title: 'No cancelled bookings',
    description: 'Your cancelled library sessions will appear here.',
  },
};

function bucketFor(booking: Booking): BookingTab {
  if (booking.status === 'cancelled') {
    return 'Cancelled';
  }
  const today = new Date().toISOString().slice(0, 10);
  if (booking.status === 'completed' || booking.booking_date < today) {
    return 'Completed';
  }
  return 'Upcoming';
}

export default function BookingsScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const { session } = useAuth();

  const [activeTab, setActiveTab] = useState<BookingTab>('Upcoming');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadBookings = useCallback(async () => {
    if (!session) {
      return;
    }
    try {
      const data = await fetchBookings(session.user.id);
      setBookings(data);
    } catch (error: any) {
      console.error('Failed to load bookings:', error.message);
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      loadBookings();
    }, [loadBookings]),
  );

  const handleCancel = (booking: Booking) => {
    Alert.alert('Cancel booking', 'Are you sure you want to cancel this booking?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelBooking(booking.id);
            loadBookings();
          } catch (error: any) {
            Alert.alert('Could not cancel', error.message);
          }
        },
      },
    ]);
  };

  const visibleBookings = bookings.filter(booking => bucketFor(booking) === activeTab);
  const emptyState = emptyStateContent[activeTab];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadBookings} tintColor={colors.primary} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>My Bookings</Text>
          <Text style={styles.subtitle}>Manage your library sessions and bookings.</Text>
        </View>

        <View style={styles.tabRow}>
          {tabs.map(tab => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, isActive && styles.activeTab]}
                activeOpacity={0.7}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={isActive ? styles.activeTabText : styles.tabText}>{tab}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : visibleBookings.length > 0 ? (
          visibleBookings.map(booking => (
            <View key={booking.id} style={styles.bookingCard}>
              <View style={styles.bookingCardHeader}>
                <Text style={styles.bookingLibraryName} numberOfLines={1}>
                  {booking.library_name}
                </Text>
                <Text style={styles.bookingAmount}>₹{booking.total_amount}.00</Text>
              </View>

              <View style={styles.bookingDetailRow}>
                <Icon name="calendar-outline" size={13} color={colors.subText} />
                <Text style={styles.bookingDetailText}>{booking.date_label}</Text>
              </View>
              <View style={styles.bookingDetailRow}>
                <Icon name="time-outline" size={13} color={colors.subText} />
                <Text style={styles.bookingDetailText}>{booking.time_label}</Text>
              </View>
              <View style={styles.bookingDetailRow}>
                <Icon name="body-outline" size={13} color={colors.subText} />
                <Text style={styles.bookingDetailText}>{booking.seat_label}</Text>
              </View>

              <View style={styles.bookingFooterRow}>
                <Text style={styles.bookingCode}>{booking.booking_code}</Text>
                {activeTab === 'Upcoming' && (
                  <TouchableOpacity onPress={() => handleCancel(booking)}>
                    <Text style={styles.cancelLink}>Cancel</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <View style={styles.iconCircle}>
              <Icon name={emptyState.icon} size={30} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>{emptyState.title}</Text>
            <Text style={styles.emptyText}>{emptyState.description}</Text>

            <TouchableOpacity style={styles.exploreButton} activeOpacity={0.8} onPress={() => navigation.navigate('Explore')}>
              <Text style={styles.exploreButtonText}>Explore Libraries</Text>
            </TouchableOpacity>
          </View>
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
    tabRow: { flexDirection: 'row', marginTop: 28, padding: 4, borderRadius: 14, backgroundColor: colors.surfaceAlt },
    tab: { flex: 1, minHeight: 42, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    activeTab: { backgroundColor: colors.surface },
    activeTabText: { fontSize: 13, fontWeight: '700', color: colors.primary },
    tabText: { fontSize: 13, fontWeight: '600', color: colors.subText },
    loader: { marginTop: 40 },
    bookingCard: {
      marginTop: 16,
      padding: 16,
      borderRadius: 18,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    bookingCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    bookingLibraryName: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text, marginRight: 8 },
    bookingAmount: { fontSize: 14, fontWeight: '800', color: colors.primary },
    bookingDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
    bookingDetailText: { fontSize: 13, color: colors.subText },
    bookingFooterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    bookingCode: { fontSize: 11, fontWeight: '700', color: colors.placeholder, letterSpacing: 0.3 },
    cancelLink: { fontSize: 13, fontWeight: '700', color: colors.danger },
    emptyCard: {
      marginTop: 28,
      paddingHorizontal: 24,
      paddingVertical: 40,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    iconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 18 },
    emptyTitle: { fontSize: 20, lineHeight: 26, fontWeight: '700', color: colors.text, textAlign: 'center' },
    emptyText: { marginTop: 8, fontSize: 14, lineHeight: 21, color: colors.subText, textAlign: 'center' },
    exploreButton: { marginTop: 24, minHeight: 48, paddingHorizontal: 20, borderRadius: 12, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
    exploreButtonText: { fontSize: 15, fontWeight: '700', color: colors.onPrimary },
  });
