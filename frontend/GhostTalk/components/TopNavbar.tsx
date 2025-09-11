import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useRouter, usePathname } from 'expo-router';

interface TopNavbarProps {
  navigation?: any;
  onMenuPress?: () => void;
}

export default function TopNavbar({ navigation, onMenuPress }: TopNavbarProps) {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (route: string) => {
    // Treat index as /(tabs) or /(tabs)/index
    if (route === '/(tabs)') {
      return pathname === '/(tabs)' || pathname === '/(tabs)/index' || pathname === '/' || pathname === '/(tabs)/';
    }
    // Handle search screen
    if (route === '/screens/Search') {
      return pathname === '/screens/Search';
    }
    // Handle notifications screen
    if (route === '/screens/Notifications') {
      return pathname === '/screens/Notifications';
    }
    // Handle friends tab
    if (route === '/(tabs)/friends') {
      return pathname === '/(tabs)/friends' || pathname === '/friends' || pathname.includes('friends');
    }
    // Handle chats tab
    if (route === '/(tabs)/chats') {
      return pathname === '/(tabs)/chats' || pathname === '/chats' || pathname.includes('chats');
    }
    // For other routes, allow nested routes underneath
    return pathname === route || pathname.startsWith(route + '/');
  };

  const navigateTo = (route: string) => {
    if (route === '/(tabs)') {
      // If we're currently on a screen outside of tabs, use push to go back to tabs
      if (pathname.startsWith('/screens/')) {
        router.push('/(tabs)');
      } else {
        router.replace('/(tabs)');
      }
    } else if (route === '/(tabs)/explore') {
      router.replace('/(tabs)/explore');
    } else if (route === '/(tabs)/friends') {
      router.replace('/(tabs)/friends');
    } else if (route === '/(tabs)/chats') {
      router.replace('/(tabs)/chats');
    } else if (route === '/screens/Search') {
      router.push('/screens/Search');
    } else if (route === '/screens/Notifications') {
      router.push('/screens/Notifications');
    }
  };

  const navItems = [
    {
      route: '/(tabs)',
      icon: 'home-outline' as const,
      activeIcon: 'home' as const,
      label: 'Home'
    },
    {
      route: '/screens/Search',
      icon: 'search-outline' as const,
      activeIcon: 'search' as const,
      label: 'Search'
    },
    {
      route: '/(tabs)/friends',
      icon: 'people-outline' as const,
      activeIcon: 'people' as const,
      label: 'Friends'
    },
    {
      route: '/(tabs)/chats',
      icon: 'chatbubble-outline' as const,
      activeIcon: 'chatbubble' as const,
      label: 'Chats'
    },
    {
      route: '/screens/Notifications',
      icon: 'notifications-outline' as const,
      activeIcon: 'notifications' as const,
      label: 'Notifications'
    }
  ];

  const handleMenu = () => {
    onMenuPress?.();
  };

  return (
  <View style={[
        styles.container,
        {
          backgroundColor: Colors[colorScheme ?? 'light'].background,
          borderBottomColor: colorScheme === 'dark' ? '#333' : '#e0e0e0'
        }
      ]}>
        {navItems.map((item) => {
          const active = isActive(item.route);
          return (
            <TouchableOpacity
              key={item.route}
              style={[
                styles.navItem,
                active && [
                  styles.activeNavItem,
                  {
                    backgroundColor: colorScheme === 'dark'
                      ? Colors.dark.tint
                      : Colors.light.tint,
                    borderWidth: 2,
                    borderColor: Colors[colorScheme ?? 'light'].tint,
                    opacity: colorScheme === 'dark' ? 0.4 : 0.3
                  }
                ]
              ]}
              onPress={() => navigateTo(item.route)}
            >
              <Ionicons
                name={active ? item.activeIcon : item.icon}
                size={26}
                color={active
                  ? Colors[colorScheme ?? 'light'].tint
                  : Colors[colorScheme ?? 'light'].icon
                }
              />
            </TouchableOpacity>
          );
        })}
    {/* Sidebar trigger */}
    {onMenuPress && (
        <TouchableOpacity accessibilityLabel="Open menu" onPress={handleMenu} style={styles.navItem}>
          <Ionicons name={'menu'} size={26} color={Colors[colorScheme ?? 'light'].text} />
        </TouchableOpacity>
    )}
  </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
  },
  navItem: {
    padding: 8,
    borderRadius: 20,
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeNavItem: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  // removed sidebar styles; sidebar is now in tabs layout
});
