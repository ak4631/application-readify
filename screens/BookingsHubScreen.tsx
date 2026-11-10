import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import BrandHero from '../components/BrandHero';
import BookingsScreen from './BookingsScreen';
import MySubscriptionsScreen from './MySubscriptionsScreen';

export default function BookingsHubScreen({
  subscriptions = false,
}: {
  subscriptions?: boolean;
}) {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const section = route.params?.section;
  const [selected, setSelected] = useState(subscriptions ? 1 : 0);
  const { colors } = useTheme();
  useEffect(() => {
    if (section) setSelected(section === 'subscriptions' ? 1 : 0);
  }, [section]);
  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.heroWrap}>
        <BrandHero
          compact
          eyebrow="YOUR PLANS, BEAUTIFULLY ORGANIZED"
          title="My bookings"
          subtitle="Good spaces. Great routines. Your passes, all here."
          icon="ticket-outline"
        />
      </View>
      <View style={[styles.tabs, { backgroundColor: colors.surfaceAlt }]}>
        {['Day passes', 'Subscriptions'].map((label, index) => (
          <TouchableOpacity
            key={label}
            accessibilityRole="tab"
            accessibilityState={{ selected: selected === index }}
            onPress={() => {
              setSelected(index);
              navigation.setParams({
                section: index === 1 ? 'subscriptions' : 'passes',
              });
            }}
            style={[
              styles.tab,
              selected === index && { backgroundColor: colors.primary },
            ]}
          >
            <Text
              style={{
                color: selected === index ? colors.onPrimary : colors.text,
                ...styles.tabText,
              }}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {selected === 0 ? (
        <BookingsScreen embedded />
      ) : (
        <MySubscriptionsScreen embedded />
      )}
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1 },
  heroWrap: { marginHorizontal: 20, marginTop: 12 },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginHorizontal: 20,
    marginTop: 20,
  },
  subtitle: {
    fontSize: 14,
    marginHorizontal: 20,
    marginTop: 8,
    lineHeight: 20,
  },
  tabs: { flexDirection: 'row', margin: 20, padding: 4, borderRadius: 20 },
  tabText: { fontWeight: '600' },
  tab: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
});
