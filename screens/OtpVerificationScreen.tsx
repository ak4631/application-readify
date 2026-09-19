import React, { useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
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

export default function OtpVerificationScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'OtpVerification'>>();
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const route = useRoute<any>();
  const { email } = route.params;

  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async () => {
    if (otp.trim().length !== 6) {
      Alert.alert('Invalid code', 'Please enter the 6-digit code sent to your email.');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Weak password', 'New password must contain at least 8 characters.');
      return;
    }

    setLoading(true);
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otp.trim(),
      type: 'recovery',
    });

    if (verifyError) {
      setLoading(false);
      Alert.alert('Verification failed', verifyError.message);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);

    if (updateError) {
      Alert.alert('Could not update password', updateError.message);
      return;
    }

    Alert.alert('Password updated', 'You are now logged in with your new password.');
  };

  const handleResend = async () => {
    setResending(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setResending(false);

    if (error) {
      Alert.alert('Could not resend code', error.message);
    } else {
      Alert.alert('Code sent', 'A new verification code has been sent to your email.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Image source={require('../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />

        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code sent to {email}, then choose a new password.
        </Text>

        <InputField
          icon="keypad-outline"
          placeholder="Enter OTP"
          keyboardType="number-pad"
          maxLength={6}
          value={otp}
          onChangeText={setOtp}
          editable={!loading}
        />

        <InputField
          icon="lock-closed-outline"
          placeholder="New Password"
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.verifyButton, loading && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={styles.verifyButtonText}>Verify & Reset Password</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.resendText} onPress={resending ? undefined : handleResend}>
          {resending ? 'Sending…' : "Didn't receive the code? Resend OTP"}
        </Text>

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
    verifyButton: {
      width: '100%',
      height: 56,
      backgroundColor: colors.secondary,
      borderRadius: Radius.md,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 8,
      marginBottom: 24,
    },
    buttonDisabled: { opacity: 0.6 },
    verifyButtonText: { color: colors.onPrimary, fontSize: 17, fontWeight: '700' },
    resendText: { textAlign: 'center', fontSize: 15, color: colors.secondary, marginBottom: 24 },
    backToLogin: { textAlign: 'center', fontSize: 15, color: colors.secondary },
  });
