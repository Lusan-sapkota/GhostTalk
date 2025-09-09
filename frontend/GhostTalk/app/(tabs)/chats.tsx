import React, { useEffect, useState } from 'react';
import { View, FlatList, Text, TouchableOpacity } from 'react-native';
import { getRooms } from '../api';

interface Room {
  room_id: number;
  author_id: number;
  friend_id: number;
  created: string;
}

export default function ChatsScreen({ navigation }: any) {
  const [rooms, setRooms] = useState<Room[]>([]);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await getRooms();
      setRooms(response.data.all_rooms);
    } catch (error) {
      console.error(error);
    }
  };

  const handleRoomPress = (room: Room) => {
    navigation.navigate('screens/ChatRoom', { room });
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={rooms}
        keyExtractor={(item) => item.room_id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleRoomPress(item)} style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: '#ccc' }}>
            <Text>Room {item.room_id}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
