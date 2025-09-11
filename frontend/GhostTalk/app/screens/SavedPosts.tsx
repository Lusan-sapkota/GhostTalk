import React, { useEffect, useRef, useState } from 'react';
import { View, FlatList, Text, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Animated, Easing } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getSavedPosts, Post, likePost, savePost } from '../api';
import PostItem from '../../components/PostItem';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SavedPostsScreen() {
  const scheme = useColorScheme();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fetchSavedPosts();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true })
      ])
    ).start();
  }, []);

  const fetchSavedPosts = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        router.replace('/screens/Login');
        return;
      }
      const response = await getSavedPosts();
      setPosts(response?.data?.saved_posts ?? []);
    } catch (error) {
      console.error('Error fetching saved posts:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchSavedPosts();
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

  const handleEditPost = (post: Post) => {
    router.push({ pathname: '/screens/CreatePost', params: { editPost: JSON.stringify(post) } });
  };

  const handleSharePost = (post: Post) => {
    // Implement share functionality
    alert('Share functionality coming soon!');
  };

  const handleDeletePost = (post: Post) => {
    // Implement delete functionality
    alert('Delete functionality will be implemented!');
  };

  const handlePrivacyPost = (post: Post) => {
    // Implement privacy functionality
    alert('Privacy settings will be implemented!');
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
          Saved Posts
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
            onEdit={handleEditPost}
            onShare={handleSharePost}
            onDelete={handleDeletePost}
            onPrivacy={handlePrivacyPost}
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
              <Ionicons name="bookmark-outline" size={52} color={Colors[scheme ?? 'light'].icon} />
            </Animated.View>
            <Text style={{ marginTop: 10, color: Colors[scheme ?? 'light'].icon, fontWeight: '600' }}>
              No saved posts yet
            </Text>
            <Text style={{ marginTop: 4, color: Colors[scheme ?? 'light'].icon }}>
              Save posts to read them later
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
