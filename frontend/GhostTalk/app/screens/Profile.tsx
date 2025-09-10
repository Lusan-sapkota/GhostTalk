import React, { useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Animated, Easing, Image } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getProfile, getUserPosts, Post, Profile as ProfileType, likePost, savePost } from '../api';
import PostItem from '../../components/PostItem';
import { useRouter } from 'expo-router';

const Profile: React.FC = () => {
  const router = useRouter();
  const scheme = useColorScheme();
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fetchProfile();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true })
      ])
    ).start();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await getProfile();
      setProfile(response.data.profile);
      const postsResponse = await getUserPosts(response.data.user.username);
      setPosts(postsResponse.data.posts);
    } catch (error) {
      console.error(error);
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
    } finally {
      setRefreshing(false);
    }
  };

  if (!profile) return <Text>Loading...</Text>;

  return (
    <View style={{ flex: 1, padding: 10, backgroundColor: Colors[scheme ?? 'light'].background }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>{profile.user.username}</Text>
      <Text>{profile.bio}</Text>
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
