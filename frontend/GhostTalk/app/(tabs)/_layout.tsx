import React from 'react';
import { Stack } from 'expo-router';
import { View, Animated, Easing, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopNavbar from '@/components/TopNavbar';
import Sidebar from '@/components/Sidebar';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  // match Sidebar width (280) so the drawer starts off-screen
  const SIDEBAR_WIDTH = 280;
  const slideX = React.useRef(new Animated.Value(SIDEBAR_WIDTH)).current;

  const openDrawer = () => {
    setOpen(true);
    Animated.timing(slideX, { toValue: 0, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  };
  const closeDrawer = () => {
    Animated.timing(slideX, { toValue: SIDEBAR_WIDTH, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(({ finished }) => {
      if (finished) setOpen(false);
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors[colorScheme ?? 'light'].background }} edges={['top', 'bottom']}>
      <TopNavbar navigation={null} onMenuPress={openDrawer} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors[colorScheme ?? 'light'].background },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="explore" />
        <Stack.Screen name="friends" />
        <Stack.Screen name="chats" />
      </Stack>

      {/* Sidebar */}
      <Sidebar
        isOpen={open}
        onClose={closeDrawer}
        slideX={slideX}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Styles removed - sidebar is now handled by Sidebar component
});
