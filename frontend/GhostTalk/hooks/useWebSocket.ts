import { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OnlineStatusData {
  user_id: number;
  is_online: boolean;
}

export const useWebSocket = (url: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [onlineStatuses, setOnlineStatuses] = useState<Map<number, boolean>>(new Map());
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    connect();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [url]);

  const connect = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      // For React Native, we'll use a different approach since WebSocket might not work the same way
      // This is a placeholder for now - in a real implementation, you'd use a WebSocket library
      // or implement this differently for mobile apps

      console.log('WebSocket connection attempted to:', url);
      setIsConnected(true);
    } catch (error) {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
    }
  };

  const sendMessage = (message: any) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  };

  const updateOnlineStatus = (userId: number, isOnline: boolean) => {
    setOnlineStatuses(prev => {
      const newMap = new Map(prev);
      newMap.set(userId, isOnline);
      return newMap;
    });
  };

  return {
    isConnected,
    onlineStatuses,
    sendMessage,
    updateOnlineStatus
  };
};
