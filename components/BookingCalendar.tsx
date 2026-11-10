import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { dateAtDay } from '../lib/bookingDates';

export default function BookingCalendar({
  start,
  end,
  days,
}: {
  start: string;
  end: string;
  days: number;
}) {
  const { colors } = useTheme();
  const [month, setMonth] = useState(start.slice(0, 7));
  const first = `${month}-01`;
  const date = new Date(`${first}T12:00:00Z`);
  const offset = (date.getUTCDay() + 6) % 7;
  const daysInMonth = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
  ).getUTCDate();
  const label = (value: string) =>
    new Date(`${value}T12:00:00Z`).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    });
  function move(direction: number) {
    const next = new Date(`${first}T12:00:00Z`);
    next.setUTCMonth(next.getUTCMonth() + direction);
    setMonth(next.toISOString().slice(0, 7));
  }
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.title, { color: colors.text }]}>
        Your booking dates
      </Text>
      <Text style={[styles.range, { color: colors.primary }]}>
        {label(start)} – {label(end)}
      </Text>
      <Text style={[styles.caption, { color: colors.subText }]}>
        {days} {days === 1 ? 'day' : 'consecutive days'} · Highlighted below
      </Text>
      <View style={styles.monthRow}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Previous booking month"
          disabled={month <= start.slice(0, 7)}
          style={styles.arrow}
          onPress={() => move(-1)}
        >
          <Icon
            name="chevron-back"
            size={20}
            color={
              month <= start.slice(0, 7) ? colors.placeholder : colors.primary
            }
          />
        </TouchableOpacity>
        <Text style={[styles.monthTitle, { color: colors.text }]}>
          {date.toLocaleDateString('en-IN', {
            month: 'long',
            year: 'numeric',
            timeZone: 'UTC',
          })}
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Next booking month"
          disabled={month >= end.slice(0, 7)}
          style={styles.arrow}
          onPress={() => move(1)}
        >
          <Icon
            name="chevron-forward"
            size={20}
            color={
              month >= end.slice(0, 7) ? colors.placeholder : colors.primary
            }
          />
        </TouchableOpacity>
      </View>
      <View style={styles.grid}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
          <View key={index} style={styles.cell}>
            <Text style={[styles.weekday, { color: colors.subText }]}>
              {day}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.grid}>
        {Array.from(
          { length: Math.ceil((offset + daysInMonth) / 7) * 7 },
          (_, index) => {
            const day = index - offset + 1;
            const value =
              day > 0 && day <= daysInMonth ? dateAtDay(first, day - 1) : null;
            const booked = !!value && value >= start && value <= end;
            return (
              <View key={index} style={styles.cell}>
                {value && (
                  <View
                    accessibilityLabel={`${label(value)}${
                      booked ? ', booked' : ''
                    }`}
                    style={[
                      styles.day,
                      booked && { backgroundColor: colors.primary },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        { color: booked ? colors.onPrimary : colors.subText },
                      ]}
                    >
                      {day}
                    </Text>
                  </View>
                )}
              </View>
            );
          },
        )}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  card: { marginTop: 16, padding: 12, borderRadius: 20, borderWidth: 1 },
  title: { fontSize: 15, fontWeight: '700' },
  range: { fontSize: 13, fontWeight: '600', marginTop: 8 },
  caption: { fontSize: 11, marginTop: 6 },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  monthTitle: { fontSize: 14, fontWeight: '700' },
  arrow: {
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: '14.285714%',
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekday: { fontSize: 11, fontWeight: '600' },
  day: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: { fontSize: 12, fontWeight: '600' },
});
