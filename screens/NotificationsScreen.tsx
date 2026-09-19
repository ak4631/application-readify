import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { useStyles } from '../hooks/useStyles';
import type { ThemeColors } from '../constants/colors';

type Notification = {
  id: string;
  icon: string;
  title: string;
  text: string;
  time: string;
};

const initialNotifications: Notification[] = [
  {
    id: 'welcome',
    icon: 'book-outline',
    title: 'Welcome to Readify India Library',
    text: 'Discover libraries, reading rooms and study spaces near you.',
    time: 'Just now',
  },
  {
    id: 'nearby',
    icon: 'notifications-outline',
    title: 'Explore nearby libraries',
    text: 'Find a suitable library and book your next study session.',
    time: 'Today',
  },
  {
    id: 'top-rated',
    icon: 'star-outline',
    title: 'Discover top-rated libraries',
    text: 'Check out highly rated reading spaces around you.',
    time: 'Today',
  },
];

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const [notifications] = useState(initialNotifications);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);

  const unreadCount = notifications.length - readNotificationIds.length;

  const markNotificationAsRead = (id: string) => {
    setReadNotificationIds(currentIds =>
      currentIds.includes(id) ? currentIds : [...currentIds, id],
    );
  };

  const markAllAsRead = () => {
    setReadNotificationIds(notifications.map(notification => notification.id));
  };

  const allNotificationsRead = unreadCount === 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          <Text style={styles.subtitle}>Stay updated with your bookings and Readify India Library</Text>
        </View>

        {notifications.map(notification => {
          const isRead = readNotificationIds.includes(notification.id);
          return (
            <TouchableOpacity
              key={notification.id}
              style={[styles.notificationCard, isRead && styles.readNotificationCard]}
              activeOpacity={0.8}
              onPress={() => markNotificationAsRead(notification.id)}
            >
              <View style={[styles.iconContainer, isRead && styles.readIconContainer]}>
                <Icon name={notification.icon} size={19} color={isRead ? colors.placeholder : colors.primary} />
              </View>

              <View style={styles.notificationContent}>
                <View style={styles.notificationTitleRow}>
                  <Text style={[styles.notificationTitle, isRead && styles.readNotificationTitle]}>
                    {notification.title}
                  </Text>
                  {!isRead && <View style={styles.unreadDot} />}
                </View>

                <Text style={[styles.notificationText, isRead && styles.readNotificationText]}>
                  {notification.text}
                </Text>
                <Text style={styles.notificationTime}>{notification.time}</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          style={[styles.clearButton, allNotificationsRead && styles.disabledClearButton]}
          activeOpacity={0.7}
          onPress={markAllAsRead}
          disabled={allNotificationsRead}
        >
          <Text style={[styles.clearButtonText, allNotificationsRead && styles.disabledClearButtonText]}>
            {allNotificationsRead ? 'All notifications read' : 'Mark all as read'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { flex: 1 },
    contentContainer: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 },
    header: { marginTop: 8 },
    titleRow: { flexDirection: 'row', alignItems: 'center' },
    title: { fontSize: 30, lineHeight: 36, fontWeight: '700', color: colors.text },
    countBadge: { minWidth: 24, height: 24, marginLeft: 10, paddingHorizontal: 7, borderRadius: 12, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
    countBadgeText: { fontSize: 12, fontWeight: '700', color: colors.onPrimary },
    subtitle: { marginTop: 8, fontSize: 16, lineHeight: 24, color: colors.subText },
    notificationCard: { flexDirection: 'row', marginTop: 16, padding: 16, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    readNotificationCard: { backgroundColor: colors.surfaceSubtle, borderColor: colors.surfaceAlt },
    iconContainer: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
    readIconContainer: { backgroundColor: colors.surfaceAlt },
    notificationContent: { flex: 1, marginLeft: 12 },
    notificationTitleRow: { flexDirection: 'row', alignItems: 'flex-start' },
    notificationTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text },
    readNotificationTitle: { color: colors.subText },
    unreadDot: { width: 8, height: 8, marginLeft: 8, marginTop: 5, borderRadius: 4, backgroundColor: colors.primary },
    notificationText: { marginTop: 5, fontSize: 13, lineHeight: 19, color: colors.subText },
    readNotificationText: { color: colors.placeholder },
    notificationTime: { marginTop: 8, fontSize: 11, color: colors.placeholder },
    clearButton: { height: 48, marginTop: 20, borderRadius: 12, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
    clearButtonText: { fontSize: 14, fontWeight: '700', color: colors.primary },
    disabledClearButton: { backgroundColor: colors.surfaceAlt },
    disabledClearButtonText: { color: colors.placeholder },
  });
