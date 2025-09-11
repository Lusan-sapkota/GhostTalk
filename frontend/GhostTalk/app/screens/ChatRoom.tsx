import React, { useEffect, useState } from 'react';
import { View, FlatList, Text, TextInput, TouchableOpacity } from 'react-native';
import { getRoomMessages } from '../api';
import { useLocalSearchParams } from 'expo-router';

interface Message {
  user: string;
  message: string;
  date: string;
}

const ChatRoom: React.FC = () => {
  const params = useLocalSearchParams();
  const roomParam = params.room as string;
  const room = JSON.parse(roomParam);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await getRoomMessages(room.room_id, room.friend_id);
      setMessages(response.data.old_chats);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSendMessage = async () => {
    // Implement send message
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={messages}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={{ padding: 10 }}>
            <Text style={{ fontWeight: 'bold' }}>{item.user}</Text>
            <Text>{item.message}</Text>
          </View>
        )}
      />
      <View style={{ flexDirection: 'row', padding: 10 }}>
        <TextInput
          placeholder="Type a message"
          value={newMessage}
          onChangeText={setNewMessage}
          style={{ flex: 1, borderWidth: 1, padding: 10 }}
        />
        <TouchableOpacity onPress={handleSendMessage} style={{ backgroundColor: 'blue', padding: 10, marginLeft: 10 }}>
          <Text style={{ color: 'white' }}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ChatRoom;
