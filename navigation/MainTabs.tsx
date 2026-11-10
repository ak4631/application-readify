import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import ExploreScreen from '../screens/ExploreScreen';
import BookingsHubScreen from '../screens/BookingsHubScreen';
import ProfileScreen from '../screens/ProfileScreen';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();
type IconProps = { color: string; size: number };
function ExploreIcon(props: IconProps) {
  return <Icon name="search-outline" {...props} />;
}
function BookingsIcon(props: IconProps) {
  return <Icon name="calendar-outline" {...props} />;
}
function AccountIcon(props: IconProps) {
  return <Icon name="person-outline" {...props} />;
}
const tabIcons = {
  Home: ExploreIcon,
  Bookings: BookingsIcon,
  Profile: AccountIcon,
};
export default function MainTabs() {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      backBehavior="history"
      screenOptions={({ route }) => ({
        headerShown: false,
        animation: 'fade',
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.subText,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          elevation: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarHideOnKeyboard: true,
        tabBarIcon: tabIcons[route.name],
      })}
    >
      <Tab.Screen
        name="Home"
        component={ExploreScreen}
        options={{ title: 'Explore' }}
      />
      <Tab.Screen
        name="Bookings"
        component={BookingsHubScreen}
        options={{ title: 'My bookings' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Account' }}
      />
    </Tab.Navigator>
  );
}
