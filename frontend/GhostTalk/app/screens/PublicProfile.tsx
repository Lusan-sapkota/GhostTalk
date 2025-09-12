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
  Dimensions,
  SafeAreaView
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { getProfileDetail, sendFriendRequest, getFriendsList, followUnfollow, cancelFriendRequest, removeFriend, acceptFriendRequest } from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../api';

const { width } = Dimensions.get('window');

// ImageWithFallback component for handling image loading errors
const ImageWithFallback: React.FC<{
  source: { uri: string };
  fallbackText: string;
  style: any;
}> = ({ source, fallbackText, style }) => {
  const [imageError, setImageError] = useState(false);
  const scheme = useColorScheme();

  if (imageError) {
    return (
      <View style={{
        ...style,
        backgroundColor: Colors[scheme ?? 'light'].tint,
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <Text style={{ 
          fontSize: 32, 
          fontWeight: 'bold', 
          color: 'white',
          textAlign: 'center'
        }}>
          {fallbackText}
        </Text>
      </View>
    );
  }

  return (
    <Image
      source={source}
      style={style}
      onError={() => setImageError(true)}
    />
  );
};

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
  friends_count: number;
  followers_count: number;
  following_count: number;
  is_friend: boolean;
  follow: boolean;
  request_sent: number;
  pending_friend_request_id: number | null;
}

const PublicProfile: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
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
      const profileData = response.data;
      setProfile(profileData);
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
      // Update profile data
      setProfile(prev => prev ? {...prev, request_sent: 2} : null); // 2 = you sent to them
    } catch (error: any) {
      console.error('Error sending friend request:', error);
      Alert.alert('Error', 'Failed to send friend request');
    }
  };

  const handleAcceptRequest = async () => {
    if (!profile || !profile.pending_friend_request_id) return;

    try {
      await acceptFriendRequest(profile.pending_friend_request_id);
      // Update profile data
      setProfile(prev => prev ? {...prev, is_friend: true, request_sent: 0} : null);
      Alert.alert('Success', 'Friend request accepted!');
    } catch (error: any) {
      console.error('Error accepting friend request:', error);
      Alert.alert('Error', 'Failed to accept friend request');
    }
  };

  const handleUnfollow = () => {
    if (!profile) return;
    Alert.alert(
      'Unfollow User',
      `Are you sure you want to unfollow ${getFullName(profile.user)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Unfollow', 
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await followUnfollow(profile.id);
              // Update profile data based on API response
              setProfile(prev => prev ? {...prev, follow: response.data.now_following} : null);
            } catch (error: any) {
              console.error('Error unfollowing:', error);
              Alert.alert('Error', 'Failed to unfollow user');
            }
          }
        }
      ]
    );
  };

  const handleCancelRequest = () => {
    if (!profile) return;
    Alert.alert(
      'Cancel Friend Request',
      `Are you sure you want to cancel your friend request to ${getFullName(profile.user)}?`,
      [
        { text: 'Keep', style: 'cancel' },
        { 
          text: 'Cancel Request', 
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelFriendRequest(profile.user.id);
              // Update profile data
              setProfile(prev => prev ? {...prev, request_sent: 0} : null);
            } catch (error: any) {
              console.error('Error canceling request:', error);
              Alert.alert('Error', 'Failed to cancel friend request');
            }
          }
        }
      ]
    );
  };

  const handleUnfriend = () => {
    if (!profile) return;
    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${getFullName(profile.user)} from your friends?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFriend(profile.user.id);
              // Update profile data
              setProfile(prev => prev ? {...prev, is_friend: false} : null);
            } catch (error: any) {
              console.error('Error removing friend:', error);
              Alert.alert('Error', 'Failed to remove friend');
            }
          }
        }
      ]
    );
  };

  const handleFollow = async () => {
    if (!profile) return;

    try {
      const response = await followUnfollow(profile.id);
      // Update profile data based on API response
      setProfile(prev => prev ? {...prev, follow: response.data.now_following} : null);
    } catch (error: any) {
      console.error('Error following/unfollowing:', error);
      Alert.alert('Error', 'Failed to update follow status');
    }
  };

  const getFullName = (user: UserProfile) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.username;
  };

  const getUserInitials = (user: UserProfile) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
    }
    return user.username.charAt(0).toUpperCase();
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
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
      </SafeAreaView>
    );
  }

  const isOwnProfile = currentUserId === profile.user.id;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header - outside SafeAreaView */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backIcon}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
        <View style={styles.headerSpacer} />
        {!isOwnProfile && (
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                'Block User',
                `Are you sure you want to block ${getFullName(profile.user)}? You won't be able to see their posts or interact with them.`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Block', 
                    style: 'destructive',
                    onPress: () => {
                      // TODO: Implement block user functionality
                      Alert.alert('Feature Coming Soon', 'Block user functionality will be available soon.');
                    }
                  }
                ]
              );
            }}
            style={styles.headerIcon}
          >
            <Ionicons name="ban-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        )}
      </View>

      <SafeAreaView style={[styles.safeAreaContainer, { backgroundColor: colors.background }]}>

      <ScrollView style={{ flex: 1 }}>

      {/* Profile Content */}
      <View style={styles.profileContainer}>
        {/* Profile Picture */}
        <View style={styles.avatarContainer}>
          <ImageWithFallback
            source={{ uri: profile.image ? `${API_BASE_URL}${profile.image}` : '' }}
            fallbackText={getUserInitials(profile.user)}
            style={styles.avatar}
          />
          <View style={[styles.onlineIndicator, { 
            backgroundColor: profile.is_online ? '#4CAF50' : '#9E9E9E',
            borderColor: colors.background,
            borderWidth: 2
          }]} />
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
            <View style={styles.buttonRow}>
              {/* Follow Button */}
              {profile.follow ? (
                <TouchableOpacity
                  onPress={handleUnfollow}
                  style={[
                    styles.actionButton,
                    { backgroundColor: colors.icon }
                  ]}
                >
                  <Ionicons 
                    name="heart" 
                    size={20} 
                    color="white" 
                  />
                  <Text style={styles.actionButtonText}>
                    Following
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={handleFollow}
                  style={[
                    styles.actionButton,
                    { backgroundColor: colors.primary }
                  ]}
                >
                  <Ionicons 
                    name="heart-outline" 
                    size={20} 
                    color="white" 
                  />
                  <Text style={styles.actionButtonText}>
                    Follow
                  </Text>
                </TouchableOpacity>
              )}

              {/* Friend Button */}
              {profile.is_friend ? (
                <TouchableOpacity
                  onPress={handleUnfriend}
                  style={[styles.actionButton, { backgroundColor: colors.icon }]}
                >
                  <Ionicons name="checkmark-circle" size={20} color="white" />
                  <Text style={styles.actionButtonText}>Friends</Text>
                </TouchableOpacity>
              ) : profile.request_sent === 2 ? (
                <TouchableOpacity
                  onPress={handleCancelRequest}
                  style={[styles.actionButton, { backgroundColor: colors.icon }]}
                >
                  <Ionicons name="time-outline" size={20} color="white" />
                  <Text style={styles.actionButtonText}>Request Sent</Text>
                </TouchableOpacity>
              ) : profile.request_sent === 1 ? (
                <TouchableOpacity
                  onPress={handleAcceptRequest}
                  style={[styles.actionButton, { backgroundColor: colors.primary }]}
                >
                  <Ionicons name="checkmark" size={20} color="white" />
                  <Text style={styles.actionButtonText}>Accept Request</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={handleSendFriendRequest}
                  style={[styles.actionButton, { backgroundColor: colors.primary }]}
                >
                  <Ionicons name="person-add" size={20} color="white" />
                  <Text style={styles.actionButtonText}>Add Friend</Text>
                </TouchableOpacity>
              )}
            </View>
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
            <Text style={[styles.statNumber, { color: colors.primary }]}>{profile.friends_count || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.icon }]}>Friends</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>{profile.followers_count || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.icon }]}>Followers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>{profile.following_count || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.icon }]}>Following</Text>
          </View>
        </View>
      </View>
    </ScrollView>
    </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeAreaContainer: {
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
    paddingTop: 50, // Add top padding for status bar
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backIcon: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1, // Take remaining space
  },
  headerSpacer: {
    width: 40,
  },
  headerIcon: {
    padding: 8,
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
    top: 8,
    right: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
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
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
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