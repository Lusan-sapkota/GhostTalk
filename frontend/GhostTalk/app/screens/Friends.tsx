import React, { useEffect, useState, useRef } from 'react';
import { View, FlatList, Text, TouchableOpacity, StyleSheet, Alert, RefreshControl } from 'react-native';
import { getFriendsList, Profile, getFriendRequests, acceptFriendRequest, declineFriendRequest, getFriendSuggestions, sendFriendRequest } from '../api';
import ProfileCard from '../../components/ProfileCard';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../api';

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

const Friends: React.FC = () => {
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? 'light'];
  const [friends, setFriends] = useState<Profile[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [suggestions, setSuggestions] = useState<Profile[]>([]);
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'suggestions'>('friends');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // WebSocket connection for realtime updates
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    initializeData();
    setupWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const setupWebSocket = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      // Create WebSocket connection for online status updates
      const wsUrl = `ws://${API_BASE_URL.split('://')[1].split(':')[0]}:8000/ws/online-status/`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected for friends page');
        // Send authentication message
        wsRef.current?.send(JSON.stringify({
          type: 'authenticate',
          token: token
        }));
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        // Attempt to reconnect after 5 seconds
        setTimeout(setupWebSocket, 5000);
      };
    } catch (error) {
      console.error('Error setting up WebSocket:', error);
    }
  };

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'online_status_update':
        // Update online status of friends
        setFriends(prevFriends =>
          prevFriends.map(friend =>
            friend.user.id === data.user_id
              ? { ...friend, is_online: data.is_online }
              : friend
          )
        );
        // Update online status in suggestions too
        setSuggestions(prevSuggestions =>
          prevSuggestions.map(suggestion =>
            suggestion.user.id === data.user_id
              ? { ...suggestion, is_online: data.is_online }
              : suggestion
          )
        );
        break;
      case 'friend_request_received':
        // Refresh friend requests when a new one is received
        if (currentUserId) {
          fetchFriendRequests(currentUserId);
        }
        break;
      case 'friend_request_accepted':
        // Refresh friends list when a request is accepted
        if (currentUserId) {
          fetchFriends(currentUserId);
          fetchFriendRequests(currentUserId);
        }
        break;
      default:
        break;
    }
  };

  const initializeData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        setCurrentUserId(user.id);
        await Promise.all([
          fetchFriends(user.id),
          fetchFriendRequests(user.id),
          fetchSuggestions()
        ]);
      }
    } catch (error) {
      console.error('Error initializing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFriends = async (userId: number) => {
    try {
      const response = await getFriendsList(userId);
      const friendsData = response.data.friends.map((f: any) => ({
        id: f.id,
        user: {
          id: f.id,
          username: f.username,
          first_name: f.first_name,
          last_name: f.last_name,
          email: f.email
        },
        is_online: f.is_online || false,
        bio: f.bio || '',
        image: f.image || '/media/default.jpg'
      }));
      setFriends(friendsData);
    } catch (error: any) {
      console.error('Friends list error:', error?.response?.data?.error || error?.message || 'Unknown error');
      Alert.alert('Error', 'Failed to load friends list. Please try again.');
    }
  };

  const fetchFriendRequests = async (userId: number) => {
    try {
      const response = await getFriendRequests(userId);
      setFriendRequests(response.data.requests || []);
    } catch (error: any) {
      console.error('Friend requests error:', error?.response?.data?.error || error?.message || 'Unknown error');
      Alert.alert('Error', 'Failed to load friend requests. Please try again.');
    }
  };

  const fetchSuggestions = async () => {
    try {
      const response = await getFriendSuggestions();
      setSuggestions(response.data.suggestions || []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (currentUserId) {
        await Promise.all([
          fetchFriends(currentUserId),
          fetchFriendRequests(currentUserId),
          fetchSuggestions()
        ]);
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleAcceptRequest = async (requestId: number) => {
    try {
      await acceptFriendRequest(requestId);
      if (currentUserId) {
        await Promise.all([
          fetchFriends(currentUserId),
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

  const handleSendRequest = async (userId: number) => {
    try {
      await sendFriendRequest(userId);
      await fetchSuggestions(); // Refresh suggestions
      Alert.alert('Success', 'Friend request sent!');
    } catch (error) {
      console.error('Error sending friend request:', error);
      Alert.alert('Error', 'Failed to send friend request');
    }
  };

  const renderFriendRequest = ({ item }: { item: FriendRequest }) => (
    <View style={[styles.requestCard, { backgroundColor: colors.background, borderColor: colors.tabIconDefault }]}>
      <View style={styles.requestContent}>
        <View style={styles.avatarContainer}>
          <Text style={[styles.avatarText, { color: 'white' }]}>
            {(item.sender.first_name?.[0] || item.sender.username?.[0] || 'U').toUpperCase()}
          </Text>
        </View>
        <View style={styles.requestInfo}>
          <Text style={[styles.requestName, { color: colors.text }]}>
            {item.sender.first_name && item.sender.last_name
              ? `${item.sender.first_name} ${item.sender.last_name}`
              : item.sender.username}
          </Text>
          <Text style={[styles.requestUsername, { color: colors.icon }]}>
            @{item.sender.username}
          </Text>
        </View>
      </View>
      <View style={styles.requestActions}>
        <TouchableOpacity
          onPress={() => handleAcceptRequest(item.id)}
          style={[styles.acceptButton, { backgroundColor: colors.tint }]}
        >
          <Ionicons name="checkmark" size={16} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDeclineRequest(item.id)}
          style={[styles.declineButton, { backgroundColor: colors.tabIconDefault }]}
        >
          <Ionicons name="close" size={16} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSuggestion = ({ item }: { item: Profile }) => (
    <View style={[styles.suggestionCard, { backgroundColor: colors.background, borderColor: colors.tabIconDefault }]}>
      <View style={styles.suggestionContent}>
        <View style={styles.avatarContainer}>
          <Text style={[styles.avatarText, { color: 'white' }]}>
            {item.user.first_name && item.user.last_name
              ? `${item.user.first_name[0]}${item.user.last_name[0]}`.toUpperCase()
              : (item.user.username?.[0] || 'U').toUpperCase()}
          </Text>
        </View>
        <View style={styles.suggestionInfo}>
          <Text style={[styles.suggestionName, { color: colors.text }]}>
            {item.user.first_name && item.user.last_name
              ? `${item.user.first_name} ${item.user.last_name}`
              : item.user.username}
          </Text>
          <Text style={[styles.suggestionUsername, { color: colors.icon }]}>
            @{item.user.username}
          </Text>
          {item.is_online && (
            <View style={styles.onlineIndicator}>
              <Text style={[styles.onlineText, { color: '#4CAF50' }]}>Online</Text>
            </View>
          )}
        </View>
      </View>
      <TouchableOpacity
        onPress={() => handleSendRequest(item.user.id)}
        style={[styles.addButton, { backgroundColor: colors.tint }]}
      >
        <Ionicons name="person-add" size={16} color="white" />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading friends...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          onPress={() => setActiveTab('friends')}
          style={[styles.tab, activeTab === 'friends' && { borderBottomColor: colors.tint }]}
        >
          <Text style={[styles.tabText, { color: activeTab === 'friends' ? colors.tint : colors.icon }]}>
            Friends ({friends.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('requests')}
          style={[styles.tab, activeTab === 'requests' && { borderBottomColor: colors.tint }]}
        >
          <Text style={[styles.tabText, { color: activeTab === 'requests' ? colors.tint : colors.icon }]}>
            Requests ({friendRequests.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('suggestions')}
          style={[styles.tab, activeTab === 'suggestions' && { borderBottomColor: colors.tint }]}
        >
          <Text style={[styles.tabText, { color: activeTab === 'suggestions' ? colors.tint : colors.icon }]}>
            Suggestions ({suggestions.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'friends' && (
        <FlatList
          data={friends}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <ProfileCard profile={item} onPress={() => {}} />
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people" size={48} color={colors.icon} />
              <Text style={[styles.emptyText, { color: colors.icon }]}>No friends yet</Text>
              <Text style={[styles.emptySubtext, { color: colors.icon + '60' }]}>
                Add friends to see them here
              </Text>
            </View>
          }
        />
      )}

      {activeTab === 'requests' && (
        <FlatList
          data={friendRequests}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderFriendRequest}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="person-add" size={48} color={colors.icon} />
              <Text style={[styles.emptyText, { color: colors.icon }]}>No friend requests</Text>
              <Text style={[styles.emptySubtext, { color: colors.icon + '60' }]}>
                Friend requests will appear here
              </Text>
            </View>
          }
        />
      )}

      {activeTab === 'suggestions' && (
        <FlatList
          data={suggestions}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderSuggestion}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="bulb" size={48} color={colors.icon} />
              <Text style={[styles.emptyText, { color: colors.icon }]}>No suggestions available</Text>
              <Text style={[styles.emptySubtext, { color: colors.icon + '60' }]}>
                Suggestions will appear as you add more friends
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    margin: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  requestContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  requestInfo: {
    flex: 1,
  },
  requestName: {
    fontSize: 16,
    fontWeight: '600',
  },
  requestUsername: {
    fontSize: 14,
    marginTop: 2,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  declineButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    margin: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  suggestionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  suggestionInfo: {
    flex: 1,
  },
  suggestionName: {
    fontSize: 16,
    fontWeight: '600',
  },
  suggestionUsername: {
    fontSize: 14,
    marginTop: 2,
  },
  onlineIndicator: {
    marginTop: 4,
  },
  onlineText: {
    fontSize: 12,
    fontWeight: '500',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default Friends;
