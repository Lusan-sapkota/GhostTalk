import React, { useEffect, useState } from 'react';
import { View, FlatList, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFeedPosts, Post } from '../api';
import PostItem from '../../components/PostItem';

export default function HomeScreen({ navigation }: any) {
  const scheme = useColorScheme();
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    fetchPosts();
    (async () => {
      const t = await AsyncStorage.getItem('token');
      if (!t) {
        navigation.replace('screens/Login');
      }
    })();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await getFeedPosts();
      setPosts(response.data.posts);
    } catch (error) {
      console.error(error);
    }
  };

  const handleLike = async (id: number) => {
    // Implement like
  };

  const handleSave = async (id: number) => {
    // Implement save
  };

  const handlePostPress = (post: Post) => {
    navigation.navigate('screens/PostDetail', { post });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors[scheme ?? 'light'].background }}>
      <View style={{ flex: 1 }}>
      <TouchableOpacity onPress={() => navigation.navigate('screens/CreatePost')} style={{ backgroundColor: Colors[scheme ?? 'light'].primary, padding: 12, margin: 12, borderRadius: 12 }}>
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>Create Post ✍️</Text>
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
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 40, color: Colors[scheme ?? 'light'].icon }}>No posts yet.</Text>}
      />
      </View>
    </SafeAreaView>
  );
}
