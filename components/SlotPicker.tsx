import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useStyles } from '../hooks/useStyles';
import { formatTime12, type SlotOption } from '../lib/libraryAvailability';
import type { ThemeColors } from '../constants/colors';

type Props = {
  options: SlotOption[];
  totalSeats: number;
  loading?: boolean;
  selectedStart: string | null;
  onSelect: (startTime: string) => void;
  // What the seat count refers to, e.g. "for your 1 month plan".
  countSuffix?: string;
};

// Availability as counts only -- seats are assigned by the server at booking time.
export default function SlotPicker({ options, totalSeats, loading, selectedStart, onSelect, countSuffix }: Props) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);

  if (loading) {
    return <ActivityIndicator color={colors.primary} style={styles.loader} />;
  }

  if (options.length === 0) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyText}>
          No seats are available for this {countSuffix ? 'plan' : 'date'}. Try another date or plan.
        </Text>
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.headline}>
        Choose a time · {totalSeats} seats in this library
      </Text>
      {options.map(option => {
        const isSelected = selectedStart === option.start_time;
        const isLow = option.seats_available <= 5;
        return (
          <TouchableOpacity
            key={option.start_time}
            style={[styles.optionCard, isSelected && styles.optionCardSelected]}
            activeOpacity={0.8}
            onPress={() => onSelect(option.start_time)}
          >
            <Text style={[styles.optionTime, isSelected && styles.optionTimeSelected]}>
              {formatTime12(option.start_time)} - {formatTime12(option.end_time)}
            </Text>
            <Text style={[styles.optionSeats, isLow && styles.optionSeatsLow]}>
              {option.seats_available} seat{option.seats_available === 1 ? '' : 's'} available
              {countSuffix ? ` ${countSuffix}` : ''}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    loader: { marginVertical: 16 },
    headline: { marginBottom: 10, fontSize: 12, color: colors.subText },
    optionCard: {
      marginBottom: 10,
      padding: 14,
      borderRadius: 13,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    optionCardSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
    optionTime: { fontSize: 14, fontWeight: '700', color: colors.text },
    optionTimeSelected: { color: colors.primary },
    optionSeats: { marginTop: 4, fontSize: 12, fontWeight: '600', color: colors.success },
    optionSeatsLow: { color: colors.warning },
    emptyCard: {
      padding: 16,
      borderRadius: 13,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    emptyText: { fontSize: 12, lineHeight: 18, color: colors.subText },
  });
