import React from 'react';
import { View, Text, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function SettingsScreen() {
  const scheme = useColorScheme();
  const [postPrivacyFriendsOnly, setPostPrivacyFriendsOnly] = React.useState(true);
  const [showOnlineStatus, setShowOnlineStatus] = React.useState(true);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors[scheme ?? 'light'].background }}>
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: Colors[scheme ?? 'light'].text }}>Settings</Text>

        <View style={{ marginTop: 24, gap: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontSize: 16, fontWeight: '600', color: Colors[scheme ?? 'light'].text }}>Default post audience</Text>
              <Text style={{ color: Colors[scheme ?? 'light'].icon }}>{postPrivacyFriendsOnly ? 'Friends' : 'Public'}</Text>
            </View>
            <Switch value={postPrivacyFriendsOnly} onValueChange={setPostPrivacyFriendsOnly} />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontSize: 16, fontWeight: '600', color: Colors[scheme ?? 'light'].text }}>Show online status</Text>
              <Text style={{ color: Colors[scheme ?? 'light'].icon }}>{showOnlineStatus ? 'On' : 'Off'}</Text>
            </View>
            <Switch value={showOnlineStatus} onValueChange={setShowOnlineStatus} />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
