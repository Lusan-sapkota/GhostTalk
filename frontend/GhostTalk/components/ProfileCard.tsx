import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Profile } from '../app/api';

interface ProfileCardProps {
  profile: Profile;
  onPress: (profile: Profile) => void;
  onFollow?: (id: number) => void;
  onEdit?: (profile: Profile) => void;
  showEdit?: boolean;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ profile, onPress, onFollow, onEdit, showEdit = false }) => {
  const scheme = useColorScheme();
  const initials = (profile?.user?.first_name?.[0] || profile?.user?.username?.[0] || 'U').toUpperCase();
  const tint = Colors[scheme ?? 'light'].tint;
  return (
    <TouchableOpacity onPress={() => onPress(profile)} style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: scheme === 'dark' ? '#222' : '#eee' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {profile.image ? (
          <Image source={{ uri: profile.image }} style={{ width: 36, height: 36, borderRadius: 18, marginRight: 10 }} />
        ) : (
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: tint + '55', justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
            <Text style={{ color: 'white', fontWeight: '800' }}>{initials}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: 'bold', color: Colors[scheme ?? 'light'].text }}>{profile.user.username}</Text>
          {!!profile.bio && <Text style={{ color: Colors[scheme ?? 'light'].icon }}>{profile.bio}</Text>}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {showEdit && onEdit && (
            <TouchableOpacity
              onPress={() => onEdit(profile)}
              style={{ padding: 8, marginRight: 8 }}
            >
              <Text style={{ color: tint, fontWeight: '600' }}>Edit</Text>
            </TouchableOpacity>
          )}
          {onFollow && (
            <TouchableOpacity onPress={() => onFollow(profile.id)} style={{ padding: 8 }}>
              <Text style={{ color: tint, fontWeight: '700' }}>Follow</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default ProfileCard;
