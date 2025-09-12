import React, { useEffect, useRef, useState } from 'react';
import { View, FlatList, Text, Image, Animated, Easing, TouchableOpacity, StyleSheet, Alert, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getFriendsList, Profile, getFriendRequests, acceptFriendRequest, declineFriendRequest, getFollowers } from '../api';
import ProfileCard from '../../components/ProfileCard';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface FriendRequest {
  id: number;
  sender: {
    id: number;
    username: string;
    first_name?: string;
    last_name?: string;
  };
  receiver: {
    id: number;
    username: string;
  };
  is_active: boolean;
  timestamp: string;
}

export default function FriendsScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? 'light'];
  const [friends, setFriends] = useState<Profile[]>([]);
  const [followers, setFollowers] = useState<Profile[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [suggestions, setSuggestions] = useState<Profile[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'friends' | 'followers' | 'requests'>('friends');
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        router.replace('/screens/Login');
        return;
      }

      const userRaw = await AsyncStorage.getItem('user');
      if (userRaw) {
        const user = JSON.parse(userRaw);
        setCurrentUserId(user.id);
        await Promise.all([
          fetchFriends(),
          fetchFollowers(user.id),
          fetchFriendRequests(user.id)
        ]);
      }
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

  const fetchFollowers = async (userId: number) => {
    try {
      const response = await getFollowers(userId);
      setFollowers(response.data.followers || []);
    } catch (error) {
      console.error('Error fetching followers:', error);
      setFollowers([]);
    }
  };

  const fetchFriendRequests = async (userId: number) => {
    try {
      const response = await getFriendRequests(userId);
      setFriendRequests(response.data.requests || []);
    } catch (error) {
      console.error('Error fetching friend requests:', error);
      setFriendRequests([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (currentUserId) {
        await Promise.all([
          fetchFriends(),
          fetchFollowers(currentUserId),
          fetchFriendRequests(currentUserId)
        ]);
      }
    } finally {
      setRefreshing(false);
    }
  };

  const handleAcceptRequest = async (requestId: number) => {
    try {
      await acceptFriendRequest(requestId);
      if (currentUserId) {
        await Promise.all([
          fetchFriends(),
          fetchFriendRequests(currentUserId)
        ]);
      }
      Alert.alert('Success', 'Friend request accepted!');
    } catch (error) {
      console.error('Error accepting friend request:', error);
      Alert.alert('Error', 'Failed to accept friend request');
    }
  };

  const handleDeclineRequest = async (requestId: number) => {
    try {
      await declineFriendRequest(requestId);
      if (currentUserId) {
        await fetchFriendRequests(currentUserId);
      }
      Alert.alert('Success', 'Friend request declined');
    } catch (error) {
      console.error('Error declining friend request:', error);
      Alert.alert('Error', 'Failed to decline friend request');
    }
  };

  const handleProfilePress = (profile: Profile) => {
    router.push({ pathname: '/screens/PublicProfile' as any, params: { userId: profile.user.id.toString() } });
  };

  const handleEditProfile = (profile: Profile) => {
    // TODO: Navigate to edit profile screen
    console.log('Edit profile:', profile);
    router.push('/screens/Profile');
  };

  const handleSearchUsers = () => {
    router.push('/screens/Search');
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors[scheme ?? 'light'].background }}>
      <View style={[styles.header, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomColor: Colors[scheme ?? 'light'].icon + '40' }]}>
        <Text style={[styles.headerTitle, { color: Colors[scheme ?? 'light'].text }]}>
          Friends and Followers
        </Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={handleSearchUsers}
            style={[styles.searchButton, { backgroundColor: Colors[scheme ?? 'light'].tint }]}
          >
            <Ionicons name="search" size={16} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Friends and Followers Tabs */}
      <View style={[styles.tabsContainer, { borderBottomColor: Colors[scheme ?? 'light'].icon + '40' }]}>
        <TouchableOpacity
          onPress={() => setActiveTab('friends')}
          style={[
            styles.tab,
            activeTab === 'friends' && [styles.activeTab, { borderBottomColor: Colors[scheme ?? 'light'].tint }]
          ]}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'friends' ? Colors[scheme ?? 'light'].tint : Colors[scheme ?? 'light'].icon }
          ]}>
            Friends ({friends.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('followers')}
          style={[
            styles.tab,
            activeTab === 'followers' && [styles.activeTab, { borderBottomColor: Colors[scheme ?? 'light'].tint }]
          ]}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'followers' ? Colors[scheme ?? 'light'].tint : Colors[scheme ?? 'light'].icon }
          ]}>
            Followers ({followers.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('requests')}
          style={[
            styles.tab,
            activeTab === 'requests' && [styles.activeTab, { borderBottomColor: Colors[scheme ?? 'light'].tint }]
          ]}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'requests' ? Colors[scheme ?? 'light'].tint : Colors[scheme ?? 'light'].icon }
          ]}>
            Requests ({friendRequests.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content based on active tab */}
      {activeTab === 'requests' ? (
        <FlatList
          data={friendRequests}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: Colors[scheme ?? 'light'].icon + '20'
            }}>
              <TouchableOpacity
                onPress={() => router.push({ pathname: '/screens/PublicProfile' as any, params: { userId: item.sender.id.toString() } })}
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
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
                  <Text style={{ color: 'white', fontWeight: '700', fontSize: 18 }}>
                    {(item.sender.first_name?.[0] || item.sender.username?.[0] || 'U').toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: Colors[scheme ?? 'light'].text, fontWeight: '600', fontSize: 16 }}>
                    {item.sender.first_name && item.sender.last_name
                      ? `${item.sender.first_name} ${item.sender.last_name}`
                      : item.sender.username}
                  </Text>
                  <Text style={{ color: Colors[scheme ?? 'light'].icon, fontSize: 14 }}>
                    @{item.sender.username}
                  </Text>
                </View>
              </TouchableOpacity>
              <View style={{ flexDirection: 'row' }}>
                <TouchableOpacity
                  onPress={() => handleAcceptRequest(item.id)}
                  style={{
                    backgroundColor: Colors[scheme ?? 'light'].tint,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    marginRight: 8
                  }}
                >
                  <Text style={{ color: 'white', fontWeight: '600' }}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeclineRequest(item.id)}
                  style={{
                    backgroundColor: Colors[scheme ?? 'light'].icon + '40',
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20
                  }}
                >
                  <Text style={{ color: Colors[scheme ?? 'light'].text, fontWeight: '600' }}>Decline</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 48 }}>
              <Ionicons name="person-add" size={48} color={Colors[scheme ?? 'light'].icon} />
              <Text style={{ marginTop: 10, color: Colors[scheme ?? 'light'].icon, fontWeight: '600' }}>
                No friend requests
              </Text>
              <Text style={{ marginTop: 4, color: Colors[scheme ?? 'light'].icon + '80', textAlign: 'center' }}>
                Friend requests will appear here
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={activeTab === 'friends' ? friends : followers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <ProfileCard
              profile={item}
              onPress={handleProfilePress}
            />
          )}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 48 }}>
              <Animated.View style={{ transform: [{ scale: pulse }] }}>
                <Image source={require('../../assets/images/icon.png')} style={{ width: 52, height: 52, opacity: 0.8 }} />
              </Animated.View>
              <Text style={{ marginTop: 10, color: Colors[scheme ?? 'light'].icon, fontWeight: '600' }}>
                {activeTab === 'friends' ? 'No friends yet' : 'No followers yet'}
              </Text>
              <Text style={{ marginTop: 4, color: Colors[scheme ?? 'light'].icon }}>
                {activeTab === 'friends' ? 'Find peers to start chats…' : 'People who follow you will appear here'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchButton: {
    padding: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
