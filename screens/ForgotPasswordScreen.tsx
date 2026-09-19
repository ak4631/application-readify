import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  SafeAreaView,
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { useStyles } from '../hooks/useStyles';
import { Radius } from '../constants/radius';
import InputField from '../components/InputField';
import type { ThemeColors } from '../constants/colors';
import type { RootStackParamList } from '../navigation/types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'ForgotPassword'>>();
  const { colors } = useTheme();
  const styles = useStyles(createStyles);

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendResetCode = async () => {
    const trimmedEmail = email.trim();

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail);
    setLoading(false);

    if (error) {
      Alert.alert('Could not send code', error.message);
      return;
    }

    navigation.navigate('OtpVerification', { email: trimmedEmail });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Image source={require('../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />

        <Text style={styles.title}>Forgot Password</Text>
        <Text style={styles.subtitle}>
          Enter your email address and we'll send you a verification code.
        </Text>

        <InputField
          icon="mail-outline"
          placeholder="Email Address"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.resetButton, loading && styles.buttonDisabled]}
          onPress={handleSendResetCode}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={styles.resetButtonText}>Send Reset Code</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.backToLogin} onPress={() => navigation.goBack()}>
          Back to Login
        </Text>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
    logo: { width: 90, height: 90, alignSelf: 'center', marginBottom: 32 },
    title: { fontSize: 30, fontWeight: '700', color: colors.text, textAlign: 'center' },
    subtitle: { marginTop: 12, marginBottom: 40, fontSize: 16, color: colors.subText, textAlign: 'center' },
    resetButton: {
      width: '100%',
      height: 56,
      backgroundColor: colors.secondary,
      borderRadius: Radius.md,
      justifyContent: 'center',
      alignItems: 'center',
    },
    buttonDisabled: { opacity: 0.6 },
    resetButtonText: { color: colors.onPrimary, fontSize: 17, fontWeight: '700' },
    backToLogin: { textAlign: 'center', marginTop: 28, fontSize: 15, color: colors.secondary },
  });
