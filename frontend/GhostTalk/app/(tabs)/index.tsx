import React, { useEffect, useState } from 'react';
import { View, FlatList, Text, TouchableOpacity } from 'react-native';
import { getFeedPosts, Post } from '../api';
import PostItem from '../../components/PostItem';

export default function HomeScreen({ navigation }: any) {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    fetchPosts();
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
    <View style={{ flex: 1 }}>
      <TouchableOpacity onPress={() => navigation.navigate('screens/CreatePost')} style={{ backgroundColor: 'blue', padding: 10 }}>
        <Text style={{ color: 'white', textAlign: 'center' }}>Create Post</Text>
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
      />
    </View>
  );
}
