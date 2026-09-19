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
import { ensureProfile } from '../lib/profile';
import { useTheme } from '../context/ThemeContext';
import { useStyles } from '../hooks/useStyles';
import { Radius } from '../constants/radius';
import InputField from '../components/InputField';
import type { ThemeColors } from '../constants/colors';
import type { RootStackParamList } from '../navigation/types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignUpScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'SignUp'>>();
  const { colors } = useTheme();
  const styles = useStyles(createStyles);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();

    if (trimmedName.length === 0) {
      Alert.alert('Missing name', 'Please enter your full name.');
      return;
    }
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      Alert.alert(
        'Weak password',
        'Password must contain at least 8 characters.',
      );
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: { data: { full_name: trimmedName } },
    });

    if (error) {
      setLoading(false);
      Alert.alert('Sign up failed', error.message);
      return;
    }

    if (data.user && data.session) {
      try {
        await ensureProfile(data.user.id, trimmedName);
      } catch (profileError: any) {
        console.error('Failed to create profile:', profileError);
      }
      setLoading(false);
      return;
    }

    setLoading(false);
    Alert.alert(
      'Check your email',
      'We sent you a confirmation link. Please verify your email, then log in.',
      [{ text: 'OK', onPress: () => navigation.navigate('Login') }],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require('../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>Create Account</Text>

        <Text style={styles.subtitle}>
          Join Readify India and start your reading journey.
        </Text>

        <InputField
          icon="person-outline"
          placeholder="Full Name"
          autoComplete="name"
          value={fullName}
          onChangeText={setFullName}
          editable={!loading}
        />

        <InputField
          icon="mail-outline"
          placeholder="Email Address"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
          editable={!loading}
        />

        <InputField
          icon="lock-closed-outline"
          placeholder="Password"
          secureTextEntry
          autoComplete="password-new"
          value={password}
          onChangeText={setPassword}
          editable={!loading}
        />
        <Text style={styles.passwordHint}>
          Password must contain at least 8 characters.
        </Text>

        <TouchableOpacity
          style={[styles.registerButton, loading && styles.buttonDisabled]}
          onPress={handleSignUp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={styles.registerButtonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          disabled={loading}
        >
          <Text style={styles.loginLink}>
            Already have an account? Log In
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    logo: {
      width: 90,
      height: 90,
      alignSelf: 'center',
      marginBottom: 32,
    },
    title: {
      fontSize: 30,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
    },
    subtitle: {
      marginTop: 12,
      marginBottom: 40,
      fontSize: 16,
      color: colors.subText,
      textAlign: 'center',
    },
    passwordHint: {
      fontSize: 13,
      color: colors.subText,
      marginBottom: 20,
    },
    registerButton: {
      width: '100%',
      height: 56,
      backgroundColor: colors.secondary,
      borderRadius: Radius.md,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    registerButtonText: {
      color: colors.onPrimary,
      fontSize: 17,
      fontWeight: '700',
    },
    loginLink: {
      textAlign: 'center',
      color: colors.subText,
      fontSize: 15,
      marginBottom: 12,
    },
  });
