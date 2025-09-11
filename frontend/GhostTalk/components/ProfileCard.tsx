import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Profile } from '../app/api';
import { API_BASE_URL } from '../app/api';
import { Ionicons } from '@expo/vector-icons';

interface ProfileCardProps {
  profile: Profile;
  onPress: (profile: Profile) => void;
  onFollow?: (id: number) => void;
  onEdit?: (profile: Profile) => void;
  showEdit?: boolean;
  showOnlineStatus?: boolean;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ 
  profile, 
  onPress, 
  onFollow, 
  onEdit, 
  showEdit = false,
  showOnlineStatus = true 
}) => {
  const scheme = useColorScheme();
  const tint = Colors[scheme ?? 'light'].tint;

  const getInitials = (firstName?: string, lastName?: string, username?: string) => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    if (firstName) {
      return firstName.charAt(0).toUpperCase();
    }
    if (lastName) {
      return lastName.charAt(0).toUpperCase();
    }
    if (username) {
      return username.charAt(0).toUpperCase();
    }
    return '?';
  };

  const initials = getInitials(profile?.user?.first_name, profile?.user?.last_name, profile?.user?.username);

  return (
    <TouchableOpacity onPress={() => onPress(profile)} style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: scheme === 'dark' ? '#222' : '#eee' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ position: 'relative', marginRight: 10 }}>
          {profile.image ? (
            <Image source={{ uri: `${API_BASE_URL}${profile.image}` }} style={{ width: 36, height: 36, borderRadius: 18 }} />
          ) : (
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: tint + '55', justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: 'white', fontWeight: '800' }}>{initials}</Text>
            </View>
          )}
          {showOnlineStatus && profile.is_online && (
            <View style={{ 
              position: 'absolute', 
              bottom: 0, 
              right: 0, 
              width: 12, 
              height: 12, 
              borderRadius: 6, 
              backgroundColor: '#4CAF50',
              borderWidth: 2,
              borderColor: scheme === 'dark' ? '#000' : '#fff'
            }} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontWeight: 'bold', color: Colors[scheme ?? 'light'].text, marginRight: 8 }}>
              {profile.user.first_name && profile.user.last_name 
                ? `${profile.user.first_name} ${profile.user.last_name}`
                : profile.user.username}
            </Text>
            {showOnlineStatus && profile.is_online && (
              <Ionicons name="ellipse" size={8} color="#4CAF50" />
            )}
          </View>
          <Text style={{ color: Colors[scheme ?? 'light'].icon, fontSize: 12 }}>
            @{profile.user.username}
          </Text>
          {!!profile.bio && <Text style={{ color: Colors[scheme ?? 'light'].icon, fontSize: 13, marginTop: 2 }}>{profile.bio}</Text>}
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
