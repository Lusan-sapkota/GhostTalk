import React, { useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Animated, Easing, Image, ScrollView, Alert, RefreshControl, Modal } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { 
  getProfile,
  getProfileDetail, 
  getUserPosts, 
  Post, 
  Profile as ProfileType, 
  likePost, 
  savePost,
  getFriendsList,
  followUnfollow,
  sendFriendRequest,
  getFriendRequests,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
  removeFriend
} from '../api';
import PostItem from '../../components/PostItem';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../api';

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

const Profile: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const scheme = useColorScheme();
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [friends, setFriends] = useState<any[]>([]);
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [isFriend, setIsFriend] = useState<boolean>(false);
  const [hasSentRequest, setHasSentRequest] = useState<boolean>(false);
  const [isOwnProfile, setIsOwnProfile] = useState<boolean>(false);
  const [friendsCount, setFriendsCount] = useState<number>(0);
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [showFriendsModal, setShowFriendsModal] = useState<boolean>(false);
  const [showFollowersModal, setShowFollowersModal] = useState<boolean>(false);
  const [friendsList, setFriendsList] = useState<any[]>([]);
  const [followersList, setFollowersList] = useState<any[]>([]);
  const [profileUserId, setProfileUserId] = useState<number | null>(null);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    checkAuthentication();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true })
      ])
    ).start();
  }, []);

  const checkAuthentication = async () => {
    const token = await AsyncStorage.getItem('token');
    const storedUser = await AsyncStorage.getItem('user');

    if (!token) {
      setError('Please log in to view your profile');
      setLoading(false);
      return;
    }

    // If we have a stored user but no token, clear the stored user data
    if (!token && storedUser) {
      await AsyncStorage.removeItem('user');
    }

    fetchProfile();
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if we have a userId parameter (for viewing other users' profiles)
      const userId = params?.userId;
      const userIdString = Array.isArray(userId) ? userId[0] : userId;

      let profileData, userData;

      if (userIdString) {
        // Fetch other user's profile
        setProfileUserId(parseInt(userIdString));
        const response = await getProfileDetail(parseInt(userIdString));
        
        console.log('Other user profile API response:', response);
        
        if (!response || !response.data) {
          console.error('No response data received');
          return;
        }

        // Handle different possible response structures
        if (response.data.user) {
          profileData = response.data;
          userData = response.data.user;
        } else {
          console.error('Unexpected response structure:', response.data);
          return;
        }
      } else {
        // Fetch current user's profile
        // Check if user is authenticated
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          setError('Please log in to view your profile');
          setLoading(false);
          return;
        }

        const response = await getProfile();

        console.log('Profile API response:', response);

        // Check if response and data exist
        if (!response || !response.data) {
          console.error('No response data received');
          return;
        }

        // Handle different possible response structures
        if (response.data.profile && response.data.user) {
          // Structure: { profile: {...}, user: {...} }
          profileData = response.data.profile;
          userData = response.data.user;
        } else if (response.data.id && response.data.user) {
          // Structure: { id: ..., user: {...}, ... } (direct profile object)
          profileData = response.data;
          userData = response.data.user;
        } else {
          console.error('Unexpected response structure:', response.data);
          return;
        }
      }

      // Ensure we have the required data
      if (!profileData.id || !userData.username) {
        console.error('Missing required profile or user data');
        return;
      }

      // Create the combined profile object
      const combinedProfile = {
        id: profileData.id,
        user: userData,
        is_online: profileData.is_online || false,
        bio: profileData.bio || '',
        image: profileData.image || null
      };

      console.log('Combined profile data:', combinedProfile);
      console.log('User data details:', {
        username: userData.username,
        first_name: userData.first_name,
        last_name: userData.last_name,
        email: userData.email
      });

      // Check if this is the current user's profile
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const currentUser = JSON.parse(storedUser);
        setIsOwnProfile(currentUser.id === userData.id);
      }

      setProfile(combinedProfile);

      // Fetch friends data
      await fetchFriendsData(userData.id);

      // Fetch user posts if we have a username
      if (userData.username) {
        try {
          const postsResponse = await getUserPosts(userData.username);
          setPosts(postsResponse.data?.posts || []);
        } catch (postsError) {
          console.error('Error fetching user posts:', postsError);
          setPosts([]); // Set empty array on error
        }
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error);

      // Handle authentication errors (including HTML login page)
      if (error.name === 'AuthenticationError') {
        setError(error.message || 'Please log in to view your profile');
        // Token is already cleared by the API interceptor
      } else if (error.name === 'NetworkError') {
        setError(error.message || 'Network connection failed. Please check your internet connection.');
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        setError('Authentication failed. Please log in again.');
        // Optionally clear the invalid token
        await AsyncStorage.removeItem('token');
      } else if (error.response?.status === 404) {
        setError('Profile not found.');
      } else if (!error.response) {
        setError('Network error. Please check your connection.');
      } else {
        setError('Failed to load profile. Please try again.');
      }

      // Set profile to null to show error state
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (id: number) => {
    setPosts((prev) => prev.map(p => p.id === id ? { ...p, likes_count: (p.likes_count || 0) + (p.liked ? -1 : 1), liked: !p.liked } as any : p));
    try {
      const res = await likePost(id);
      const total = res?.data?.total_likes;
      const liked = res?.data?.liked;
      setPosts((prev) => prev.map(p => p.id === id ? { ...p, likes_count: typeof total === 'number' ? total : p.likes_count, liked: typeof liked === 'boolean' ? liked : p.liked } as any : p));
    } catch (e) {
      setPosts((prev) => prev.map(p => p.id === id ? { ...p, likes_count: (p.likes_count || 0) + (p.liked ? -1 : 1), liked: !p.liked } as any : p));
    }
  };

  const handleSave = async (id: number) => {
    setPosts((prev) => prev.map(p => p.id === id ? { ...p, saves_count: (p.saves_count || 0) + (p.saved ? -1 : 1), saved: !p.saved } as any : p));
    try {
      const res = await savePost(id);
      const total = res?.data?.total_saves;
      const saved = res?.data?.saved;
      setPosts((prev) => prev.map(p => p.id === id ? { ...p, saves_count: typeof total === 'number' ? total : p.saves_count, saved: typeof saved === 'boolean' ? saved : p.saved } as any : p));
    } catch (e) {
      setPosts((prev) => prev.map(p => p.id === id ? { ...p, saves_count: (p.saves_count || 0) + (p.saved ? -1 : 1), saved: !p.saved } as any : p));
    }
  };

  const handlePostPress = (post: Post) => {
    router.push({ pathname: '/screens/PostDetail', params: { post: JSON.stringify(post) } });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchProfile();
      if (profile) {
        await fetchFriendsData(profile.user.id);
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchFriendsData = async (userId: number) => {
    try {
      const [friendsResponse, requestsResponse] = await Promise.all([
        getFriendsList(userId),
        getFriendRequests(userId)
      ]);
      
      if (friendsResponse.data?.success) {
        setFriends(friendsResponse.data?.friends || []);
        setFriendsCount(friendsResponse.data?.count || 0);
        // For now, followers count is same as friends count (mutual follows)
        setFollowersCount(friendsResponse.data?.count || 0);
      } else {
        console.error('Friends list error:', friendsResponse.data?.error);
        setFriends([]);
        setFriendsCount(0);
        setFollowersCount(0);
      }

      if (requestsResponse.data?.success) {
        setFriendRequests(requestsResponse.data?.requests || []);
      } else {
        console.error('Friend requests error:', requestsResponse.data?.error);
        setFriendRequests([]);
      }
    } catch (error) {
      console.error('Error fetching friends data:', error);
      setFriends([]);
      setFriendRequests([]);
      setFriendsCount(0);
      setFollowersCount(0);
    }
  };

  const handleFollow = async () => {
    if (!profile) return;
    
    try {
      await followUnfollow(profile.id);
      setIsFollowing(!isFollowing);
      Alert.alert('Success', isFollowing ? 'Unfollowed successfully' : 'Followed successfully');
    } catch (error) {
      console.error('Follow error:', error);
      Alert.alert('Error', 'Failed to update follow status');
    }
  };

  const handleSendFriendRequest = async () => {
    if (!profile) return;
    
    try {
      const response = await sendFriendRequest(profile.user.id);
      if (response.data?.success) {
        setHasSentRequest(true);
        Alert.alert('Success', response.data.message || 'Friend request sent!');
      } else {
        Alert.alert('Error', response.data?.error || 'Failed to send friend request');
      }
    } catch (error: any) {
      console.error('Friend request error:', error);
      const errorMessage = error.response?.data?.error || 'Failed to send friend request';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleAcceptFriendRequest = async (requestId: number) => {
    try {
      const response = await acceptFriendRequest(requestId);
      if (response.data?.success) {
        // Refresh friends data
        if (profile) {
          await fetchFriendsData(profile.user.id);
        }
        Alert.alert('Success', response.data.message || 'Friend request accepted!');
      } else {
        Alert.alert('Error', response.data?.error || 'Failed to accept friend request');
      }
    } catch (error: any) {
      console.error('Accept friend request error:', error);
      const errorMessage = error.response?.data?.error || 'Failed to accept friend request';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleCancelFriendRequest = async () => {
    if (!profile) return;
    
    try {
      const response = await cancelFriendRequest(profile.user.id);
      if (response.data?.success) {
        setHasSentRequest(false);
        Alert.alert('Success', response.data.message || 'Friend request cancelled');
      } else {
        Alert.alert('Error', response.data?.error || 'Failed to cancel friend request');
      }
    } catch (error: any) {
      console.error('Cancel friend request error:', error);
      const errorMessage = error.response?.data?.error || 'Failed to cancel friend request';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleRemoveFriend = async () => {
    if (!profile) return;
    
    try {
      const response = await removeFriend(profile.user.id);
      if (response.data?.success) {
        setIsFriend(false);
        // Refresh friends data
        await fetchFriendsData(profile.user.id);
        Alert.alert('Success', response.data.message || 'Friend removed');
      } else {
        Alert.alert('Error', response.data?.error || 'Failed to remove friend');
      }
    } catch (error: any) {
      console.error('Remove friend error:', error);
      const errorMessage = error.response?.data?.error || 'Failed to remove friend';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleShowFriends = async () => {
    if (!profile) return;
    
    try {
      const response = await getFriendsList(profile.user.id);
      if (response.data?.success) {
        setFriendsList(response.data?.friends || []);
        setShowFriendsModal(true);
      } else {
        Alert.alert('Error', response.data?.error || 'Failed to load friends list');
      }
    } catch (error: any) {
      console.error('Error fetching friends:', error);
      const errorMessage = error.response?.data?.error || 'Failed to load friends list';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleShowFollowers = () => {
    // For now, followers are the same as friends (mutual follows)
    // In a real app, you'd have separate followers/following APIs
    setFollowersList(friends);
    setShowFollowersModal(true);
  };

  const getInitials = (firstName?: string, lastName?: string, username?: string) => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    if (firstName) {
      return firstName.charAt(0).toUpperCase();
    }
    if (lastName) {
      return lastName.charAt(0).toUpperCase();
    }
    if (username) {
      return username.charAt(0).toUpperCase();
    }
    return '?';
  };

  const getFullName = (firstName?: string, lastName?: string, username?: string) => {
    // Debug logging to see what data we have
    console.log('getFullName called with:', { firstName, lastName, username });

    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    if (firstName) {
      return firstName;
    }
    if (lastName) {
      return lastName;
    }
    // If no names available, fall back to username but format it nicely
    if (username) {
      // Capitalize first letter of username
      return username.charAt(0).toUpperCase() + username.slice(1);
    }
    return 'User';
  };

  const handleDeclineFriendRequest = async (requestId: number) => {
    try {
      const response = await declineFriendRequest(requestId);
      if (response.data?.success) {
        // Refresh friend requests
        if (profile) {
          await fetchFriendsData(profile.user.id);
        }
        Alert.alert('Success', response.data.message || 'Friend request declined');
      } else {
        Alert.alert('Error', response.data?.error || 'Failed to decline friend request');
      }
    } catch (error: any) {
      console.error('Decline friend request error:', error);
      const errorMessage = error.response?.data?.error || 'Failed to decline friend request';
      Alert.alert('Error', errorMessage);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors[scheme ?? 'light'].background }}>
        <Text style={{ color: Colors[scheme ?? 'light'].text }}>Loading profile...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors[scheme ?? 'light'].background, padding: 20 }}>
        <Text style={{ color: Colors[scheme ?? 'light'].text, marginBottom: 20, textAlign: 'center', fontSize: 16 }}>
          {error}
        </Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity
            onPress={() => {
              setError(null);
              checkAuthentication();
            }}
            style={{ backgroundColor: Colors[scheme ?? 'light'].tint, padding: 12, borderRadius: 8, minWidth: 80 }}
          >
            <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>Retry</Text>
          </TouchableOpacity>
          {(error.includes('log in') || error.includes('Authentication')) && (
            <TouchableOpacity
              onPress={() => router.push('/screens/Login')}
              style={{ backgroundColor: '#007AFF', padding: 12, borderRadius: 8, minWidth: 100 }}
            >
              <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>Go to Login</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors[scheme ?? 'light'].background }}>
        <Text style={{ color: Colors[scheme ?? 'light'].text }}>Profile not found</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors[scheme ?? 'light'].background }}>
      {(() => { console.log('Profile render - profile state:', profile); return null; })()}
      <ScrollView 
        style={{ flex: 1, padding: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors[scheme ?? 'light'].tint]}
            tintColor={Colors[scheme ?? 'light'].tint}
          />
        }
      >
        {/* Profile Header */}
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          {/* Profile Picture */}
          <View style={{ 
            width: 100, 
            height: 100, 
            borderRadius: 50, 
            backgroundColor: Colors[scheme ?? 'light'].tint,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16
          }}>
            {profile?.image ? (
              <ImageWithFallback 
                source={{ uri: `${API_BASE_URL}${profile.image}` }}
                fallbackText={getInitials(profile?.user?.first_name, profile?.user?.last_name, profile?.user?.username)}
                style={{ width: 100, height: 100, borderRadius: 50 }}
              />
            ) : (
              <Text style={{ 
                fontSize: 32, 
                fontWeight: 'bold', 
                color: 'white',
                textAlign: 'center'
              }}>
                {getInitials(profile?.user?.first_name, profile?.user?.last_name, profile?.user?.username)}
              </Text>
            )}
          </View>

          {/* Full Name */}
          <Text style={{ fontSize: 20, fontWeight: '600', color: Colors[scheme ?? 'light'].text, marginBottom: 4 }}>
            {profile ? getFullName(profile?.user?.first_name, profile?.user?.last_name, profile?.user?.username) : 'Loading...'}
          </Text>

          {/* Username */}
          <Text style={{ 
            fontSize: 16, 
            color: Colors[scheme ?? 'light'].text, 
            opacity: 0.7,
            marginBottom: 8
          }}>
            @{profile?.user?.username || 'unknown'}
          </Text>

          {/* Bio */}
          <Text style={{ 
            color: Colors[scheme ?? 'light'].text, 
            textAlign: 'center', 
            marginBottom: 16,
            fontSize: 16
          }}>
            {profile?.bio || 'No bio available'}
          </Text>

          {/* Stats */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 20 }}>
            <TouchableOpacity style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: Colors[scheme ?? 'light'].text }}>
                {posts.length}
              </Text>
              <Text style={{ color: Colors[scheme ?? 'light'].text }}>Posts</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={{ alignItems: 'center' }}
              onPress={handleShowFriends}
            >
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: Colors[scheme ?? 'light'].text }}>
                {friendsCount}
              </Text>
              <Text style={{ color: Colors[scheme ?? 'light'].text }}>Friends</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={{ alignItems: 'center' }}
              onPress={handleShowFollowers}
            >
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: Colors[scheme ?? 'light'].text }}>
                {followersCount}
              </Text>
              <Text style={{ color: Colors[scheme ?? 'light'].text }}>Followers</Text>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
            {isOwnProfile ? (
              <TouchableOpacity 
                onPress={() => {}} 
                style={{ 
                  backgroundColor: Colors[scheme ?? 'light'].tint, 
                  paddingHorizontal: 20, 
                  paddingVertical: 10, 
                  borderRadius: 8,
                  flex: 1
                }}
              >
                <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>Edit Profile</Text>
              </TouchableOpacity>
            ) : (
              <>
                {isFriend ? (
                  <TouchableOpacity 
                    onPress={handleRemoveFriend} 
                    style={{ 
                      backgroundColor: '#FF3B30', 
                      paddingHorizontal: 20, 
                      paddingVertical: 10, 
                      borderRadius: 8,
                      flex: 1
                    }}
                  >
                    <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>Remove Friend</Text>
                  </TouchableOpacity>
                ) : hasSentRequest ? (
                  <TouchableOpacity 
                    onPress={handleCancelFriendRequest} 
                    style={{ 
                      backgroundColor: '#8E8E93', 
                      paddingHorizontal: 20, 
                      paddingVertical: 10, 
                      borderRadius: 8,
                      flex: 1
                    }}
                  >
                    <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>Request Sent</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    onPress={handleSendFriendRequest} 
                    style={{ 
                      backgroundColor: '#007AFF', 
                      paddingHorizontal: 20, 
                      paddingVertical: 10, 
                      borderRadius: 8,
                      flex: 1
                    }}
                  >
                    <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>Add Friend</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>

          {/* Follow Button - Only show for other users' profiles */}
          {!isOwnProfile && (
            <TouchableOpacity 
              onPress={handleFollow} 
              style={{ 
                backgroundColor: isFollowing ? '#8E8E93' : '#007AFF', 
                paddingHorizontal: 30, 
                paddingVertical: 12, 
                borderRadius: 8,
                marginBottom: 20,
                width: '100%'
              }}
            >
              <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>
                {isFollowing ? 'Unfollow' : 'Follow'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Friend Requests Section - Only show for own profile */}
        {isOwnProfile && friendRequests.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: Colors[scheme ?? 'light'].text, marginBottom: 10 }}>
              Friend Requests
            </Text>
            {friendRequests.map((request) => (
              <View key={request.id.toString()} style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                backgroundColor: Colors[scheme ?? 'light'].secondary,
                padding: 12,
                borderRadius: 8,
                marginBottom: 8
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: 20, 
                    backgroundColor: Colors[scheme ?? 'light'].tint,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 12
                  }}>
                    {request.from_user.image ? (
                      <Image 
                        source={{ uri: `${API_BASE_URL}${request.from_user.image}` }} 
                        style={{ width: 40, height: 40, borderRadius: 20 }} 
                      />
                    ) : (
                      <Text style={{ fontSize: 14, fontWeight: 'bold', color: 'white' }}>
                        {getInitials(request.from_user.first_name, request.from_user.last_name, request.from_user.username)}
                      </Text>
                    )}
                  </View>
                  <View>
                    <Text style={{ color: Colors[scheme ?? 'light'].text, fontWeight: '600' }}>
                      {getFullName(request.from_user.first_name, request.from_user.last_name, request.from_user.username)}
                    </Text>
                    <Text style={{ color: Colors[scheme ?? 'light'].text, opacity: 0.7, fontSize: 12 }}>
                      @{request.from_user.username}
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity 
                    onPress={() => handleAcceptFriendRequest(request.id)}
                    style={{ 
                      backgroundColor: '#34C759', 
                      paddingHorizontal: 16, 
                      paddingVertical: 8, 
                      borderRadius: 6
                    }}
                  >
                    <Text style={{ color: 'white', fontWeight: '600' }}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => handleDeclineFriendRequest(request.id)}
                    style={{ 
                      backgroundColor: '#FF3B30', 
                      paddingHorizontal: 16, 
                      paddingVertical: 8, 
                      borderRadius: 6
                    }}
                  >
                    <Text style={{ color: 'white', fontWeight: '600' }}>Decline</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Posts Section */}
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: Colors[scheme ?? 'light'].text, marginBottom: 16 }}>
          Posts
        </Text>
        
        {posts.length > 0 ? (
          posts.map((post) => (
            <PostItem
              key={post.id}
              post={post}
              onLike={handleLike}
              onSave={handleSave}
              onPress={handlePostPress}
              showSaveButton={true}
            />
          ))
        ) : (
          <View style={{ alignItems: 'center', marginTop: 48, marginBottom: 48 }}>
            <Animated.View style={{ transform: [{ scale: pulse }] }}>
              <Image source={require('../../assets/images/icon.png')} style={{ width: 52, height: 52, opacity: 0.8 }} />
            </Animated.View>
            <Text style={{ marginTop: 10, color: Colors[scheme ?? 'light'].icon, fontWeight: '600' }}>No posts yet</Text>
            <Text style={{ marginTop: 4, color: Colors[scheme ?? 'light'].icon }}>Share your first whisper…</Text>
          </View>
        )}
      </ScrollView>

      {/* Friends Modal */}
      <Modal
        visible={showFriendsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFriendsModal(false)}
      >
        <View style={{ 
          flex: 1, 
          backgroundColor: 'rgba(0,0,0,0.5)', 
          justifyContent: 'flex-end' 
        }}>
          <View style={{ 
            backgroundColor: Colors[scheme ?? 'light'].background,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: '70%',
            padding: 20
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: Colors[scheme ?? 'light'].text }}>
                Friends ({friendsList.length})
              </Text>
              <TouchableOpacity onPress={() => setShowFriendsModal(false)}>
                <Ionicons name="close" size={24} color={Colors[scheme ?? 'light'].text} />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={friendsList}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={{ 
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    padding: 12,
                    backgroundColor: Colors[scheme ?? 'light'].secondary,
                    borderRadius: 8,
                    marginBottom: 8
                  }}
                  onPress={() => {
                    setShowFriendsModal(false);
                    // Navigate to friend's profile
                    router.push({ pathname: '/screens/PublicProfile' as any, params: { userId: item.id } });
                  }}
                >
                  <View style={{ 
                    width: 50, 
                    height: 50, 
                    borderRadius: 25, 
                    backgroundColor: Colors[scheme ?? 'light'].tint,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 12
                  }}>
                    {item.image ? (
                      <Image 
                        source={{ uri: `${API_BASE_URL}${item.image}` }} 
                        style={{ width: 50, height: 50, borderRadius: 25 }} 
                      />
                    ) : (
                      <Text style={{ fontSize: 18, fontWeight: 'bold', color: 'white' }}>
                        {getInitials(item.first_name, item.last_name, item.username)}
                      </Text>
                    )}
                  </View>
                  <View>
                    <Text style={{ color: Colors[scheme ?? 'light'].text, fontWeight: '600', fontSize: 16 }}>
                      {getFullName(item.first_name, item.last_name, item.username)}
                    </Text>
                    <Text style={{ color: Colors[scheme ?? 'light'].text, opacity: 0.7 }}>
                      @{item.username}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={{ alignItems: 'center', padding: 40 }}>
                  <Ionicons name="people" size={48} color={Colors[scheme ?? 'light'].icon} />
                  <Text style={{ color: Colors[scheme ?? 'light'].text, marginTop: 16, textAlign: 'center' }}>
                    No friends yet
                  </Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Followers Modal */}
      <Modal
        visible={showFollowersModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFollowersModal(false)}
      >
        <View style={{ 
          flex: 1, 
          backgroundColor: 'rgba(0,0,0,0.5)', 
          justifyContent: 'flex-end' 
        }}>
          <View style={{ 
            backgroundColor: Colors[scheme ?? 'light'].background,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: '70%',
            padding: 20
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: Colors[scheme ?? 'light'].text }}>
                Followers ({followersList.length})
              </Text>
              <TouchableOpacity onPress={() => setShowFollowersModal(false)}>
                <Ionicons name="close" size={24} color={Colors[scheme ?? 'light'].text} />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={followersList}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={{ 
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    padding: 12,
                    backgroundColor: Colors[scheme ?? 'light'].secondary,
                    borderRadius: 8,
                    marginBottom: 8
                  }}
                  onPress={() => {
                    setShowFollowersModal(false);
                    // Navigate to follower's profile
                    router.push({ pathname: '/screens/PublicProfile' as any, params: { userId: item.id } });
                  }}
                >
                  <View style={{ 
                    width: 50, 
                    height: 50, 
                    borderRadius: 25, 
                    backgroundColor: Colors[scheme ?? 'light'].tint,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 12
                  }}>
                    {item.image ? (
                      <Image 
                        source={{ uri: `${API_BASE_URL}${item.image}` }} 
                        style={{ width: 50, height: 50, borderRadius: 25 }} 
                      />
                    ) : (
                      <Text style={{ fontSize: 18, fontWeight: 'bold', color: 'white' }}>
                        {getInitials(item.first_name, item.last_name, item.username)}
                      </Text>
                    )}
                  </View>
                  <View>
                    <Text style={{ color: Colors[scheme ?? 'light'].text, fontWeight: '600', fontSize: 16 }}>
                      {getFullName(item.first_name, item.last_name, item.username)}
                    </Text>
                    <Text style={{ color: Colors[scheme ?? 'light'].text, opacity: 0.7 }}>
                      @{item.username}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={{ alignItems: 'center', padding: 40 }}>
                  <Ionicons name="people" size={48} color={Colors[scheme ?? 'light'].icon} />
                  <Text style={{ color: Colors[scheme ?? 'light'].text, marginTop: 16, textAlign: 'center' }}>
                    No followers yet
                  </Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Profile;
