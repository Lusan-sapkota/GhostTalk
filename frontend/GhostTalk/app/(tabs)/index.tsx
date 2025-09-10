import React, { useEffect, useState } from 'react';
import { View, FlatList, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFeedPosts, Post, likePost, savePost } from '../api';
import PostItem from '../../components/PostItem';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const scheme = useColorScheme();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const pulse = useRef(new Animated.Value(1)).current;
  const [userInitials, setUserInitials] = useState<string>('U');

  useEffect(() => {
    (async () => {
      const t = await AsyncStorage.getItem('token');
      if (!t) {
        router.replace('/screens/Login');
        return;
      }

      // Only fetch posts if user is authenticated
      await fetchPosts();

      const userRaw = await AsyncStorage.getItem('user');
      if (userRaw) {
        try {
          const u = JSON.parse(userRaw);
          const initials = (u?.first_name?.[0] || u?.username?.[0] || 'U').toUpperCase();
          setUserInitials(initials);
        } catch {}
      }
    })();

    // start pulse for empty state
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    ).start();

    return () => {
      // Cleanup animation on unmount
      pulse.stopAnimation();
    };
  }, []);

  const fetchPosts = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.warn('No token available, skipping fetchPosts');
        return;
      }
      const response = await getFeedPosts();
      setPosts(response?.data?.posts ?? []);
    } catch (error) {
      console.error('Error fetching posts:', error);
      // If we get a 401, the interceptor should handle token refresh
      // If refresh fails, user will be logged out
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchPosts();
    } finally {
      setRefreshing(false);
    }
  };

  const handleLike = async (id: number) => {
    // optimistic update
    setPosts((prev) => prev.map(p => p.id === id ? { ...p, likes_count: (p.likes_count || 0) + (p.liked ? -1 : 1), liked: !p.liked } as any : p));
    try {
      const res = await likePost(id);
      const total = res?.data?.total_likes;
      const liked = res?.data?.liked;
      setPosts((prev) => prev.map(p => p.id === id ? { ...p, likes_count: typeof total === 'number' ? total : p.likes_count, liked: typeof liked === 'boolean' ? liked : p.liked } as any : p));
    } catch (e) {
      // rollback
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

  return (
    <View style={{ flex: 1, backgroundColor: Colors[scheme ?? 'light'].background }}>

      {/* Composer */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingTop: 10, gap: 10 }}>
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: Colors[scheme ?? 'light'].tint + '55', justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: 'white', fontWeight: '700' }}>{userInitials}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/screens/CreatePost')} style={{ flex: 1 }}>
          <View style={{ backgroundColor: scheme === 'dark' ? '#222' : '#f0f2f5', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 20 }}>
            <Text style={{ color: Colors[scheme ?? 'light'].icon }}>What's on your mind?</Text>
          </View>
        </TouchableOpacity>
      </View>
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
            <Text style={{ marginTop: 10, color: Colors[scheme ?? 'light'].icon, fontWeight: '600' }}>No whispers yet</Text>
            <Text style={{ marginTop: 4, color: Colors[scheme ?? 'light'].icon }}>Start the conversation…</Text>
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
  createButton: {
    padding: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
