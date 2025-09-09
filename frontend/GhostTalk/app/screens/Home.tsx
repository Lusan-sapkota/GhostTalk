import React, { useEffect, useState } from 'react';
import { View, FlatList, Text } from 'react-native';
import { getFeedPosts, Post } from '../api';
import PostItem from '../../components/PostItem';

const Home: React.FC<{ navigation: any }> = ({ navigation }) => {
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
    navigation.navigate('PostDetail', { post });
  };

  return (
    <View style={{ flex: 1 }}>
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
};

export default Home;
