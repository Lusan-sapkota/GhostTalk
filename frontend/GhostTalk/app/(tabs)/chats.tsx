import React, { useEffect, useRef, useState } from 'react';
import { View, FlatList, Text, TouchableOpacity, Animated, Easing, Image, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getFriendsList, Profile, createRoom } from '../api';
import { useRouter } from 'expo-router';

interface Friend {
  id: number;
  user: {
    id: number;
    username: string;
    first_name?: string;
    last_name?: string;
  };
  is_online: boolean;
  bio?: string;
  image?: string;
}

export default function ChatsScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        router.replace('/screens/Login');
        return;
      }
      await fetchFriends();
    })();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true })
      ])
    ).start();
  }, []);

  const fetchFriends = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const userRaw = await AsyncStorage.getItem('user');
      if (!userRaw) return setFriends([]);

      const user = JSON.parse(userRaw);
      if (!user?.id) return setFriends([]);

      const response = await getFriendsList(user.id);
      setFriends(response?.data?.friends?.map((f: any) => ({
        id: f.id,
        user: {
          id: f.id,
          username: f.username,
          first_name: f.first_name,
          last_name: f.last_name,
          email: f.email
        },
        is_online: f.is_online || false,
        bio: f.bio,
        image: f.image
      })) || []);
    } catch (error) {
      console.error('Error fetching friends:', error);
      setFriends([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchFriends();
    } finally {
      setRefreshing(false);
    }
  };

  const handleFriendPress = async (friend: Friend) => {
    try {
      const response = await createRoom(friend.user.id);
      const room = response.data;
      // Navigate to chat with this room
      router.push({ pathname: '/screens/ChatRoom', params: { room: JSON.stringify(room) } });
    } catch (error) {
      console.error('Error creating room:', error);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors[scheme ?? 'light'].background }}>
      <View style={[styles.header, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        <Text style={[styles.headerTitle, { color: Colors[scheme ?? 'light'].text }]}>
          Chats
        </Text>
        <View style={styles.headerRight}>
            <View style={[styles.onlineIndicator]}>
            <Animated.View
              style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: 'green',
              marginRight: 6,
              transform: [{ scale: pulse }],
              }}
            />
            <Text style={[styles.onlineText, { color: 'white' }]}>
              {friends.filter(f => f.is_online).length} online
            </Text>
            </View>
        </View>
      </View>

      <FlatList
        data={friends}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleFriendPress(item)}
            style={{
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: scheme === 'dark' ? '#333' : '#e0e0e0',
              flexDirection: 'row',
              alignItems: 'center'
            }}
          >
            <View style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              backgroundColor: Colors[scheme ?? 'light'].tint + '55',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12
            }}>
              <Text style={{ color: 'white', fontWeight: '700', fontSize: 18 }}>C</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: Colors[scheme ?? 'light'].text, fontWeight: '600' }}>
                {item.user.username}
              </Text>
              <Text style={{ color: Colors[scheme ?? 'light'].icon, fontSize: 12, marginTop: 2 }}>
                Tap to open conversation
              </Text>
            </View>
          </TouchableOpacity>
        )}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 48 }}>
            <Animated.View style={{ transform: [{ scale: pulse }] }}>
              <Image source={require('../../assets/images/icon.png')} style={{ width: 52, height: 52, opacity: 0.8 }} />
            </Animated.View>
            <Text style={{ marginTop: 10, color: Colors[scheme ?? 'light'].icon, fontWeight: '600' }}>No chats yet</Text>
            <Text style={{ marginTop: 4, color: Colors[scheme ?? 'light'].icon }}>Start a conversation…</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
