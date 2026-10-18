import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function BrandMark({ style }: { style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.mark, style]} accessibilityLabel="Vriddhora">
      <Text style={[styles.letter, { color: colors.primary }]}>V</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  mark: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: { fontSize: 72, fontWeight: '800' },
});
