import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getProfile, getUserPosts, Post, Profile as ProfileType } from '../api';
import PostItem from '../../components/PostItem';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? 'light'];
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        router.replace('/screens/Login');
        return;
      }
      await fetchProfile();
    })();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const response = await getProfile();
      // The API returns { user: {...}, profile: {...} }
      // We need to combine them into the expected Profile structure
      const combinedProfile = {
        id: response.data.profile.id,
        user: response.data.user,
        is_online: response.data.profile.is_online,
        bio: response.data.profile.bio,
        image: response.data.profile.image
      };
      setProfile(combinedProfile);
      const username = response.data.user.username;
      if (username) {
        const postsResponse = await getUserPosts(username);
        setPosts(postsResponse.data.posts ?? []);
      } else {
        setPosts([]);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleLike = async (id: number) => {
    // Implement like
  };

  const handleSave = async (id: number) => {
    // Implement save
  };

  const handlePostPress = (post: Post) => {
    router.push({ pathname: '/screens/PostDetail', params: { post: JSON.stringify(post) } });
  };

  if (!profile) return <Text>Loading...</Text>;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Profile
        </Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => {}}
            style={[styles.editButton, { backgroundColor: colors.tint }]}
          >
            <Ionicons name="settings-outline" size={16} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.text }}>{profile?.user?.username || 'Unknown User'}</Text>
        <Text style={{ color: colors.icon, marginTop: 4 }}>{profile.bio}</Text>
        <TouchableOpacity onPress={() => {}} style={{ backgroundColor: colors.tint, padding: 12, marginVertical: 16, borderRadius: 8 }}>
          <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>Edit Profile</Text>
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
  editButton: {
    padding: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
