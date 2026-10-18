import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import ScreenHeader from '../components/ScreenHeader';
import { useTheme } from '../context/ThemeContext';
import { useStyles } from '../hooks/useStyles';
import type { ThemeColors } from '../constants/colors';
import { fetchPlans, type Plan } from '../lib/plans';

export default function ExtensionScreen() {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { targetId, vendorId, libraryName } = route.params;
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [hours, setHours] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    fetchPlans(vendorId)
      .then(data => {
        if (active) {
          const rates = data.filter(item => item.is_flexible);
          setPlans(rates);
          setPlan(rates[0] ?? null);
        }
      })
      .catch(() => {
        if (active)
          setError('Could not load hourly rates. Please reopen this screen.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [vendorId]);
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="Extend your stay" />
        <Text style={styles.title}>{libraryName}</Text>
        <Text style={{ color: colors.subText }}>
          Extra hours start immediately after your current reserved window on
          the same seat, for today only. Checkout rechecks availability; an
          extension cannot displace another booking.
        </Text>
        {loading && <ActivityIndicator color={colors.primary} />}
        <Text style={{ color: colors.danger }}>{error}</Text>
        {plans.map(item => (
          <TouchableOpacity
            key={item.id}
            onPress={() => setPlan(item)}
            style={[styles.rate, plan?.id === item.id && styles.selected]}
          >
            <Text style={{ color: colors.text }}>
              {item.name}: ₹{item.price}/hour
            </Text>
          </TouchableOpacity>
        ))}
        {!loading && !plans.length && (
          <Text style={{ color: colors.subText }}>
            No hourly extension rates are available.
          </Text>
        )}
        <Text style={{ color: colors.text }}>Extra hours: {hours}</Text>
        <TouchableOpacity
          disabled={hours <= 1}
          onPress={() => setHours(value => Math.max(1, value - 1))}
        >
          <Text style={{ color: colors.primary }}>− Remove one hour</Text>
        </TouchableOpacity>
        <TouchableOpacity
          disabled={hours >= 24}
          onPress={() => setHours(value => Math.min(24, value + 1))}
        >
          <Text style={{ color: colors.primary }}>+ Add one hour</Text>
        </TouchableOpacity>
        {plan && (
          <Text style={{ color: colors.text }}>
            ₹{(plan.price * hours + 6).toFixed(2)}, including the ₹6 customer
            fee.
          </Text>
        )}
        <TouchableOpacity
          disabled={!plan}
          onPress={() =>
            navigation.navigate('Payment', {
              kind: 'extension',
              targetId,
              hours,
              planId: plan!.id,
              planName: `${hours} extra hours`,
              libraryId: vendorId,
              libraryName,
              selectedTimeLabel: `${hours} extra hours after the current window`,
            })
          }
          style={[styles.button, !plan && styles.disabled]}
        >
          <Text style={styles.buttonText}>Check availability and pay</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, gap: 20 },
    title: { color: colors.text, fontSize: 20, fontWeight: '700' },
    rate: {
      padding: 14,
      borderWidth: 1,
      borderRadius: 10,
      borderColor: colors.border,
    },
    selected: { borderColor: colors.primary },
    button: { backgroundColor: colors.primary, padding: 16, borderRadius: 10 },
    disabled: { opacity: 0.5 },
    buttonText: { color: colors.onPrimary, textAlign: 'center' },
  });
