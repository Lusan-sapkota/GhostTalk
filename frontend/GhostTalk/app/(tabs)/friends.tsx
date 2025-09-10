import React, { useEffect, useRef, useState } from 'react';
import { View, FlatList, Text, Image, Animated, Easing, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getFriendsList, Profile } from '../api';
import ProfileCard from '../../components/ProfileCard';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function FriendsScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const [friends, setFriends] = useState<Profile[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'friends' | 'followers'>('friends');
  const pulse = useRef(new Animated.Value(1)).current;

  // Mock suggestions data
  const [suggestions] = useState<Profile[]>([
    {
      id: 1,
      user: {
        id: 1,
        username: 'johndoe',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com'
      },
      is_online: true,
      bio: 'Software developer passionate about React Native',
      image: undefined
    },
    {
      id: 2,
      user: {
        id: 2,
        username: 'sarahsmith',
        first_name: 'Sarah',
        last_name: 'Smith',
        email: 'sarah@example.com'
      },
      is_online: false,
      bio: 'UI/UX designer with 5+ years experience',
      image: undefined
    },
    {
      id: 3,
      user: {
        id: 3,
        username: 'mikejohnson',
        first_name: 'Mike',
        last_name: 'Johnson',
        email: 'mike@example.com'
      },
      is_online: true,
      bio: 'Full-stack developer and tech enthusiast',
      image: undefined
    }
  ]);

  // Mock followers data
  const [followers] = useState<Profile[]>([
    {
      id: 4,
      user: {
        id: 4,
        username: 'alexchen',
        first_name: 'Alex',
        last_name: 'Chen',
        email: 'alex@example.com'
      },
      is_online: true,
      bio: 'Mobile app developer',
      image: undefined
    },
    {
      id: 5,
      user: {
        id: 5,
        username: 'emmawilson',
        first_name: 'Emma',
        last_name: 'Wilson',
        email: 'emma@example.com'
      },
      is_online: false,
      bio: 'Product designer',
      image: undefined
    }
  ]);

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

  const handleProfilePress = (profile: Profile) => {
    // TODO: Navigate to user profile
    console.log('Profile pressed:', profile);
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

      {/* Suggestions Section */}
      {suggestions.length > 0 && (
        <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
          <Text style={{
            color: Colors[scheme ?? 'light'].text,
            fontWeight: '600',
            fontSize: 18,
            marginBottom: 12
          }}>
            Suggestions
          </Text>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleProfilePress(item)}
                style={{
                  backgroundColor: scheme === 'dark' ? '#222' : '#f8f9fa',
                  borderRadius: 12,
                  padding: 12,
                  marginRight: 12,
                  width: 120,
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
                  marginBottom: 8
                }}>
                  <Text style={{ color: 'white', fontWeight: '700', fontSize: 18 }}>
                    {(item.user.first_name?.[0] || item.user.username?.[0] || 'U').toUpperCase()}
                  </Text>
                </View>
                <Text style={{
                  color: Colors[scheme ?? 'light'].text,
                  fontWeight: '600',
                  fontSize: 14,
                  textAlign: 'center'
                }} numberOfLines={1}>
                  {item.user.first_name || item.user.username}
                </Text>
                <View style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: item.is_online ? '#4CAF50' : Colors[scheme ?? 'light'].icon,
                  marginTop: 4
                }} />
              </TouchableOpacity>
            )}
          />
        </View>
      )}

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
      </View>

      {/* Content based on active tab */}
      <FlatList
        data={activeTab === 'friends' ? friends : followers}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <ProfileCard
            profile={item}
            onPress={handleProfilePress}
            onEdit={activeTab === 'friends' ? handleEditProfile : undefined}
            showEdit={activeTab === 'friends'}
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
