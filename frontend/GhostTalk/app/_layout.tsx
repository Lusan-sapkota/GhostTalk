import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authUtils } from './api';
import React from 'react';
import 'react-native-reanimated';

import '../global.css';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { AuthProvider } from '../components/AuthContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const [isAuthed, setIsAuthed] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    (async () => {
      const isAuthenticated = await authUtils.isAuthenticated();
      setIsAuthed(isAuthenticated);
    })();
  }, []);

  // Wait for both fonts and auth state before rendering to avoid hook order changes
  const ready = loaded && isAuthed !== null;
  if (!ready) return null;

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        {/* @ts-ignore */}
        <SafeAreaView className={colorScheme === 'dark' ? 'dark' : ''} style={{ flex: 1, backgroundColor: Colors[colorScheme ?? 'light'].background }}>
  <Stack
            initialRouteName={isAuthed ? '(tabs)' : 'screens/Login'}
            screenOptions={{
              headerStyle: { backgroundColor: Colors[colorScheme ?? 'light'].background },
              headerTintColor: Colors[colorScheme ?? 'light'].text,
              contentStyle: { backgroundColor: Colors[colorScheme ?? 'light'].background },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="screens/Login" options={{ headerShown: false }} />
            <Stack.Screen name="screens/Register" options={{ headerShown: false }} />
            <Stack.Screen name="screens/ForgotPassword" options={{ headerShown: false }} />
            <Stack.Screen name="screens/PasswordResetOTP" options={{ headerShown: false }} />
            <Stack.Screen name="screens/NewPassword" options={{ headerShown: false }} />
            <Stack.Screen name="screens/OTPVerification" options={{ headerShown: false }} />
            <Stack.Screen name="screens/SetupProfile" options={{ headerShown: false }} />
            <Stack.Screen name="screens/Home" options={{ title: 'Home' }} />
            <Stack.Screen name="screens/Profile" options={{ title: 'Profile' }} />
            <Stack.Screen name="screens/Friends" options={{ title: 'Friends' }} />
            <Stack.Screen name="screens/ChatList" options={{ title: 'Chats' }} />
            <Stack.Screen name="screens/ChatRoom" options={{ title: 'Chat' }} />
            <Stack.Screen name="screens/PostDetail" options={{ title: 'Post' }} />
            <Stack.Screen name="screens/CreatePost" options={{ headerShown: false }} />
            <Stack.Screen name="screens/Search" options={{ headerShown: false }} />
            <Stack.Screen name="screens/Notifications" options={{ headerShown: false }} />
            <Stack.Screen name="screens/Settings" options={{ headerShown: false }} />
            <Stack.Screen name="screens/About" options={{ headerShown: false }} />
            <Stack.Screen name="screens/Legal" options={{ headerShown: false }} />
            <Stack.Screen name="screens/Contact" options={{ headerShown: false }} />
            <Stack.Screen name="screens/SavedPosts" options={{ headerShown: false }} />
            <Stack.Screen name="screens/LikedPosts" options={{ headerShown: false }} />
            <Stack.Screen name="screens/MyPosts" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
  <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        </SafeAreaView>
      </ThemeProvider>
    </AuthProvider>
  );
}
