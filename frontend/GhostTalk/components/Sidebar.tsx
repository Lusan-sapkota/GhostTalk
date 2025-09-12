import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useRouter } from 'expo-router';
import { logoutUser } from '../app/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  slideX: Animated.Value;
}

interface SidebarItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
}

function SidebarItem({ icon, label, onPress, color }: SidebarItemProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? 'light'];

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.sidebarItem, { borderBottomColor: colors.icon }]}
      activeOpacity={0.7}
    >
      <Ionicons name={icon} size={24} color={color || colors.text} />
      <Text style={[styles.sidebarItemText, { color: color || colors.text }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.icon} />
    </TouchableOpacity>
  );
}

export default function Sidebar({ isOpen, onClose, slideX }: SidebarProps) {
  const scheme = useColorScheme();
  const router = useRouter();
  const colors = Colors[scheme ?? 'light'];

  const handleProfilePress = () => {
    onClose();
    router.push('/screens/Profile');
  };

  const handleSettingsPress = () => {
    onClose();
    router.push('/screens/Settings');
  };

  const handleSearchPress = () => {
    onClose();
    router.push('/screens/Search');
  };

  const handleSavedPostsPress = () => {
    onClose();
    router.push('/screens/SavedPosts');
  };

  const handleLikedPostsPress = () => {
    onClose();
    router.push('/screens/LikedPosts');
  };

  const handleMyPostsPress = () => {
    onClose();
    router.push('/screens/MyPosts');
  };

  const handleAboutPress = () => {
    onClose();
    router.push('/screens/About');
  };

  const handleLegalPress = () => {
    onClose();
    router.push('/screens/Legal');
  };

  const handleContactPress = () => {
    onClose();
    router.push('/screens/Contact');
  };

  const handleLogoutPress = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            onClose();
            try {
              await logoutUser();
              router.replace('/screens/Login');
            } catch (error) {
              console.error('Logout failed:', error);
              // Still clear local data and redirect
              await AsyncStorage.removeItem('token');
              await AsyncStorage.removeItem('user');
              router.replace('/screens/Login');
            }
          },
        },
      ]
    );
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <View style={styles.backdropWrapper} pointerEvents="auto">
        <TouchableOpacity
          style={styles.backdrop}
          onPress={onClose}
          activeOpacity={1}
        />
      </View>

      {/* Sidebar */}
      <Animated.View
        style={[
          styles.sidebar,
          {
            backgroundColor: colors.background,
            borderLeftColor: colors.icon,
            transform: [{ translateX: slideX }],
            pointerEvents: 'auto'
          }
        ]}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.icon }]}>
            <Image
              source={require('../assets/images/icon.png')}
              style={styles.appIcon}
            />
            <Text style={[styles.headerText, { color: colors.text }]}>GhostTalk</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Menu Items */}
          <View style={styles.menuContainer}>
            <SidebarItem
              icon="person-circle-outline"
              label="Profile"
              onPress={handleProfilePress}
            />
            <SidebarItem
              icon="document-text-outline"
              label="My Posts"
              onPress={handleMyPostsPress}
            />
            <SidebarItem
              icon="bookmark-outline"
              label="Saved Posts"
              onPress={handleSavedPostsPress}
            />
            <SidebarItem
              icon="heart-outline"
              label="Liked Posts"
              onPress={handleLikedPostsPress}
            />
            <SidebarItem
              icon="search-outline"
              label="Search"
              onPress={handleSearchPress}
            />
            <SidebarItem
              icon="settings-outline"
              label="Settings"
              onPress={handleSettingsPress}
            />
            <SidebarItem
              icon="information-circle-outline"
              label="About"
              onPress={handleAboutPress}
            />
            <SidebarItem
              icon="help-circle-outline"
              label="Help & Legal"
              onPress={handleLegalPress}
            />
            <SidebarItem
              icon="call-outline"
              label="Contact"
              onPress={handleContactPress}
            />
            <SidebarItem
              icon="log-out-outline"
              label="Logout"
              onPress={handleLogoutPress}
              color="#ff4444"
            />
          </View>
        </SafeAreaView>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    // Ensure backdrop sits below the sidebar but above page content
    zIndex: 998,
    elevation: 8,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 280,
    borderLeftWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: -2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 20,
    zIndex: 999,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  appIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 12,
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  menuContainer: {
    flex: 1,
    paddingTop: 8,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  sidebarItemText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 16,
    flex: 1,
  },
  backdropWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 997,
  },
});
