import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { useStyles } from '../hooks/useStyles';
import type { ThemeColors } from '../constants/colors';

export const MIN_FLEX_DAYS = 1;
export const MAX_FLEX_DAYS = 14;

type Props = {
  days: number;
  onChange: (days: number) => void;
  // Live total for the current day count -- computed by the caller as
  // ratePerHour * hoursPerDay * days, purely client-side (no round trip).
  totalPrice: number;
  pricePerDay: number;
};

// +/- day-count control for a flexible plan, with the live total that
// updates instantly as the customer taps (no server round trip needed for
// the price itself -- only availability re-checks as `days` changes).
export default function DayStepper({ days, onChange, totalPrice, pricePerDay }: Props) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Number of days</Text>
      <View style={styles.stepperRow}>
        <TouchableOpacity
          style={[styles.stepButton, days <= MIN_FLEX_DAYS && styles.stepButtonDisabled]}
          activeOpacity={0.7}
          disabled={days <= MIN_FLEX_DAYS}
          onPress={() => onChange(Math.max(MIN_FLEX_DAYS, days - 1))}
        >
          <Icon name="remove" size={18} color={days <= MIN_FLEX_DAYS ? colors.subText : colors.primary} />
        </TouchableOpacity>
        <View style={styles.daysBox}>
          <Text style={styles.daysValue}>{days}</Text>
          <Text style={styles.daysUnit}>{days === 1 ? 'day' : 'days'}</Text>
        </View>
        <TouchableOpacity
          style={[styles.stepButton, days >= MAX_FLEX_DAYS && styles.stepButtonDisabled]}
          activeOpacity={0.7}
          disabled={days >= MAX_FLEX_DAYS}
          onPress={() => onChange(Math.min(MAX_FLEX_DAYS, days + 1))}
        >
          <Icon name="add" size={18} color={days >= MAX_FLEX_DAYS ? colors.subText : colors.primary} />
        </TouchableOpacity>
      </View>
      <View style={styles.priceRow}>
        <Text style={styles.priceBreakdown}>
          ₹{pricePerDay.toLocaleString('en-IN')}/day × {days}
        </Text>
        <Text style={styles.totalPrice}>₹{totalPrice.toLocaleString('en-IN')}</Text>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      padding: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    label: { fontSize: 12, fontWeight: '600', color: colors.subText },
    stepperRow: {
      marginTop: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 18,
    },
    stepButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.primary,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    stepButtonDisabled: { borderColor: colors.border, backgroundColor: colors.surfaceAlt },
    daysBox: { alignItems: 'center', minWidth: 64 },
    daysValue: { fontSize: 28, fontWeight: '800', color: colors.text },
    daysUnit: { fontSize: 11, color: colors.subText },
    priceRow: {
      marginTop: 14,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    priceBreakdown: { fontSize: 12, color: colors.subText },
    totalPrice: { fontSize: 18, fontWeight: '800', color: colors.primary },
  });
