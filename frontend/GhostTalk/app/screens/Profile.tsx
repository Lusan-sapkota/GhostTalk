import React, { useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Animated, Easing, Image } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getProfile, getUserPosts, Post, Profile as ProfileType, likePost, savePost } from '../api';
import PostItem from '../../components/PostItem';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Profile: React.FC = () => {
  const router = useRouter();
  const scheme = useColorScheme();
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
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

      // Check if user is authenticated
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setError('Please log in to view your profile');
        setLoading(false);
        return;
      }

      const response = await getProfile();

      console.log('Profile API response:', response); // Debug log

      // Check if response and data exist
      if (!response || !response.data) {
        console.error('No response data received');
        return;
      }

      // Handle different possible response structures
      let profileData, userData;

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

      setProfile(combinedProfile);

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
    setError(null); // Clear any previous errors
    try {
      await fetchProfile();
    } finally {
      setRefreshing(false);
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
    <View style={{ flex: 1, padding: 10, backgroundColor: Colors[scheme ?? 'light'].background }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: Colors[scheme ?? 'light'].text }}>
        {profile?.user?.username || 'Unknown User'}
      </Text>
      <Text style={{ color: Colors[scheme ?? 'light'].text }}>
        {profile?.bio || 'No bio available'}
      </Text>
      <TouchableOpacity onPress={() => {}} style={{ backgroundColor: 'blue', padding: 10, marginVertical: 10 }}>
        <Text style={{ color: 'white', textAlign: 'center' }}>Edit Profile</Text>
      </TouchableOpacity>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <PostItem
            post={item}
            onLike={handleLike}
            onSave={handleSave}
            onPress={handlePostPress}
          />
        )}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 48 }}>
            <Animated.View style={{ transform: [{ scale: pulse }] }}>
              <Image source={require('../../assets/images/icon.png')} style={{ width: 52, height: 52, opacity: 0.8 }} />
            </Animated.View>
            <Text style={{ marginTop: 10, color: Colors[scheme ?? 'light'].icon, fontWeight: '600' }}>No posts yet</Text>
            <Text style={{ marginTop: 4, color: Colors[scheme ?? 'light'].icon }}>Share your first whisper…</Text>
          </View>
        }
      />
    </View>
  );
};

export default Profile;
