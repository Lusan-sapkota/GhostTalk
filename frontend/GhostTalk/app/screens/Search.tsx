import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
  Animated,
  Easing
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { searchPosts, searchUsers, Post } from '../api';
import Skeleton from '../../components/Skeleton';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TopNavbar from '../../components/TopNavbar';
import Sidebar from '../../components/Sidebar';
import { API_BASE_URL } from '../api';

interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  is_online: boolean;
  bio: string;
  image: string | null;
}

export default function SearchScreen() {
  const scheme = useColorScheme();
  const router = useRouter();
  const colors = Colors[scheme ?? 'light'];

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Post[]>([]);
  const [userResults, setUserResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'users'>('posts');

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const slideX = useRef(new Animated.Value(320)).current;

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      router.replace('/screens/Login');
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Search', 'Please enter a search term');
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      // Search both posts and users in parallel
      const [postsResponse, usersResponse] = await Promise.all([
        searchPosts(searchQuery.trim()),
        searchUsers(searchQuery.trim())
      ]);

      setSearchResults(postsResponse?.data?.results || []);
      setUserResults(usersResponse?.data?.users || []);
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to search. Please try again.');
      setSearchResults([]);
      setUserResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePostPress = (post: Post) => {
    router.push({ pathname: '/screens/PostDetail', params: { post: JSON.stringify(post) } });
  };

  const handleUserPress = (user: User) => {
    router.push({ pathname: '/screens/PublicProfile' as any, params: { userId: user.id.toString() } });
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setUserResults([]);
    setHasSearched(false);
    setActiveTab('posts');
  };

  // Sidebar functions
  const openDrawer = () => {
    setSidebarOpen(true);
    Animated.timing(slideX, { toValue: 0, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  };

  const closeDrawer = () => {
    Animated.timing(slideX, { toValue: 320, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(({ finished }) => {
      if (finished) setSidebarOpen(false);
    });
  };

  const renderPostItem = ({ item }: { item: Post }) => (
    <TouchableOpacity
      style={[styles.postItem, { borderBottomColor: colors.icon + '20' }]}
      onPress={() => handlePostPress(item)}
    >
      <View style={styles.postHeader}>
        <View style={styles.authorInfo}>
          <View style={[styles.avatar, { backgroundColor: colors.tint + '30' }]}>
            <Text style={[styles.avatarText, { color: colors.tint }]}>
              {(item.author.first_name?.[0] || item.author.username?.[0] || 'U').toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={[styles.authorName, { color: colors.text }]}>
              {item.author.first_name || item.author.username}
            </Text>
            <Text style={[styles.postDate, { color: colors.icon }]}>
              {new Date(item.date_posted).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>

      <Text style={[styles.postTitle, { color: colors.text }]} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={[styles.postContent, { color: colors.icon }]} numberOfLines={3}>
        {item.content}
      </Text>

      <View style={styles.postStats}>
        <View style={styles.statItem}>
          <Ionicons name="heart-outline" size={16} color={colors.icon} />
          <Text style={[styles.statText, { color: colors.icon }]}>
            {item.likes_count || 0}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="chatbubble-outline" size={16} color={colors.icon} />
          <Text style={[styles.statText, { color: colors.icon }]}>
            {item.comments_count || 0}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={[styles.userItem, { borderBottomColor: colors.icon + '20' }]}
      onPress={() => handleUserPress(item)}
    >
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          {item.image && item.image !== '/media/default.jpg' ? (
            <Image source={{ uri: `${API_BASE_URL}${item.image}` }} style={styles.userAvatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: colors.tint + '30' }]}>
              <Text style={[styles.avatarText, { color: colors.tint }]}>
                {(item.first_name?.[0] || item.username?.[0] || 'U').toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.userDetails}>
            <Text style={[styles.userName, { color: colors.text }]}>
              {item.first_name && item.last_name
                ? `${item.first_name} ${item.last_name}`
                : item.username}
            </Text>
            <Text style={[styles.userUsername, { color: colors.icon }]}>
              @{item.username}
            </Text>
            {item.is_online && (
              <View style={styles.onlineIndicator}>
                <Text style={[styles.onlineText, { color: '#4CAF50' }]}>Online</Text>
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={[styles.viewProfileButton, { backgroundColor: colors.tint }]}
          onPress={() => handleUserPress(item)}
        >
          <Text style={styles.viewProfileText}>View Profile</Text>
        </TouchableOpacity>
      </View>
      {item.bio && (
        <Text style={[styles.userBio, { color: colors.icon }]} numberOfLines={2}>
          {item.bio}
        </Text>
      )}
    </TouchableOpacity>
  );

  const renderEmptyState = () => {
    if (!hasSearched) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={64} color={colors.icon + '40'} />
          <Text style={[styles.emptyStateText, { color: colors.icon }]}>
            Search for posts, topics, or users
          </Text>
        </View>
      );
    }

    if (loading) {
      // show skeleton placeholders for posts (or users if activeTab === 'users')
      return (
        <View style={{ padding: 12 }}>
          {activeTab === 'posts' ? (
            <Skeleton variant="rect" height={160} borderRadius={10} count={3} />
          ) : (
            <Skeleton variant="rect" height={72} borderRadius={8} count={4} />
          )}
        </View>
      );
    }

    const noResultsMessage = activeTab === 'posts'
      ? `No posts found for "${searchQuery}"`
      : `No users found for "${searchQuery}"`;

    return (
      <View style={styles.emptyState}>
        <Ionicons name="document-text-outline" size={64} color={colors.icon + '40'} />
        <Text style={[styles.emptyStateText, { color: colors.icon }]}>
          {noResultsMessage}
        </Text>
        <Text style={[styles.emptyStateSubtext, { color: colors.icon + '60' }]}>
          Try different keywords or check your spelling
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <TopNavbar onMenuPress={openDrawer} />

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchInputContainer, { backgroundColor: scheme === 'dark' ? '#222' : '#f0f2f5' }]}>
          <Ionicons name="search" size={20} color={colors.icon} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search posts, topics, or users"
            placeholderTextColor={colors.icon}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color={colors.icon} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.searchButton, { backgroundColor: colors.tint }]}
          onPress={handleSearch}
          disabled={loading}
        >
          <Text style={[styles.searchButtonText, { color: 'white' }]}>
            {loading ? 'Searching...' : 'Search'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      {hasSearched && (searchResults.length > 0 || userResults.length > 0) && (
        <View style={styles.tabContainer}>
          <TouchableOpacity
            onPress={() => setActiveTab('posts')}
            style={[styles.tab, activeTab === 'posts' && { borderBottomColor: colors.tint }]}
          >
            <Text style={[styles.tabText, { color: activeTab === 'posts' ? colors.tint : colors.icon }]}>
              Posts ({searchResults.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('users')}
            style={[styles.tab, activeTab === 'users' && { borderBottomColor: colors.tint }]}
          >
            <Text style={[styles.tabText, { color: activeTab === 'users' ? colors.tint : colors.icon }]}>
              Users ({userResults.length})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Results */}
      {activeTab === 'posts' ? (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderPostItem}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={searchResults.length === 0 ? styles.emptyList : undefined}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={userResults}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderUserItem}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={userResults.length === 0 ? styles.emptyList : undefined}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={closeDrawer}
        slideX={slideX}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
  },
  searchButton: {
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: 'center',
  },
  searchButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  postItem: {
    padding: 16,
    borderBottomWidth: 1,
  },
  postHeader: {
    marginBottom: 8,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
  },
  postDate: {
    fontSize: 12,
    marginTop: 2,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    lineHeight: 24,
  },
  postContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  postStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
  },
  userItem: {
    padding: 16,
    borderBottomWidth: 1,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  userUsername: {
    fontSize: 14,
    marginBottom: 4,
  },
  onlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineText: {
    fontSize: 12,
    fontWeight: '500',
  },
  viewProfileButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  viewProfileText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  userBio: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  emptyList: {
    flexGrow: 1,
  },
});
