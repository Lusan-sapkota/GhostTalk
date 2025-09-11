import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { getProfileDetail, sendFriendRequest, getFriendsList } from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

interface UserProfile {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface Profile {
  id: number;
  user: UserProfile;
  bio: string;
  image: string;
  is_online: boolean;
}

const PublicProfile: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFriend, setIsFriend] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const params = useLocalSearchParams();
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? 'light'];

  const userId = params.userId as string;

  useEffect(() => {
    loadProfile();
    getCurrentUser();
  }, [userId]);

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

  const loadProfile = async () => {
    if (!userId) {
      Alert.alert('Error', 'User ID is required');
      router.back();
      return;
    }

    try {
      setLoading(true);
      const response = await getProfileDetail(parseInt(userId));
      setProfile(response.data);

      // Check if this user is a friend
      if (currentUserId && currentUserId !== parseInt(userId)) {
        const friendsResponse = await getFriendsList(currentUserId);
        const isUserFriend = friendsResponse.data.friends.some((friend: any) => friend.id === parseInt(userId));
        setIsFriend(isUserFriend);
      }
    } catch (error: any) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load user profile');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSendFriendRequest = async () => {
    if (!profile) return;

    try {
      await sendFriendRequest(profile.user.id);
      setRequestSent(true);
      Alert.alert('Success', 'Friend request sent!');
    } catch (error: any) {
      console.error('Error sending friend request:', error);
      Alert.alert('Error', error?.response?.data?.error || 'Failed to send friend request');
    }
  };

  const getFullName = (user: UserProfile) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.username;
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="person-circle-outline" size={80} color={colors.icon} />
          <Text style={[styles.errorText, { color: colors.text }]}>Profile not found</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const isOwnProfile = currentUserId === profile.user.id;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backIcon}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Profile Content */}
      <View style={styles.profileContainer}>
        {/* Profile Picture */}
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: profile.image || '/media/default.jpg' }}
            style={styles.avatar}
          />
          {profile.is_online && (
            <View style={[styles.onlineIndicator, { backgroundColor: '#4CAF50' }]} />
          )}
        </View>

        {/* User Info */}
        <View style={styles.userInfo}>
          <Text style={[styles.name, { color: colors.text }]}>
            {getFullName(profile.user)}
          </Text>
          <Text style={[styles.username, { color: colors.icon }]}>
            @{profile.user.username}
          </Text>
          {profile.bio ? (
            <Text style={[styles.bio, { color: colors.text }]}>
              {profile.bio}
            </Text>
          ) : (
            <Text style={[styles.noBio, { color: colors.icon }]}>
              No bio available
            </Text>
          )}
        </View>

        {/* Action Buttons */}
        {!isOwnProfile && (
          <View style={styles.actionContainer}>
            {isFriend ? (
              <View style={[styles.friendButton, { backgroundColor: colors.icon }]}>
                <Ionicons name="checkmark-circle" size={20} color="white" />
                <Text style={styles.friendButtonText}>Friends</Text>
              </View>
            ) : requestSent ? (
              <View style={[styles.requestSentButton, { backgroundColor: colors.icon }]}>
                <Ionicons name="time-outline" size={20} color="white" />
                <Text style={styles.requestSentText}>Request Sent</Text>
              </View>
            ) : (
              <TouchableOpacity
                onPress={handleSendFriendRequest}
                style={[styles.addFriendButton, { backgroundColor: colors.primary }]}
              >
                <Ionicons name="person-add" size={20} color="white" />
                <Text style={styles.addFriendText}>Add Friend</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Stats */}
        <View style={[styles.statsContainer, { backgroundColor: colors.background, borderColor: colors.icon, borderWidth: 1 }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>0</Text>
            <Text style={[styles.statLabel, { color: colors.icon }]}>Posts</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>0</Text>
            <Text style={[styles.statLabel, { color: colors.icon }]}>Friends</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>
              {profile.is_online ? 'Online' : 'Offline'}
            </Text>
            <Text style={[styles.statLabel, { color: colors.icon }]}>Status</Text>
          </View>
        </View>
      </View>
    </ScrollView>
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
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backIcon: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  profileContainer: {
    padding: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'white',
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    marginBottom: 12,
  },
  bio: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  noBio: {
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  actionContainer: {
    marginBottom: 24,
  },
  addFriendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  addFriendText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  friendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  friendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  requestSentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  requestSentText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 12,
    marginTop: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginHorizontal: 16,
  },
});

export default PublicProfile;