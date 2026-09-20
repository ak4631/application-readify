import React, { useCallback, useState } from 'react';
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
import { useFocusEffect, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { useStyles } from '../hooks/useStyles';
import { fetchPlans, formatPlanDuration, type Plan } from '../lib/plans';
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
const SUBSCRIBABLE_UNITS: Plan['duration_unit'][] = ['DAYS', 'MONTHS', 'YEARS'];

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

  const loadData = useCallback(async () => {
    try {
      const [plansData, subscription] = await Promise.all([
        fetchPlans(libraryId),
        fetchActiveSubscription(libraryId),
      ]);
      setPlans(plansData.filter(plan => SUBSCRIBABLE_UNITS.includes(plan.duration_unit)));
      setActiveSubscription(subscription);
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

  const handleSubscribe = async (plan: Plan) => {
    setSubscribingPlanId(plan.id);
    try {
      await createSubscription(libraryId, plan.id);
      await loadData();
      Alert.alert('Subscribed', `Your ${plan.name} plan is now active.`);
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

              return (
                <View key={plan.id} style={styles.planCard}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.price}>₹{plan.price}</Text>
                    <Text style={styles.duration}>/{formatPlanDuration(plan)}</Text>
                  </View>
                  {plan.description && (
                    <Text style={styles.planDescription}>{plan.description}</Text>
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
    planDescription: { marginTop: 8, marginBottom: 4, fontSize: 14, lineHeight: 21, color: colors.subText },
    selectButton: { height: 48, marginTop: 20, borderRadius: 12, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
    selectButtonDisabled: { backgroundColor: colors.subText },
    selectButtonText: { fontSize: 15, fontWeight: '700', color: colors.onPrimary, textAlign: 'center' },
  });
