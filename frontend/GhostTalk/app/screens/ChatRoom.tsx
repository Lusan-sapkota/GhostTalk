import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ScrollView,
} from 'react-native';
import { getRoomMessages, sendMessage, getProfileDetail } from '../api';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

interface Message {
  id?: number;
  user: string;
  message: string;
  date: string;
  isMine?: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
}

interface Room {
  room_id: number;
  author_id: number;
  friend_id: number;
  created: string;
}

const ChatRoom: React.FC = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? 'light'];

  const roomParam = params.room as string;
  const room: Room = JSON.parse(roomParam);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [friendProfile, setFriendProfile] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [friendUsername, setFriendUsername] = useState('');

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    getCurrentUser();
    fetchMessages();
  }, []);

  const getCurrentUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        setCurrentUserId(user.id);
      }
    } catch (error) {
      console.error('Error getting current user:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await getRoomMessages(room.room_id, room.friend_id);
      const formattedMessages = response.data.old_chats.map((msg: any) => ({
        ...msg,
        isMine: msg.user === response.data.me.username,
        status: msg.user === response.data.me.username ? 'sent' : undefined
      }));
      setMessages(formattedMessages);
      setFriendUsername(response.data.friend.username);

      // Fetch friend's profile for the header
      try {
        const profileResponse = await getProfileDetail(room.friend_id);
        setFriendProfile(profileResponse.data);
      } catch (profileError) {
        console.error('Error fetching friend profile:', profileError);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    // Create temporary message with sending status
    const tempMessage: Message = {
      id: Date.now(), // Temporary ID
      user: 'Me',
      message: newMessage,
      date: new Date().toISOString(),
      isMine: true,
      status: 'sending'
    };

    // Add message to UI immediately
    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');
    flatListRef.current?.scrollToEnd();

    try {
      const response = await sendMessage(room.room_id, newMessage);
      // Update message status to sent
      setMessages(prev => prev.map(msg =>
        msg.id === tempMessage.id
          ? { ...msg, ...response.data, status: 'sent' as const }
          : msg
      ));
    } catch (error) {
      console.error('Error sending message:', error);
      // Update message status to show error
      setMessages(prev => prev.map(msg =>
        msg.id === tempMessage.id
          ? { ...msg, status: 'sending' as const }
          : msg
      ));
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const handleVideoCall = () => {
    // TODO: Implement video call
    Alert.alert('Video Call', 'Video call feature coming soon!');
  };

  const handleAudioCall = () => {
    // TODO: Implement audio call
    Alert.alert('Audio Call', 'Audio call feature coming soon!');
  };

  const handleAttachFile = () => {
    Alert.alert('Attach File', 'File attachment feature coming soon!');
  };

  const handleInfoPress = () => {
    setShowInfoModal(true);
  };

  const handleViewProfile = () => {
    setShowInfoModal(false);
    router.push({
      pathname: '/screens/PublicProfile' as any,
      params: { userId: room.friend_id.toString() }
    });
  };

  const handleAttachMedia = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('Permission required', 'Permission to access media library is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      // TODO: Upload and send media
      Alert.alert('Media Selected', 'Media upload feature coming soon!');
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageContainer,
      item.isMine ? styles.myMessage : styles.theirMessage
    ]}>
      {!item.isMine && (
        <Text style={[styles.username, { color: colors.primary }]}>
          {item.user}
        </Text>
      )}
      <View style={[
        styles.messageBubble,
        item.isMine ? styles.myBubble : styles.theirBubble,
        { backgroundColor: item.isMine ? colors.primary : colors.icon + '20' }
      ]}>
        <Text style={[
          styles.messageText,
          { color: item.isMine ? 'white' : colors.text }
        ]}>
          {item.message}
        </Text>
      </View>
      <View style={styles.messageFooter}>
        <Text style={[styles.timestamp, { color: colors.icon }]}>
          {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
        {item.isMine && (
          <View style={styles.statusContainer}>
            {item.status === 'sending' && (
              <Ionicons name="time-outline" size={12} color={colors.icon} />
            )}
            {item.status === 'sent' && (
              <Ionicons name="checkmark" size={12} color={colors.icon} />
            )}
            {item.status === 'delivered' && (
              <Ionicons name="checkmark-done" size={12} color={colors.icon} />
            )}
            {item.status === 'read' && (
              <Ionicons name="checkmark-done" size={12} color="#007AFF" />
            )}
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.icon + '20' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerUserInfo}>
          <View style={[styles.headerAvatar, { backgroundColor: colors.primary + '30' }]}>
            <Text style={[styles.headerAvatarText, { color: colors.primary }]}>
              {friendUsername?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{friendUsername}</Text>
            <Text style={[styles.headerSubtitle, { color: colors.icon }]}>
              {friendProfile?.is_online ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleAudioCall} style={styles.headerButton}>
            <Ionicons name="call" size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleVideoCall} style={styles.headerButton}>
            <Ionicons name="videocam" size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleInfoPress} style={styles.headerButton}>
            <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages and Input Container */}
      <KeyboardAvoidingView
        style={styles.contentContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Messages */}
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, { color: colors.icon }]}>
              Start talking, say hi!
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item, index) => item.id?.toString() || index.toString()}
            renderItem={renderMessage}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContainer}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          />
        )}

        {/* Input Area */}
        <View style={[styles.inputContainer, { backgroundColor: colors.background, borderTopColor: colors.icon + '20' }]}>
          <View style={styles.inputRow}>
            <TouchableOpacity onPress={handleAttachMedia} style={styles.attachButton}>
              <Ionicons name="image" size={20} color={colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleAttachFile} style={styles.attachButton}>
              <Ionicons name="attach" size={20} color={colors.primary} />
            </TouchableOpacity>

            <TextInput
              placeholder="Type a message..."
              placeholderTextColor={colors.icon}
              value={newMessage}
              onChangeText={setNewMessage}
              style={[styles.textInput, {
                backgroundColor: colors.icon + '10',
                color: colors.text,
                borderColor: colors.icon + '30'
              }]}
              multiline
            />

            {newMessage.trim() ? (
              <TouchableOpacity onPress={handleSendMessage} style={[styles.sendButton, { backgroundColor: colors.primary }]}>
                <Ionicons name="send" size={18} color="white" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => Alert.alert('Voice Message', 'Voice message feature coming soon!')}
                style={[styles.sendButton, { backgroundColor: colors.primary }]}
              >
                <Ionicons name="mic" size={18} color="white" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Info Modal */}
      <Modal
        visible={showInfoModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowInfoModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.icon + '20' }]}>
            <TouchableOpacity onPress={() => setShowInfoModal(false)} style={styles.modalBackButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Chat Info</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Friend Profile Section */}
            <View style={[styles.profileSection, { backgroundColor: colors.icon + '10' }]}>
              <TouchableOpacity onPress={handleViewProfile} style={styles.profileTouchable}>
                <View style={[styles.profileImage, { backgroundColor: colors.primary + '30' }]}>
                  <Text style={[styles.profileImageText, { color: colors.primary }]}>
                    {friendUsername?.charAt(0).toUpperCase() || 'U'}
                  </Text>
                </View>
                <View style={styles.profileInfo}>
                  <Text style={[styles.profileName, { color: colors.text }]}>{friendUsername}</Text>
                  <Text style={[styles.profileStatus, { color: colors.icon }]}>
                    {friendProfile?.is_online ? 'Active now' : 'Offline'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.icon} />
              </TouchableOpacity>
            </View>

            {/* Chat Options */}
            <View style={styles.optionsSection}>
              <TouchableOpacity style={[styles.optionItem, { borderBottomColor: colors.icon + '20' }]}>
                <Ionicons name="search" size={24} color={colors.primary} />
                <Text style={[styles.optionText, { color: colors.text }]}>Search in chat</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.icon} />
              </TouchableOpacity>

              <TouchableOpacity style={[styles.optionItem, { borderBottomColor: colors.icon + '20' }]}>
                <Ionicons name="time-outline" size={24} color={colors.primary} />
                <Text style={[styles.optionText, { color: colors.text }]}>Auto-disappearing messages</Text>
                <Text style={[styles.optionValue, { color: colors.icon }]}>Off</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.optionItem, { borderBottomColor: colors.icon + '20' }]}>
                <Ionicons name="notifications-outline" size={24} color={colors.primary} />
                <Text style={[styles.optionText, { color: colors.text }]}>Mute notifications</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.icon} />
              </TouchableOpacity>

              <TouchableOpacity style={[styles.optionItem, { borderBottomColor: colors.icon + '20' }]}>
                <Ionicons name="color-palette-outline" size={24} color={colors.primary} />
                <Text style={[styles.optionText, { color: colors.text }]}>Change theme</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.icon} />
              </TouchableOpacity>

              <TouchableOpacity style={[styles.optionItem, { borderBottomColor: colors.icon + '20' }]}>
                <Ionicons name="image-outline" size={24} color={colors.primary} />
                <Text style={[styles.optionText, { color: colors.text }]}>Shared media</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.icon} />
              </TouchableOpacity>

              <TouchableOpacity style={[styles.optionItem]}>
                <Ionicons name="flag-outline" size={24} color="#ff6b6b" />
                <Text style={[styles.optionText, { color: "#ff6b6b" }]}>Report</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.icon} />
              </TouchableOpacity>
            </View>

            {/* Danger Zone */}
            <View style={styles.dangerSection}>
              <TouchableOpacity style={styles.dangerItem}>
                <Ionicons name="person-remove-outline" size={24} color="#ff6b6b" />
                <Text style={[styles.dangerText, { color: "#ff6b6b" }]}>Block {friendUsername}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.dangerItem}>
                <Ionicons name="trash-outline" size={24} color="#ff6b6b" />
                <Text style={[styles.dangerText, { color: "#ff6b6b" }]}>Delete chat</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 8 : 12, // Adjust for status bar
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerUserInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: width * 0.8,
  },
  myMessage: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  theirMessage: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  username: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxWidth: '100%',
  },
  myBubble: {
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    minWidth: 60,
  },
  statusContainer: {
    marginLeft: 8,
  },
  inputContainer: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 12, // Extra padding for iOS home indicator
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  attachButton: {
    padding: 8,
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalBackButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 16,
  },
  modalContent: {
    flex: 1,
  },
  profileSection: {
    padding: 16,
    marginBottom: 16,
  },
  profileTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  profileStatus: {
    fontSize: 14,
  },
  optionsSection: {
    marginBottom: 16,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  optionText: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  optionValue: {
    fontSize: 14,
  },
  dangerSection: {
    marginTop: 16,
  },
  dangerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dangerText: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
});

export default ChatRoom;
