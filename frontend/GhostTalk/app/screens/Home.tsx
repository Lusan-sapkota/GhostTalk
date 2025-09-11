import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, Text, TouchableOpacity, RefreshControl, Alert, StyleSheet, Platform } from 'react-native';
import { getFeedPosts, Post, likePost, savePost, sharePost } from '../api';
import PostItem from '../../components/PostItem';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Home: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? 'light'];
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Small helper to convert hex to rgba with alpha (accepts #RGB, #RRGGBB)
  const toHexWithAlpha = (hex: string, alpha: number) => {
    try {
      const normalized = hex.replace('#', '').trim();
      let r = 0;
      let g = 0;
      let b = 0;

      if (normalized.length === 3) {
        r = parseInt(normalized[0] + normalized[0], 16);
        g = parseInt(normalized[1] + normalized[1], 16);
        b = parseInt(normalized[2] + normalized[2], 16);
      } else if (normalized.length === 6) {
        r = parseInt(normalized.slice(0, 2), 16);
        g = parseInt(normalized.slice(2, 4), 16);
        b = parseInt(normalized.slice(4, 6), 16);
      }

      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    } catch (e) {
      return hex; // fallback
    }
  };

  const fetchPosts = useCallback(async () => {
    try {
      const response = await getFeedPosts();
      setPosts(response.data.posts);
    } catch (error) {
      console.error(error);
    }
  }, []);

  type Props = {
    colors: {
      background: string;
      text: string;
      tint: string;
      tabIconDefault: string; // e.g. "#8E8E93"
    };
    handleCreatePost: () => void;
  };

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

  const handleSharePost = async (post: Post) => {
    try {
      const response = await sharePost(post.id);
      // Update the post's share count and shared status
      const totalShares = response?.data?.total_shares;
      const shared = response?.data?.shared;
      setPosts((prev) => prev.map(p => p.id === post.id ? { 
        ...p, 
        shares_count: typeof totalShares === 'number' ? totalShares : (p.shares_count || 0) + 1,
        shared: typeof shared === 'boolean' ? shared : true
      } as any : p));
      Alert.alert('Success', 'Post shared successfully!');
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to share post. Please try again.');
    }
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
  <View style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
    {/* What's on your mind section */}
    <TouchableOpacity onPress={handleCreatePost} style={[
      styles.card,
      {
        backgroundColor: colors.background,
        borderColor: toHexWithAlpha(colors.tabIconDefault, 0.19), // ~30/255
      }
    ]}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Ionicons name="create-outline" size={24} color={colors.tint} />
        <Text style={{ marginLeft: 12, fontSize: 16, fontWeight: '500', color: colors.text }}>
          What's on your mind?
        </Text>
      </View>
    </TouchableOpacity>

    {/* Separator line */}
    <View style={[
      styles.separator,
      {
        backgroundColor: toHexWithAlpha('#000000', 0.12), // subtle 12% line
        marginHorizontal: 12,
        marginBottom: 16,
      }
    ]} />
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

const styles = StyleSheet.create({
  card: {
    padding: 16,
    margin: 12,
    borderRadius: 12,
  borderWidth: StyleSheet.hairlineWidth,

    // Cross-platform shadow
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
        shadowColor: '#000000', // helps newer Android APIs
      },
      default: {},
    }),
  },
  separator: {
  height: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
  },
});

export default Home;
