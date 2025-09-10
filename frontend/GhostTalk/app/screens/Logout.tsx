import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { logoutUser, authUtils } from '../api';
import { useRouter } from 'expo-router';

export default function LogoutScreen() {
  const scheme = useColorScheme();
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        await logoutUser();
      } catch {}
      await authUtils.clearAuthData();
      router.replace('/screens/Login');
    })();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors[scheme ?? 'light'].background, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator />
      <Text style={{ marginTop: 12, color: Colors[scheme ?? 'light'].text }}>Logging out…</Text>
    </SafeAreaView>
  );
}
