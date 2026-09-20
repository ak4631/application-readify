import React from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { useStyles } from '../hooks/useStyles';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { ThemeColors } from '../constants/colors';

const MENU_ITEMS = [
  { icon: 'book-outline', label: 'My Bookings', route: 'Bookings' },
  { icon: 'diamond-outline', label: 'My Subscriptions', route: 'MySubscriptions' },
  { icon: 'heart-outline', label: 'Saved Libraries', route: null },
  { icon: 'help-circle-outline', label: 'Help & Support', route: null },
] as const;

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { profile, session } = useAuth();
  const { mode, colors, toggleTheme } = useTheme();
  const styles = useStyles(createStyles);

  const name = profile?.full_name || session?.user.email?.split('@')[0] || 'Reader';
  const email = session?.user.email ?? '';
  const avatarInitial = name.charAt(0).toUpperCase();

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => supabase.auth.signOut(),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>My Profile</Text>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{avatarInitial}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.email}>{email}</Text>
          </View>
        </View>

        <View style={styles.menuCard}>
          <View style={styles.menuItem}>
            <Icon name="moon-outline" size={19} color={colors.primary} style={styles.menuIcon} />
            <Text style={styles.menuText}>Dark Mode</Text>
            <Switch
              value={mode === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.onPrimary}
            />
          </View>

          <View style={styles.divider} />

          {MENU_ITEMS.map((item, index) => (
            <React.Fragment key={item.label}>
              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={item.route ? () => navigation.navigate(item.route) : undefined}
              >
                <Icon name={item.icon} size={19} color={colors.primary} style={styles.menuIcon} />
                <Text style={styles.menuText}>{item.label}</Text>
                <Icon name="chevron-forward" size={20} color={colors.placeholder} />
              </TouchableOpacity>
              {index < MENU_ITEMS.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutButton} activeOpacity={0.7} onPress={handleLogout}>
          <Icon name="log-out-outline" size={17} color={colors.danger} style={styles.logoutIcon} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Readify India · Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { flex: 1 },
    contentContainer: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 },
    title: { marginTop: 8, fontSize: 30, lineHeight: 36, fontWeight: '700', color: colors.text },
    profileCard: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 24,
      padding: 16,
      borderRadius: 18,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    avatar: { width: 58, height: 58, borderRadius: 29, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 22, fontWeight: '700', color: colors.onPrimary },
    profileInfo: { flex: 1, marginLeft: 14 },
    name: { fontSize: 18, fontWeight: '700', color: colors.text },
    email: { marginTop: 4, fontSize: 13, color: colors.subText },
    menuCard: { marginTop: 20, paddingHorizontal: 16, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    menuItem: { minHeight: 58, flexDirection: 'row', alignItems: 'center' },
    menuIcon: { width: 32, textAlign: 'center' },
    menuText: { flex: 1, marginLeft: 10, fontSize: 15, fontWeight: '600', color: colors.text },
    divider: { height: 1, backgroundColor: colors.surfaceAlt },
    logoutButton: {
      height: 50,
      marginTop: 20,
      borderRadius: 13,
      borderWidth: 1,
      borderColor: colors.dangerLight,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    logoutIcon: { marginRight: 8 },
    logoutText: { fontSize: 15, fontWeight: '700', color: colors.danger },
    version: { marginTop: 20, fontSize: 12, color: colors.placeholder, textAlign: 'center' },
  });
