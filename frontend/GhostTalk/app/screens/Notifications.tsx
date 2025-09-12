import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Animated,
  Easing
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TopNavbar from '../../components/TopNavbar';
import Sidebar from '../../components/Sidebar';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../api';

interface Notification {
  id: number;
  sender?: string;
  sender_id?: number;
  sender_first_name?: string;
  sender_last_name?: string;
  notification_type: number;
  text_preview: string;
  date: string;
  post_id?: number;
  is_seen: boolean;
}

export default function NotificationsScreen() {
  const scheme = useColorScheme();
  const router = useRouter();
  const colors = Colors[scheme ?? 'light'];

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const slideX = useRef(new Animated.Value(320)).current;

  useEffect(() => {
    checkAuth();
    loadNotifications();
  }, []);

  const openSidebar = () => {
    setSidebarOpen(true);
    Animated.timing(slideX, { 
      toValue: 0, 
      duration: 220, 
      easing: Easing.ease, 
      useNativeDriver: true 
    }).start();
  };

  const closeSidebar = () => {
    Animated.timing(slideX, { 
      toValue: 320, 
      duration: 200, 
      easing: Easing.ease, 
      useNativeDriver: true 
    }).start(() => {
      setSidebarOpen(false);
    });
  };

  const checkAuth = async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      router.replace('/screens/Login');
    }
  };

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await getNotifications();
      setNotifications(response.data.notifications || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await markNotificationRead(notificationId);
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, is_seen: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, is_seen: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    // Mark as read first
    if (!notification.is_seen) {
      await handleMarkAsRead(notification.id);
    }

    // Handle different notification types with smooth navigation
    switch (notification.notification_type) {
      case 7: // Friend Request
        router.push('/(tabs)/friends');
        break;
      case 8: // Friend Request Accepted
        router.push('/(tabs)/friends');
        break;
      case 1: // Like
      case 2: // Follow
      case 3: // Comment
      case 4: // Reply
      case 5: // Like-Comment
      case 6: // Like-Reply
        router.push('/(tabs)');
        break;
      default:
        break;
    }
  };

  const getNotificationIcon = (type: number) => {
    switch (type) {
      case 7: // Friend Request
        return 'person-add-outline';
      case 8: // Friend Request Accepted
        return 'checkmark-circle-outline';
      case 1: // Like
        return 'heart-outline';
      case 2: // Follow
        return 'person-add-outline';
      case 3: // Comment
        return 'chatbubble-outline';
      case 4: // Reply
        return 'return-up-forward-outline';
      case 5: // Like-Comment
        return 'heart-outline';
      case 6: // Like-Reply
        return 'heart-outline';
      default:
        return 'notifications-outline';
    }
  };

  const getNotificationTypeText = (type: number) => {
    switch (type) {
      case 7:
        return 'Friend Request';
      case 8:
        return 'Friend Request Accepted';
      case 1:
        return 'Post Liked';
      case 2:
        return 'New Follower';
      case 3:
        return 'New Comment';
      case 4:
        return 'New Reply';
      case 5:
        return 'Comment Liked';
      case 6:
        return 'Reply Liked';
      default:
        return 'Notification';
    }
  };

  const getNotificationColor = (type: number) => {
    switch (type) {
      case 7: // Friend Request
        return '#007AFF';
      case 8: // Friend Request Accepted
        return '#34C759';
      case 1: // Like
        return '#FF3B30';
      case 2: // Follow
        return '#34C759';
      case 3: // Comment
        return '#FF9500';
      case 4: // Reply
        return '#AF52DE';
      case 5: // Like-Comment
        return '#FF3B30';
      case 6: // Like-Reply
        return '#FF3B30';
      default:
        return colors.tint;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return notificationTime.toLocaleDateString();
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      onPress={() => handleNotificationPress(item)}
      style={[
        styles.notificationItem,
        {
          backgroundColor: colors.background,
          borderLeftColor: getNotificationColor(item.notification_type),
          borderLeftWidth: 4
        },
        !item.is_seen && {
          backgroundColor: scheme === 'dark' ? '#1a1a1a' : '#f8f9fa',
          shadowColor: getNotificationColor(item.notification_type),
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3
        }
      ]}
      activeOpacity={0.7}
    >
      <View style={styles.notificationIcon}>
        <Ionicons
          name={getNotificationIcon(item.notification_type)}
          size={24}
          color={item.is_seen ? colors.icon : getNotificationColor(item.notification_type)}
        />
      </View>
      <View style={styles.notificationContent}>
        <Text style={[styles.notificationTitle, { color: colors.text }]}>
          {getNotificationTypeText(item.notification_type) || 'Notification'}
        </Text>
        <Text style={[styles.notificationMessage, { color: colors.icon }]}>
          {item.text_preview || 'No preview available'}
        </Text>
        <Text style={[styles.notificationTime, { color: colors.tabIconDefault }]}>
          {formatTimestamp(item.date) || 'Unknown time'}
        </Text>
      </View>
      {!item.is_seen && (
        <View style={[styles.unreadIndicator, { backgroundColor: getNotificationColor(item.notification_type) }]} />
      )}
      <View style={styles.arrowContainer}>
        <Ionicons
          name="chevron-forward"
          size={16}
          color={colors.tabIconDefault}
        />
      </View>
    </TouchableOpacity>
  );

  const unreadCount = notifications.filter(n => !n.is_seen).length;

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <TopNavbar onMenuPress={openSidebar} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.icon }]}>
            Loading notifications...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <TopNavbar onMenuPress={openSidebar} />      {/* Header with unread count and mark all read */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Notifications
          </Text>
          {unreadCount > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.tint }]}>
              <Text style={styles.badgeText}>{unreadCount.toString()}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={handleMarkAllAsRead}
            style={[styles.markAllButton, { backgroundColor: colors.tint }]}
          >
            <Text style={styles.markAllText}>Mark All Read</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderNotification}
        refreshing={refreshing}
        onRefresh={onRefresh}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={notifications.length === 0 ? styles.emptyList : undefined}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconContainer, { backgroundColor: colors.tint, opacity: 0.2 }]}>
              <Ionicons name="notifications-off-outline" size={48} color={colors.tint} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No notifications yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.icon }]}>
              When someone interacts with you, you'll see it here
            </Text>
          </View>
        }
      />

      <Sidebar
        isOpen={sidebarOpen}
        onClose={closeSidebar}
        slideX={slideX}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  badge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  markAllButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  markAllText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  arrowContainer: {
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 100,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyList: {
    flexGrow: 1,
  },
});
