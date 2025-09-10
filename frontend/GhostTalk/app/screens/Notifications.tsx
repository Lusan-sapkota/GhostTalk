import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TopNavbar from '../../components/TopNavbar';
import Sidebar from '../../components/Sidebar';
import { Animated, Easing } from 'react-native';

interface Notification {
  id: number;
  type: 'friend_request' | 'like' | 'comment' | 'mention' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  user?: {
    id: number;
    username: string;
    first_name?: string;
    last_name?: string;
  };
}

export default function NotificationsScreen() {
  const scheme = useColorScheme();
  const router = useRouter();
  const colors = Colors[scheme ?? 'light'];

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const slideX = useRef(new Animated.Value(320)).current;

  useEffect(() => {
    checkAuth();
    loadNotifications();
  }, []);

  const checkAuth = async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      router.replace('/screens/Login');
    }
  };

  const loadNotifications = async () => {
    try {
      // Mock notifications data - replace with actual API call
      const mockNotifications: Notification[] = [
        {
          id: 1,
          type: 'friend_request',
          title: 'Friend Request',
          message: 'John Doe sent you a friend request',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
          read: false,
          user: {
            id: 1,
            username: 'johndoe',
            first_name: 'John',
            last_name: 'Doe'
          }
        },
        {
          id: 2,
          type: 'like',
          title: 'Post Liked',
          message: 'Sarah Smith liked your post',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
          read: false,
          user: {
            id: 2,
            username: 'sarahsmith',
            first_name: 'Sarah',
            last_name: 'Smith'
          }
        },
        {
          id: 3,
          type: 'comment',
          title: 'New Comment',
          message: 'Mike Johnson commented on your post',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
          read: true,
          user: {
            id: 3,
            username: 'mikejohnson',
            first_name: 'Mike',
            last_name: 'Johnson'
          }
        },
        {
          id: 4,
          type: 'system',
          title: 'Welcome!',
          message: 'Welcome to GhostTalk! Start exploring and connecting with friends.',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
          read: true
        }
      ];

      setNotifications(mockNotifications);
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

  const markAsRead = (notificationId: number) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const handleNotificationPress = (notification: Notification) => {
    markAsRead(notification.id);

    // Handle different notification types
    switch (notification.type) {
      case 'friend_request':
        // Navigate to friends page
        router.push('/(tabs)/friends');
        break;
      case 'like':
      case 'comment':
        // Navigate to home/posts
        router.push('/(tabs)');
        break;
      case 'mention':
        // Navigate to relevant post
        router.push('/(tabs)');
        break;
      default:
        break;
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'friend_request':
        return 'person-add-outline';
      case 'like':
        return 'heart-outline';
      case 'comment':
        return 'chatbubble-outline';
      case 'mention':
        return 'at-outline';
      case 'system':
        return 'information-circle-outline';
      default:
        return 'notifications-outline';
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

  // Sidebar functions
  const openDrawer = () => {
    setSidebarOpen(true);
    Animated.timing(slideX, { toValue: 0, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  };

  const closeDrawer = () => {
    Animated.timing(slideX, { toValue: 320, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(({ finished }) => {
      if (finished) setSidebarOpen(false);
    });
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      onPress={() => handleNotificationPress(item)}
      style={[
        styles.notificationItem,
        { borderBottomColor: colors.icon + '20' },
        !item.read && { backgroundColor: scheme === 'dark' ? '#1a1a1a' : '#f8f9fa' }
      ]}
    >
      <View style={styles.notificationIcon}>
        <Ionicons
          name={getNotificationIcon(item.type)}
          size={24}
          color={!item.read ? colors.tint : colors.icon}
        />
      </View>

      <View style={styles.notificationContent}>
        <Text style={[styles.notificationTitle, { color: colors.text }]}>
          {item.title}
        </Text>
        <Text style={[styles.notificationMessage, { color: colors.icon }]}>
          {item.message}
        </Text>
        <Text style={[styles.notificationTime, { color: colors.icon + '80' }]}>
          {formatTimestamp(item.timestamp)}
        </Text>
      </View>

      {!item.read && (
        <View style={[styles.unreadIndicator, { backgroundColor: colors.tint }]} />
      )}
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="notifications-off-outline" size={64} color={colors.icon + '40'} />
      <Text style={[styles.emptyStateText, { color: colors.icon }]}>
        No notifications yet
      </Text>
      <Text style={[styles.emptyStateSubtext, { color: colors.icon + '60' }]}>
        You'll see updates here when people interact with you
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <TopNavbar onMenuPress={openDrawer} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.icon }]}>
            Loading notifications...
          </Text>
        </View>
        <Sidebar
          isOpen={sidebarOpen}
          onClose={closeDrawer}
          slideX={slideX}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <TopNavbar onMenuPress={openDrawer} />

    <View style={[styles.header, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
      <Text style={[styles.headerTitle, { color: colors.text }]}>
        Notifications
      </Text>
      <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
        <Ionicons name="checkmark-done-outline" size={24} color={colors.tint} />
      </TouchableOpacity>
    </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderNotificationItem}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={notifications.length === 0 ? styles.emptyList : undefined}
        showsVerticalScrollIndicator={false}
      />

      <Sidebar
        isOpen={sidebarOpen}
        onClose={closeDrawer}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
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
    borderBottomWidth: 1,
    alignItems: 'center',
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
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyList: {
    flexGrow: 1,
  },
  markAllButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
});
