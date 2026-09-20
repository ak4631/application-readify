import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
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
import { fetchSubscriptions, type Subscription } from '../lib/subscriptions';
import type { ThemeColors } from '../constants/colors';

const STATUS_LABEL: Record<Subscription['status'], string> = {
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

export default function MySubscriptionsScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const styles = useStyles(createStyles);

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadSubscriptions = useCallback(async () => {
    try {
      const data = await fetchSubscriptions();
      setSubscriptions(data);
    } catch (error: any) {
      console.error('Failed to load subscriptions:', error.message);
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
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadSubscriptions} tintColor={colors.primary} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>My Subscriptions</Text>
          <Text style={styles.subtitle}>Plans you've subscribed to across libraries.</Text>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : subscriptions.length > 0 ? (
          subscriptions.map(subscription => (
            <TouchableOpacity
              key={subscription.id}
              style={styles.card}
              activeOpacity={0.8}
              onPress={() =>
                navigation.navigate('Subscribe', {
                  libraryId: subscription.vendor_id,
                  libraryName: subscription.library_name,
                })
              }
            >
              <View style={styles.cardHeader}>
                <Text style={styles.libraryName} numberOfLines={1}>
                  {subscription.library_name}
                </Text>
                <Text style={[styles.status, { color: statusColor(subscription.status) }]}>
                  {STATUS_LABEL[subscription.status]}
                </Text>
              </View>

              <Text style={styles.planName}>{subscription.plan_name}</Text>

              <View style={styles.detailRow}>
                <Icon name="calendar-outline" size={13} color={colors.subText} />
                <Text style={styles.detailText}>
                  {formatDate(subscription.start_date)} – {formatDate(subscription.end_date)}
                </Text>
              </View>

              <View style={styles.footerRow}>
                <Text style={styles.amount}>₹{subscription.total_amount}</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <View style={styles.iconCircle}>
              <Icon name="ribbon-outline" size={30} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No subscriptions yet</Text>
            <Text style={styles.emptyText}>
              Explore libraries to subscribe to a plan.
            </Text>

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
    loader: { marginTop: 40 },
    card: {
      marginTop: 16,
      padding: 16,
      borderRadius: 18,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    libraryName: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text, marginRight: 8 },
    status: { fontSize: 12, fontWeight: '700' },
    planName: { marginTop: 4, fontSize: 14, fontWeight: '600', color: colors.primary },
    detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
    detailText: { fontSize: 13, color: colors.subText },
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
    iconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 18 },
    emptyTitle: { fontSize: 20, lineHeight: 26, fontWeight: '700', color: colors.text, textAlign: 'center' },
    emptyText: { marginTop: 8, fontSize: 14, lineHeight: 21, color: colors.subText, textAlign: 'center' },
    exploreButton: { marginTop: 24, minHeight: 48, paddingHorizontal: 20, borderRadius: 12, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
    exploreButtonText: { fontSize: 15, fontWeight: '700', color: colors.onPrimary },
  });
