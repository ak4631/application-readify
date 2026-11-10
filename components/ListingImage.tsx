import React from 'react';
import {
  Image,
  View,
  StyleSheet,
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { CATEGORIES } from '../constants/categories';
import { useTheme } from '../context/ThemeContext';

export default function ListingImage({
  uri,
  category,
  style,
}: {
  uri?: string | null;
  category?: string;
  style: StyleProp<ImageStyle>;
}) {
  const { colors } = useTheme();
  if (uri) return <Image source={{ uri }} style={style} resizeMode="cover" />;
  return (
    <View
      style={[
        style as StyleProp<ViewStyle>,
        styles.placeholder,
        { backgroundColor: colors.primaryLight },
      ]}
    >
      <View style={[styles.orbit, { borderColor: colors.primary }]} />
      <View style={[styles.orbitTwo, { borderColor: colors.primary }]} />
      <View style={[styles.iconTile, { backgroundColor: colors.surface }]}>
        <Icon
          name={
            CATEGORIES.find(item => item.id === category)?.icon ??
            'business-outline'
          }
          size={40}
          color={colors.primary}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  orbit: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 1,
    opacity: 0.12,
    right: -60,
    top: -110,
  },
  orbitTwo: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 24,
    opacity: 0.04,
    left: -50,
    bottom: -110,
  },
  iconTile: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
  },
});
