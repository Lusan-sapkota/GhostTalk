import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, Text, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { getFeedPosts, Post, likePost, savePost } from '../api';
import PostItem from '../../components/PostItem';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useRouter, useFocusEffect } from 'expo-router';

const Home: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? 'light'];
  const router = useRouter();

  const fetchPosts = useCallback(async () => {
    try {
      const response = await getFeedPosts();
      setPosts(response.data.posts);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Refresh posts when screen comes into focus (e.g., returning from CreatePost)
  useFocusEffect(
    useCallback(() => {
      fetchPosts();
    }, [fetchPosts])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  }, [fetchPosts]);

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
    navigation.navigate('PostDetail', { post });
  };

  const handleEditPost = (post: Post) => {
    // Navigate to edit post screen
    router.push({ pathname: '/screens/CreatePost', params: { editPost: JSON.stringify(post) } });
  };

  const handleSharePost = (post: Post) => {
    // Implement share functionality
    Alert.alert('Share', 'Share functionality coming soon!');
  };

  const handleDeletePost = (post: Post) => {
    // Implement delete functionality
    Alert.alert('Delete', 'Delete functionality will be implemented!');
  };

  const handlePrivacyPost = (post: Post) => {
    // Implement privacy functionality
    Alert.alert('Privacy', 'Privacy settings will be implemented!');
  };

  const handleCreatePost = () => {
    router.push('/screens/CreatePost');
  };

  const renderHeader = () => (
    <View>
      {/* What's on your mind section */}
      <TouchableOpacity
        onPress={handleCreatePost}
        style={{
          backgroundColor: colors.background,
          padding: 16,
          margin: 12,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.tabIconDefault + '30',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="create-outline" size={24} color={colors.tint} />
          <Text style={{
            marginLeft: 12,
            fontSize: 16,
            fontWeight: '500',
            color: colors.text
          }}>
            What's on your mind?
          </Text>
        </View>
      </TouchableOpacity>

      {/* Separator line */}
      <View style={{
        height: 1,
        backgroundColor: colors.tabIconDefault + '20',
        marginHorizontal: 12,
        marginBottom: 8
      }} />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
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
            showSaveButton={true}
          />
        )}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.tint]}
            tintColor={colors.tint}
          />
        }
      />
    </View>
  );
};

export default Home;
