import React, { useEffect, useState } from 'react';
import { View, FlatList } from 'react-native';
import { getFriendsList, Profile } from '../api';
import ProfileCard from '../../components/ProfileCard';

const Friends: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [friends, setFriends] = useState<Profile[]>([]);

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      // Assume user id is 1 for now
      const response = await getFriendsList(1);
      setFriends(response.data.friends.map((f: any) => ({
        id: f.id,
        user: {
          id: f.id,
          username: f.username,
          first_name: f.first_name,
          last_name: f.last_name,
          email: f.email
        },
        is_online: f.is_online || false,
        bio: f.bio,
        image: f.image
      })));
    } catch (error) {
      console.error(error);
    }
  };

  const handleProfilePress = (profile: Profile) => {
    navigation.navigate('UserProfile', { profile });
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={friends}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <ProfileCard profile={item} onPress={handleProfilePress} />
        )}
      />
    </View>
  );
};

export default Friends;
