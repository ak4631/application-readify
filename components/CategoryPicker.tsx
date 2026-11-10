import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { CATEGORIES, type LibraryCategory } from '../constants/categories';
import { useTheme } from '../context/ThemeContext';

export type CategorySelection = LibraryCategory | 'all';

export default function CategoryPicker({
  selected,
  onSelect,
  enabled,
  loading,
}: {
  selected: CategorySelection;
  onSelect: (category: CategorySelection) => void;
  enabled: (id: string) => boolean;
  loading: boolean;
}) {
  const { colors } = useTheme();
  const items = [
    { id: 'all' as const, name: 'All spaces', icon: 'grid-outline' },
    ...CATEGORIES,
  ];
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {items.map(item => {
        const active = item.id === selected;
        const comingSoon = item.id !== 'all' && !loading && !enabled(item.id);
        return (
          <TouchableOpacity
            key={item.id}
            accessibilityRole="tab"
            accessibilityLabel={`${item.name}${
              comingSoon ? ', coming soon' : ''
            }`}
            accessibilityState={{ selected: active }}
            onPress={() => onSelect(item.id)}
            style={[
              styles.card,
              {
                backgroundColor: active ? colors.primaryDark : colors.surface,
                borderColor: active ? colors.primary : colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.iconTile,
                {
                  backgroundColor: active
                    ? colors.primary
                    : colors.primaryLight,
                },
              ]}
            >
              <Icon
                name={item.icon}
                size={25}
                color={active ? colors.onPrimary : colors.primary}
              />
            </View>
            <Text
              style={[
                styles.label,
                { color: active ? colors.onPrimary : colors.text },
              ]}
            >
              {item.name}
            </Text>
            <View style={styles.status}>
              <Text
                style={[
                  styles.caption,
                  { color: active ? colors.onPrimary : colors.subText },
                ]}
              >
                {loading
                  ? 'Checking availability'
                  : comingSoon
                  ? 'Coming soon'
                  : 'Explore'}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  row: { gap: 10, paddingTop: 18, paddingBottom: 6 },
  iconTile: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    minWidth: 116,
    minHeight: 136,
    padding: 14,
    borderWidth: 1,
    borderRadius: 22,
    gap: 8,
  },
  label: { fontSize: 14, fontWeight: '700' },
  status: { minHeight: 16 },
  caption: { fontSize: 11 },
});
