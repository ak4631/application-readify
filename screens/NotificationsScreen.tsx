import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import ScreenHeader from '../components/ScreenHeader';
import { useTheme } from '../context/ThemeContext';
import { useStyles } from '../hooks/useStyles';
import type { ThemeColors } from '../constants/colors';
import { supabase } from '../lib/supabase';

type Notification = {
  id: string;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
};
export default function NotificationsScreen() {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useFocusEffect(
    useCallback(() => {
      let active = true;
      const load = async () => {
        const result = await supabase
          .from('customer_notifications')
          .select('id,title,body,read_at,created_at')
          .order('created_at', { ascending: false })
          .limit(100);
        if (!active) return;
        if (result.error)
          setError(
            'Could not load notifications. Reopen this screen to retry.',
          );
        else {
          setNotifications(result.data ?? []);
          setError('');
        }
        setLoading(false);
      };
      load();
      const timer = setInterval(load, 30000);
      return () => {
        active = false;
        clearInterval(timer);
      };
    }, []),
  );
  async function markRead(id: string) {
    const result = await supabase.rpc('mark_customer_notification_read', {
      p_id: id,
    });
    if (result.error) {
      setError('Could not mark this notification as read.');
      return;
    }
    setNotifications(rows =>
      rows.map(row =>
        row.id === id ? { ...row, read_at: new Date().toISOString() } : row,
      ),
    );
  }
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="Notifications" />
        {loading && <ActivityIndicator color={colors.primary} />}
        {!!error && <Text style={{ color: colors.danger }}>{error}</Text>}
        {!loading && !notifications.length && !error && (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Icon
                name="notifications-outline"
                size={32}
                color={colors.primary}
              />
            </View>
            <Text style={styles.emptyTitle}>A little quiet, for now</Text>
            <Text style={styles.description}>
              Your booking and payment updates will appear here.
            </Text>
          </View>
        )}
        {notifications.map(item => (
          <TouchableOpacity
            key={item.id}
            onPress={() => markRead(item.id)}
            style={[styles.card, !!item.read_at && styles.read]}
          >
            <View style={styles.notificationHeading}>
              <View style={styles.notificationIcon}>
                <Icon
                  name="notifications-outline"
                  size={20}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.title}>{item.title}</Text>
              {!item.read_at && <View style={styles.unreadDot} />}
            </View>
            <Text style={styles.description}>{item.body}</Text>
            <View style={styles.timeWrap}>
              <Text style={styles.time}>
                {new Date(item.created_at).toLocaleString()}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    emptyCard: {
      paddingVertical: 44,
      paddingHorizontal: 24,
      alignItems: 'center',
      borderRadius: 28,
      backgroundColor: colors.surfaceSubtle,
    },
    emptyIcon: {
      width: 80,
      height: 80,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 28,
      backgroundColor: colors.primaryLight,
      marginBottom: 20,
    },
    emptyTitle: { color: colors.text, fontSize: 22, fontWeight: '700' },
    notificationHeading: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    notificationIcon: {
      width: 40,
      height: 40,
      borderRadius: 14,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    unreadDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: colors.primary,
    },
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, gap: 16 },
    card: {
      padding: 20,
      backgroundColor: colors.surfaceSubtle,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 24,
    },
    read: { backgroundColor: colors.surface },
    title: { color: colors.text, fontWeight: '700', fontSize: 15, flex: 1 },
    description: {
      color: colors.subText,
      marginTop: 12,
      lineHeight: 21,
      fontSize: 14,
    },
    timeWrap: { marginTop: 8 },
    time: { color: colors.subText, fontSize: 12 },
  });
