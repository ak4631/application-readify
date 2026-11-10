import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';

export default function BrandHero({
  eyebrow,
  title,
  subtitle,
  icon = 'sparkles-outline',
  compact = false,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  icon?: string;
  compact?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.hero,
        compact && styles.compact,
        { backgroundColor: colors.primaryDark },
      ]}
    >
      <View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={StyleSheet.absoluteFill}
      >
        <View style={styles.orbit} />
        <View style={styles.orbitSmall} />
        <View style={styles.art}>
          <Icon name={icon} size={68} color={colors.onPrimary} />
        </View>
      </View>
      <View style={styles.eyebrowRow}>
        <View style={[styles.dot, { backgroundColor: colors.onPrimary }]} />
        <Text style={[styles.eyebrow, { color: colors.onPrimary }]}>
          {eyebrow}
        </Text>
      </View>
      <Text
        style={[
          styles.title,
          compact && styles.compactTitle,
          { color: colors.onPrimary },
        ]}
      >
        {title}
      </Text>
      <Text style={[styles.subtitle, { color: colors.onPrimary }]}>
        {subtitle}
      </Text>
    </View>
  );
}
const styles = StyleSheet.create({
  hero: {
    minHeight: 192,
    borderRadius: 28,
    padding: 24,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  compact: { minHeight: 148, padding: 22 },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  dot: { width: 6, height: 6, borderRadius: 3, opacity: 0.8 },
  eyebrow: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.6,
    flexShrink: 1,
    opacity: 0.88,
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    maxWidth: '90%',
    letterSpacing: -0.7,
  },
  compactTitle: { fontSize: 28, lineHeight: 34 },
  subtitle: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 10,
    maxWidth: '85%',
    opacity: 0.85,
  },
  orbit: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    right: -100,
    top: -90,
  },
  orbitSmall: {
    position: 'absolute',
    width: 168,
    height: 168,
    borderRadius: 84,
    borderWidth: 28,
    borderColor: 'rgba(255,255,255,0.05)',
    right: -60,
    bottom: -90,
  },
  art: {
    position: 'absolute',
    right: 8,
    bottom: 24,
    opacity: 0.1,
    transform: [{ rotate: '-15deg' }],
  },
});
