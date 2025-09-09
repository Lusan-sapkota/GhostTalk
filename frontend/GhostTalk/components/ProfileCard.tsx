import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Profile } from '../app/api';

interface ProfileCardProps {
  profile: Profile;
  onPress: (profile: Profile) => void;
  onFollow?: (id: number) => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ profile, onPress, onFollow }) => {
  return (
    <TouchableOpacity onPress={() => onPress(profile)} style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: '#ccc' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Image source={{ uri: profile.image || 'https://via.placeholder.com/40' }} style={{ width: 40, height: 40, borderRadius: 20, marginRight: 10 }} />
        <View>
          <Text style={{ fontWeight: 'bold' }}>{profile.user.username}</Text>
          <Text>{profile.bio}</Text>
        </View>
        {onFollow && (
          <TouchableOpacity onPress={() => onFollow(profile.id)} style={{ marginLeft: 'auto' }}>
            <Text>Follow</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default ProfileCard;
