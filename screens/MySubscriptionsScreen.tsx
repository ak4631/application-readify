import { useAppAlert } from '../context/DialogContext';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { useStyles } from '../hooks/useStyles';
import {
  fetchSubscriptions,
  cancelSubscription,
  type Subscription,
} from '../lib/subscriptions';
import type { ThemeColors } from '../constants/colors';

const STATUS_LABEL: Record<Subscription['status'], string> = {
  pending: 'Awaiting payment',
  active: 'Active',
  expired: 'Expired',
  cancelled: 'Cancelled',
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function MySubscriptionsScreen({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const Alert = useAppAlert();

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setError] = useState('');

  const loadSubscriptions = useCallback(async () => {
    setError('');
    try {
      const data = await fetchSubscriptions();
      setSubscriptions(data);
    } catch {
      setError('Could not load your subscriptions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSubscriptions();
    }, [loadSubscriptions]),
  );

  const statusColor = (status: Subscription['status']) => {
    if (status === 'active') return colors.success;
    if (status === 'cancelled') return colors.danger;
    return colors.subText;
  };

  return (
    <SafeAreaView edges={embedded ? [] : ['top']} style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadSubscriptions}
            tintColor={colors.primary}
          />
        }
      >
        {!embedded && (
          <View style={styles.header}>
            <Text style={styles.title}>My Subscriptions</Text>
            <Text style={styles.subtitle}>
              Plans you've subscribed to across spaces.
            </Text>
          </View>
        )}

        {!!loadError && (
          <View accessibilityRole="alert" style={styles.errorCard}>
            <Text style={{ color: colors.danger }}>{loadError}</Text>
            <TouchableOpacity
              onPress={loadSubscriptions}
              style={styles.retryAction}
            >
              <Text style={{ color: colors.primary }}>Try again</Text>
            </TouchableOpacity>
          </View>
        )}
        {isLoading ? (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={styles.loader}
          />
        ) : loadError ? null : subscriptions.length > 0 ? (
          subscriptions.map(subscription => (
            <View key={subscription.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.libraryName} numberOfLines={1}>
                  {subscription.library_name}
                </Text>
                <Text
                  style={[
                    styles.status,
                    { color: statusColor(subscription.status) },
                  ]}
                >
                  {STATUS_LABEL[subscription.status]}
                </Text>
              </View>

              <Text style={styles.planName}>{subscription.plan_name}</Text>
              {['pending', 'active'].includes(subscription.status) && (
                <TouchableOpacity
                  onPress={event => {
                    event.stopPropagation();
                    Alert.alert(
                      'Cancel subscription',
                      'Full refund before the reserved start; no refund afterward.',
                      [
                        { text: 'Keep subscription', style: 'cancel' },
                        {
                          text: 'Cancel subscription',
                          style: 'destructive',
                          onPress: async () => {
                            try {
                              await cancelSubscription(subscription.id);
                              await loadSubscriptions();
                            } catch (error: any) {
                              Alert.alert('Could not cancel', error.message);
                            }
                          },
                        },
                      ],
                    );
                  }}
                >
                  <Text style={styles.cancelAction}>Cancel subscription</Text>
                </TouchableOpacity>
              )}
              {subscription.status === 'active' && (
                <View style={styles.qrWrap}>
                  <QRCode
                    value={`subscription:${subscription.id}`}
                    size={100}
                  />
                </View>
              )}
              {subscription.status === 'active' && (
                <TouchableOpacity
                  onPress={event => {
                    event.stopPropagation();
                    navigation.navigate('Extension', {
                      targetId: subscription.id,
                      vendorId: subscription.vendor_id,
                      libraryName: subscription.library_name,
                    });
                  }}
                >
                  <Text style={{ color: colors.primary }}>
                    Extend today's stay
                  </Text>
                </TouchableOpacity>
              )}

              <View style={styles.detailRow}>
                <Icon
                  name="calendar-outline"
                  size={13}
                  color={colors.subText}
                />
                <Text style={styles.detailText}>
                  {formatDate(subscription.start_date)} –{' '}
                  {formatDate(subscription.end_date)}
                </Text>
              </View>

              {subscription.slot_start ? (
                <View style={styles.detailRow}>
                  <Icon name="body-outline" size={13} color={colors.subText} />
                  <Text style={styles.detailText}>
                    Daily from {subscription.slot_start}
                    {subscription.slot_hours
                      ? ` for ${subscription.slot_hours}h`
                      : ''}
                  </Text>
                </View>
              ) : null}
              {subscription.seat_number ? (
                <View style={styles.detailRow}>
                  <Icon name="pin-outline" size={13} color={colors.primary} />
                  <Text style={[styles.detailText, styles.seatText]}>
                    Seat {subscription.seat_number}
                  </Text>
                </View>
              ) : null}

              <View style={styles.footerRow}>
                <Text style={styles.amount}>₹{subscription.total_amount}</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <View style={styles.iconCircle}>
              <Icon name="ribbon-outline" size={30} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No subscriptions yet</Text>
            <Text style={styles.emptyText}>Explore spaces to find a plan.</Text>

            <TouchableOpacity
              style={styles.exploreButton}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.exploreButtonText}>Explore Spaces</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    errorCard: { padding: 16, gap: 12 },
    retryAction: { minHeight: 48, justifyContent: 'center' },
    qrWrap: {
      marginTop: 12,
      padding: 12,
      backgroundColor: '#fff',
      alignSelf: 'flex-start',
    },
    cancelAction: { color: colors.danger, marginVertical: 8 },
    container: { flex: 1, backgroundColor: colors.background },
    content: { flex: 1 },
    contentContainer: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 32,
    },
    header: { marginTop: 8 },
    title: {
      fontSize: 30,
      lineHeight: 36,
      fontWeight: '700',
      color: colors.text,
    },
    subtitle: {
      marginTop: 8,
      fontSize: 16,
      lineHeight: 24,
      color: colors.subText,
    },
    loader: { marginTop: 40 },
    card: {
      marginTop: 16,
      padding: 16,
      borderRadius: 18,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    libraryName: {
      flex: 1,
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginRight: 8,
    },
    status: { fontSize: 12, fontWeight: '700' },
    planName: {
      marginTop: 4,
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 10,
    },
    detailText: { fontSize: 13, color: colors.subText },
    seatText: { fontWeight: '700', color: colors.text },
    footerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    amount: { fontSize: 14, fontWeight: '800', color: colors.text },
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
    iconCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 18,
    },
    emptyTitle: {
      fontSize: 20,
      lineHeight: 26,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
    },
    emptyText: {
      marginTop: 8,
      fontSize: 14,
      lineHeight: 21,
      color: colors.subText,
      textAlign: 'center',
    },
    exploreButton: {
      marginTop: 24,
      minHeight: 48,
      paddingHorizontal: 20,
      borderRadius: 12,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    exploreButtonText: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.onPrimary,
    },
  });
