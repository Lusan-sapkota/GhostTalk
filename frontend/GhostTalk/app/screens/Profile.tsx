import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { getProfile, getUserPosts, Post, Profile as ProfileType } from '../api';
import PostItem from '../../components/PostItem';

const Profile: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    fetchProfile();
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
    // Implement like
  };

  const handleSave = async (id: number) => {
    // Implement save
  };

  const handlePostPress = (post: Post) => {
    navigation.navigate('PostDetail', { post });
  };

  if (!profile) return <Text>Loading...</Text>;

  return (
    <View style={{ flex: 1, padding: 10 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>{profile.user.username}</Text>
      <Text>{profile.bio}</Text>
      <TouchableOpacity onPress={() => navigation.navigate('EditProfile')} style={{ backgroundColor: 'blue', padding: 10, marginVertical: 10 }}>
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
      />
    </View>
  );
};

export default Profile;
