import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { useStyles } from '../hooks/useStyles';
import type { ThemeColors } from '../constants/colors';

type Props = {
  title: string;
  // Rendered where the back button's spacer normally sits, e.g. an action icon.
  right?: React.ReactNode;
  onBack?: () => void;
};

// The header row (back button + title) used across the app's pushed screens
// -- matches BookingScreen/PaymentScreen's existing style so it's consistent
// wherever it's added.
export default function ScreenHeader({ title, right, onBack }: Props) {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const styles = useStyles(createStyles);

  return (
    <View style={styles.header}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Go back"
        style={styles.backButton}
        activeOpacity={0.7}
        onPress={onBack ?? (() => navigation.goBack())}
      >
        <Icon name="chevron-back" size={20} color={colors.text} />
      </TouchableOpacity>
      <Text style={styles.headerTitle} numberOfLines={1}>
        {title}
      </Text>
      {right ?? <View style={styles.headerSpacer} />}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    header: {
      minHeight: 64,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
    },
    backButton: {
      width: 48,
      height: 48,
      borderRadius: 17,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      flex: 1,
      marginHorizontal: 12,
      fontSize: 17,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
    },
    headerSpacer: { width: 48 },
  });
