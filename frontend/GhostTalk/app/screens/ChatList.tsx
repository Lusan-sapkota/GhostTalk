import React, { useEffect, useState } from 'react';
import { View, FlatList, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { getRooms } from '../api';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Room {
  room_id: number;
  author_id: number;
  friend_id: number;
  created: string;
  friend_username?: string;
  last_message?: string;
  last_message_time?: string;
}

const ChatList: React.FC = () => {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? 'light'];
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    getCurrentUser();
    fetchRooms();
  }, []);

  const getCurrentUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        setCurrentUserId(user.id);
      }
    } catch (error) {
      console.error('Error getting current user:', error);
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await getRooms();
      // Enhance rooms with friend information
      const enhancedRooms = response.data.all_rooms.map((room: Room) => {
        const friendId = room.author_id === currentUserId ? room.friend_id : room.author_id;
        // For now, we'll use a placeholder. In a real app, you'd fetch friend details
        return {
          ...room,
          friend_username: `Friend ${friendId}`, // This should be fetched from API
          last_message: 'Last message preview...', // This should be fetched from API
          last_message_time: new Date(room.created).toLocaleDateString(),
        };
      });
      setRooms(enhancedRooms);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const handleRoomPress = (room: Room) => {
    router.push({
      pathname: '/screens/ChatRoom' as any,
      params: { room: JSON.stringify(room) }
    });
  };

  const renderRoom = ({ item }: { item: Room }) => (
    <TouchableOpacity
      onPress={() => handleRoomPress(item)}
      style={[styles.roomItem, { borderBottomColor: colors.icon + '20' }]}
    >
      <View style={styles.avatarContainer}>
        <View style={[styles.avatar, { backgroundColor: colors.primary + '30' }]}>
          <Text style={[styles.avatarText, { color: colors.primary }]}>
            {item.friend_username?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
      </View>

      <View style={styles.roomInfo}>
        <Text style={[styles.friendName, { color: colors.text }]}>
          {item.friend_username}
        </Text>
        <Text style={[styles.lastMessage, { color: colors.icon }]}>
          {item.last_message}
        </Text>
      </View>

      <View style={styles.roomMeta}>
        <Text style={[styles.timestamp, { color: colors.icon }]}>
          {item.last_message_time}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.icon + '20' }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Messages</Text>
        <TouchableOpacity style={styles.searchButton}>
          <Ionicons name="search" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={rooms}
        keyExtractor={(item) => item.room_id.toString()}
        renderItem={renderRoom}
        style={styles.list}
        contentContainerStyle={rooms.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="chatbubble-outline" size={64} color={colors.icon + '40'} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No conversations yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.icon }]}>
              Start chatting with your friends!
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  searchButton: {
    padding: 8,
  },
  list: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  roomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  roomInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
  },
  roomMeta: {
    alignItems: 'flex-end',
  },
  timestamp: {
    fontSize: 12,
  },
});

export default ChatList;
