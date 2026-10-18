import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useStyles } from '../hooks/useStyles';
import type { ThemeColors } from '../constants/colors';

export default function WelcomeScreen({
  onContinue,
}: {
  onContinue: () => void;
}) {
  const navigation = useNavigation<any>();
  const styles = useStyles(createStyles);

  const handleContinue = () => {
    onContinue();
    navigation.replace('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.brandMark}>V</Text>

        <Text style={styles.title}>Welcome to Vriddhora</Text>

        <Text style={styles.subtitle}>
          Discover libraries, reserve a seat and{'\n'}build your reading
          journey.
        </Text>

        <TouchableOpacity
          style={styles.continueButton}
          activeOpacity={0.85}
          onPress={handleContinue}
        >
          <Text style={styles.continueButtonText}>Continue to Vriddhora</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>Your reading journey starts here.</Text>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    brandMark: {
      fontSize: 100,
      fontWeight: '800',
      color: colors.primary,
      marginBottom: 24,
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    logo: {
      width: 120,
      height: 120,
      marginBottom: 32,
    },
    title: {
      fontSize: 30,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
    },
    subtitle: {
      marginTop: 16,
      fontSize: 17,
      lineHeight: 28,
      color: colors.subText,
      textAlign: 'center',
    },
    continueButton: {
      width: '100%',
      backgroundColor: colors.secondary,
      borderRadius: 14,
      paddingVertical: 16,
      marginTop: 40,
      alignItems: 'center',
    },
    continueButtonText: {
      color: colors.onPrimary,
      fontSize: 17,
      fontWeight: '700',
    },
    footerText: {
      marginTop: 28,
      fontSize: 13,
      color: colors.placeholder,
      textAlign: 'center',
    },
  });
