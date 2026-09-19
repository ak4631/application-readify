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
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { useStyles } from '../hooks/useStyles';
import { useAuth } from '../context/AuthContext';
import { fetchActiveMembership, choosePlan, type Membership } from '../lib/memberships';
import type { ThemeColors } from '../constants/colors';

export default function MembershipScreen() {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const { session } = useAuth();

  const [membership, setMembership] = useState<Membership | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [choosingPlan, setChoosingPlan] = useState<'daily' | 'monthly' | null>(null);

  const loadMembership = useCallback(async () => {
    if (!session) {
      return;
    }
    try {
      const data = await fetchActiveMembership(session.user.id);
      setMembership(data);
    } catch (error: any) {
      console.error('Failed to load membership:', error.message);
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      loadMembership();
    }, [loadMembership]),
  );

  const handleChoosePlan = async (plan: 'daily' | 'monthly') => {
    if (!session) {
      return;
    }
    setChoosingPlan(plan);
    try {
      await choosePlan(session.user.id, plan);
      await loadMembership();
      Alert.alert('Membership activated', `Your ${plan} plan is now active.`);
    } catch (error: any) {
      Alert.alert('Could not activate plan', error.message);
    } finally {
      setChoosingPlan(null);
    }
  };

  const isActivePlan = (plan: 'daily' | 'monthly') =>
    membership?.status === 'active' && membership.plan === plan;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Membership</Text>
          <Text style={styles.subtitle}>Choose a plan that fits your reading and study routine.</Text>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : (
          <>
            {membership?.status === 'active' ? (
              <View style={styles.activeBanner}>
                <Icon name="checkmark-circle" size={20} color={colors.success} />
                <Text style={styles.activeBannerText}>
                  Your {membership.plan} plan is active until{' '}
                  {new Date(membership.expires_at).toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                  .
                </Text>
              </View>
            ) : (
              <View style={styles.featureCard}>
                <Text style={styles.featureTitle}>Readify India Membership</Text>
                <Text style={styles.featureText}>
                  Get flexible access to libraries and study spaces with membership benefits
                  designed for regular readers.
                </Text>
              </View>
            )}

            <Text style={styles.sectionTitle}>Choose Your Plan</Text>

            <View style={styles.planCard}>
              <Text style={styles.planName}>Daily</Text>
              <View style={styles.priceRow}>
                <Text style={styles.price}>₹49</Text>
                <Text style={styles.duration}>/day</Text>
              </View>
              <Text style={styles.planDescription}>Perfect for occasional study sessions.</Text>

              <View style={styles.benefitRow}>
                <Icon name="checkmark-circle" size={18} color={colors.primary} style={styles.check} />
                <Text style={styles.benefitText}>Library access</Text>
              </View>
              <View style={styles.benefitRow}>
                <Icon name="checkmark-circle" size={18} color={colors.primary} style={styles.check} />
                <Text style={styles.benefitText}>Flexible booking</Text>
              </View>

              <TouchableOpacity
                style={[styles.selectButton, isActivePlan('daily') && styles.selectButtonDisabled]}
                activeOpacity={0.8}
                onPress={() => handleChoosePlan('daily')}
                disabled={isActivePlan('daily') || choosingPlan !== null}
              >
                {choosingPlan === 'daily' ? (
                  <ActivityIndicator color={colors.onPrimary} />
                ) : (
                  <Text style={styles.selectButtonText}>
                    {isActivePlan('daily') ? 'Current Plan' : 'Choose Daily'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.planCard}>
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>POPULAR</Text>
              </View>

              <Text style={styles.planName}>Monthly</Text>
              <View style={styles.priceRow}>
                <Text style={styles.price}>₹999</Text>
                <Text style={styles.duration}>/month</Text>
              </View>
              <Text style={styles.planDescription}>Best for regular students and professionals.</Text>

              <View style={styles.benefitRow}>
                <Icon name="checkmark-circle" size={18} color={colors.primary} style={styles.check} />
                <Text style={styles.benefitText}>Library access</Text>
              </View>
              <View style={styles.benefitRow}>
                <Icon name="checkmark-circle" size={18} color={colors.primary} style={styles.check} />
                <Text style={styles.benefitText}>Priority booking</Text>
              </View>
              <View style={styles.benefitRow}>
                <Icon name="checkmark-circle" size={18} color={colors.primary} style={styles.check} />
                <Text style={styles.benefitText}>Membership benefits</Text>
              </View>

              <TouchableOpacity
                style={[styles.selectButton, isActivePlan('monthly') && styles.selectButtonDisabled]}
                activeOpacity={0.8}
                onPress={() => handleChoosePlan('monthly')}
                disabled={isActivePlan('monthly') || choosingPlan !== null}
              >
                {choosingPlan === 'monthly' ? (
                  <ActivityIndicator color={colors.onPrimary} />
                ) : (
                  <Text style={styles.selectButtonText}>
                    {isActivePlan('monthly') ? 'Current Plan' : 'Choose Monthly'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
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
    sectionTitle: { marginTop: 28, marginBottom: 14, fontSize: 20, fontWeight: '700', color: colors.text },
    planCard: { position: 'relative', marginBottom: 16, padding: 20, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    popularBadge: { position: 'absolute', top: 16, right: 16, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8, backgroundColor: colors.primary },
    popularText: { fontSize: 9, fontWeight: '700', color: colors.onPrimary },
    planName: { fontSize: 20, fontWeight: '700', color: colors.text },
    priceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 10 },
    price: { fontSize: 28, fontWeight: '700', color: colors.primary },
    duration: { marginLeft: 4, fontSize: 14, color: colors.subText },
    planDescription: { marginTop: 8, marginBottom: 18, fontSize: 14, lineHeight: 21, color: colors.subText },
    benefitRow: { flexDirection: 'row', alignItems: 'center', marginTop: 9 },
    check: { marginRight: 9 },
    benefitText: { fontSize: 14, color: colors.text },
    selectButton: { height: 48, marginTop: 20, borderRadius: 12, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
    selectButtonDisabled: { backgroundColor: colors.subText },
    selectButtonText: { fontSize: 15, fontWeight: '700', color: colors.onPrimary },
  });
