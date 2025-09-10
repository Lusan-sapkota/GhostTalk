import React, { useEffect, useRef, useState } from 'react';
import { View, FlatList, Text, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Animated, Easing } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getUserPosts, Post, likePost, savePost } from '../api';
import PostItem from '../../components/PostItem';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function MyPostsScreen() {
  const scheme = useColorScheme();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fetchUserData();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true })
      ])
    ).start();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        router.replace('/screens/Login');
        return;
      }

      const userRaw = await AsyncStorage.getItem('user');
      if (userRaw) {
        const user = JSON.parse(userRaw);
        setUsername(user.username);
        await fetchMyPosts(user.username);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchMyPosts = async (userUsername: string) => {
    try {
      const response = await getUserPosts(userUsername);
      setPosts(response?.data?.posts ?? []);
    } catch (error) {
      console.error('Error fetching my posts:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (username) {
        await fetchMyPosts(username);
      }
    } finally {
      setRefreshing(false);
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors[scheme ?? 'light'].background }}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: Colors[scheme ?? 'light'].icon + '20' }]}>
        <Ionicons
          name="arrow-back"
          size={24}
          color={Colors[scheme ?? 'light'].text}
          onPress={() => router.back()}
          style={{ marginRight: 16 }}
        />
        <Text style={[styles.headerTitle, { color: Colors[scheme ?? 'light'].text }]}>
          My Posts
        </Text>
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors[scheme ?? 'light'].tint}
          />
        }
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 48 }}>
            <Animated.View style={{ transform: [{ scale: pulse }] }}>
              <Ionicons name="document-text-outline" size={52} color={Colors[scheme ?? 'light'].icon} />
            </Animated.View>
            <Text style={{ marginTop: 10, color: Colors[scheme ?? 'light'].icon, fontWeight: '600' }}>
              No posts yet
            </Text>
            <Text style={{ marginTop: 4, color: Colors[scheme ?? 'light'].icon }}>
              Share your first whisper…
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
});
