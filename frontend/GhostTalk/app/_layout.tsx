import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import 'react-native-reanimated';

import '../global.css';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {/* @ts-ignore */}
      <View className={colorScheme === 'dark' ? 'dark' : ''} style={{ flex: 1 }}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="screens/Login" options={{ title: 'Login' }} />
          <Stack.Screen name="screens/Register" options={{ title: 'Register' }} />
          <Stack.Screen name="screens/Home" options={{ title: 'Home' }} />
          <Stack.Screen name="screens/Profile" options={{ title: 'Profile' }} />
          <Stack.Screen name="screens/Friends" options={{ title: 'Friends' }} />
          <Stack.Screen name="screens/ChatList" options={{ title: 'Chats' }} />
          <Stack.Screen name="screens/ChatRoom" options={{ title: 'Chat' }} />
          <Stack.Screen name="screens/PostDetail" options={{ title: 'Post' }} />
          <Stack.Screen name="screens/CreatePost" options={{ title: 'Create Post' }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </View>
    </ThemeProvider>
  );
}
