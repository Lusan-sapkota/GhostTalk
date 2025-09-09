import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Resolve a backend base URL that works on device, emulator, and web
function resolveApiBaseUrl() {
  // Try to infer LAN IP from Expo Go config when running in dev
  const hostUri = (Constants as any)?.expoGoConfig?.hostUri || (Constants as any)?.expoConfig?.hostUri;
  let host = undefined as string | undefined;
  if (typeof hostUri === 'string') {
    // e.g. "192.168.18.43:8081"
    host = hostUri.split(':')[0];
  }
  if (!host) {
    host = Platform.select({ android: '10.0.2.2', ios: 'localhost', default: 'localhost' });
  }
  return `http://${host}:8000`;
}

const API_BASE_URL = resolveApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

export default api;

// User APIs
export const registerUser = (username: string, email: string, password: string) =>
  api.post('/user/register/', { username, email, password1: password, password2: password });

export const loginUser = (username: string, password: string) =>
  api.post('/api/auth/token/', { username, password });

export const getProfile = () => api.get('/user/me/');

export const updateProfile = (data: any) => api.post('/user/me/', data);

export const getAllProfiles = () => api.get('/user/all/');

export const getProfileDetail = (pk: number) => api.get(`/user/${pk}/`);

export const followUnfollow = (profilePk: number) => api.post('/user/follow/', { profile_pk: profilePk });

// Blog APIs
export const getHomePosts = () => api.get('/home/');

export const getFeedPosts = () => api.get('/feed/');

export const getUserPosts = (username: string) => api.get(`/post/user/${username}/`);

export const getPostDetail = (pk: number) => api.get(`/post/${pk}/`);

export const createPost = (title: string, content: string) => api.post('/post/new/', { title, content });

export const updatePost = (pk: number, title: string, content: string) => api.put(`/post/${pk}/update/`, { title, content });

export const deletePost = (pk: number) => api.delete(`/post/${pk}/delete/`);

export const likePost = (id: number) => api.post('/post/like/', { id });

export const savePost = (id: number) => api.post('/post/save/', { id });

export const likeComment = (id: number, pid: number) => api.post('/post/comment/like/', { id, pid });

export const getLikedPosts = () => api.get('/liked-posts/');

export const getSavedPosts = () => api.get('/saved-posts/');

export const searchPosts = (query: string) => api.get('/search/', { params: { query } });

// Friend APIs
export const getFriendsList = (userId: number) => api.get(`/friend/list/${userId}`);

export const sendFriendRequest = (receiverUserId: number) => api.post('/friend/friend_request/', { receiver_user_id: receiverUserId });

export const getFriendRequests = (userId: number) => api.get(`/friend/friend_requests/${userId}/`);

export const acceptFriendRequest = (friendRequestId: number) => api.get(`/friend/friend_request_accept/${friendRequestId}/`);

export const declineFriendRequest = (friendRequestId: number) => api.get(`/friend/friend_request_decline/${friendRequestId}/`);

export const cancelFriendRequest = (receiverUserId: number) => api.post('/friend/friend_request_cancel/', { receiver_user_id: receiverUserId });

export const removeFriend = (receiverUserId: number) => api.post('/friend/friend_remove/', { receiver_user_id: receiverUserId });

// Chat APIs
export const getRooms = () => api.get('/chats/');

export const createRoom = (friendId: number) => api.post(`/chats/chat/${friendId}`);

export const getRoomMessages = (roomName: number, friendId: number) => api.get(`/chats/room/${roomName}-${friendId}`);

// Notification APIs
export const getNotifications = () => api.get('/notifications/');

// Types
export interface User {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

export interface Profile {
  id: number;
  user: User;
  is_online: boolean;
  bio?: string;
  image?: string;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  date_posted: string;
  date_updated: string;
  author: User;
  likes_count: number;
  saves_count: number;
}

export interface Comment {
  id: number;
  post_id: number;
  user: User;
  body: string;
  date_added: string;
  likes_count: number;
  reply_id?: number;
}

export interface Notification {
  id: number;
  sender: string;
  notification_type: number;
  text_preview: string;
  date: string;
  post_id?: number;
}
