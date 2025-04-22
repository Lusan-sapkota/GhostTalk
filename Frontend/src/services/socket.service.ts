import { io, Socket } from 'socket.io-client';

// Get the API URL from environment variables or use a default
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Create a socket instance that won't auto-connect
export const socket: Socket = io(API_URL, {
  autoConnect: false,
  withCredentials: true,
});

// Add authentication handler to connect with token
export const connectWithToken = (token: string) => {
  socket.auth = { token };
  socket.connect();
  console.log('Socket connecting with token');
};

// Add disconnect handler
export const disconnect = () => {
  if (socket.connected) {
    socket.disconnect();
    console.log('Socket disconnected');
  }
};

// Handle reconnection attempts
socket.on('reconnect_attempt', (attempt) => {
  console.log(`Socket reconnection attempt: ${attempt}`);
});

// Handle connection errors
socket.on('connect_error', (error) => {
  console.error('Socket connection error:', error.message);
});

// Add a helper function to check connection status
export const ensureConnected = (token: string): boolean => {
  // If not connected, connect with token
  if (!socket.connected) {
    console.log('Socket not connected, connecting now with token');
    
    // Ensure we have auth set before connecting
    socket.auth = { token };
    
    // Try to disconnect if in a weird state
    if (socket.disconnected) {
      socket.disconnect();
    }
    
    // Connect with the token
    socket.connect();
    
    return true;
  } else {
    console.log('Socket already connected');
    return false;
  }
};

// Add a debug function
export const getSocketStatus = (): string => {
  return `Connected: ${socket.connected}, ID: ${socket.id || 'none'}`;
};

// Export an improved service
export const socketService = {
  connect: connectWithToken,
  disconnect,
  ensureConnected,
  socket
};