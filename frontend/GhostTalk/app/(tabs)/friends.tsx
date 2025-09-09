import React, { useEffect, useState } from 'react';
import { View, FlatList } from 'react-native';
import { getFriendsList, Profile } from '../api';
import ProfileCard from '../../components/ProfileCard';

export default function FriendsScreen({ navigation }: any) {
  const [friends, setFriends] = useState<Profile[]>([]);

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      // Assume user id is 1 for now
      const response = await getFriendsList(1);
      setFriends(response.data.friends.map((f: any) => ({ ...f, user: f })));
    } catch (error) {
      console.error(error);
    }
  };

  const handleProfilePress = (profile: Profile) => {
    navigation.navigate('screens/UserProfile', { profile });
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
}
