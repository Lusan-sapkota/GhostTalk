import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonToolbar,
  IonTitle,
  IonFooter,
  IonItem,
  IonTextarea,
  IonButton,
  IonIcon,
  IonAvatar,
  IonBadge,
  IonChip,
  IonLabel,
  IonList,
  IonPopover,
  IonActionSheet,
  IonToast,
  IonText,
  IonNote,
  IonProgressBar,
  IonSpinner
} from '@ionic/react';
import { 
  send, 
  micOutline, 
  imageOutline, 
  ellipsisHorizontal, 
  documentOutline, 
  locationOutline, 
  timerOutline, 
  trashOutline, 
  lockClosedOutline,
  checkmarkDoneOutline,
  checkmarkOutline,
  timeOutline,
  personAddOutline,
  volumeHighOutline,
  micOffOutline,
  stopCircleOutline,
  pulseOutline,
  alertCircleOutline,
  chatbubble,
} from 'ionicons/icons';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api.service';
import { socket, socketService } from '../services/socket.service';
import './PrivateChatSession.css';

interface Message {
  id: string;
  text?: string;
  senderId: string;
  recipientId: string;
  timestamp: number;
  isRead: boolean;
  isGhost: boolean;
  ghostDuration?: number;
  audioUrl?: string;
  type: 'text' | 'audio' | 'image' | 'file';
  isDelivered: boolean;
}

interface ChatUser {
  id: string;
  name: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: number;
  isTyping?: boolean;
  isAdded?: boolean; // If they're already a friend
  proStatus?: string;
}

const PrivateChatSession: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const { currentUser, isAuthenticated, isPro } = useAuth();
  const history = useHistory();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showGhostOptions, setShowGhostOptions] = useState(false);
  const [selectedGhostTime, setSelectedGhostTime] = useState<number | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [otherUser, setOtherUser] = useState<ChatUser | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [sessionTimeLeft, setSessionTimeLeft] = useState<number>(3600); // 1 hour in seconds
  const [showAddFriendConfirm, setShowAddFriendConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [page, setPage] = useState(1);
  const [sending, setSending] = useState(false);
  
  const contentRef = useRef<HTMLIonContentElement>(null);
  const audioRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Fetch chat and user data on component mount
  useEffect(() => {
    if (!isAuthenticated) {
      history.replace('/login');
      return;
    }
    
    const fetchChatData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch other user's profile
        const userResponse = await apiService.makeRequest(`/user/profile/${chatId}`, 'GET');
        
        if (userResponse.success && userResponse.user) {
          setOtherUser({
            id: userResponse.user.id,
            name: userResponse.user.name,
            avatar: userResponse.user.avatar || 'https://ionicframework.com/docs/img/demos/avatar.svg',
            isOnline: userResponse.user.isOnline || false,
            lastSeen: userResponse.user.lastSeen,
            isAdded: userResponse.user.isAdded || false,
            proStatus: userResponse.user.proStatus || 'free'
          });
        } else {
          setToastMessage('Could not load user profile');
          setShowToast(true);
        }
        
        // Fetch chat history
        await loadMessages();
        
        // Start session timer for free users
        if (!isPro) {
          const sessionResponse = await apiService.makeRequest('/chat/session-info', 'POST', { chatId });
          if (sessionResponse.success) {
            setSessionTimeLeft(sessionResponse.timeLeft || 3600);
            startSessionTimer();
          } else {
            startSessionTimer(); // Fallback to default timer
          }
        }

        // Join socket room
        socket.emit('joinRoom', chatId);

        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching chat data:', error);
        setToastMessage('Failed to load chat');
        setShowToast(true);
        setIsLoading(false);
      }
    };
    
    fetchChatData();
    
    // Setup socket listeners
    setupSocketListeners();
    
    // Cleanup function
    return () => {
      // Emit an event to leave the chat room
      socket.emit('leaveRoom', chatId); 
      removeSocketListeners();
      
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      stopRecording();
    };
  }, [chatId, currentUser, isPro, isAuthenticated]);
  
  // Set up socket listeners for real-time updates
  const setupSocketListeners = () => {
    socket.on('message', handleNewMessage);
    socket.on('messageRead', handleMessageRead);
    socket.on('typing', handleUserTyping);
    socket.on('stopTyping', handleUserStopTyping);
    socket.on('sessionExpired', handleSessionExpired);
  };
  
  // Remove socket listeners when component unmounts
  const removeSocketListeners = () => {
    socket.off('message', handleNewMessage);
    socket.off('messageRead', handleMessageRead);
    socket.off('typing', handleUserTyping);
    socket.off('stopTyping', handleUserStopTyping);
    socket.off('sessionExpired', handleSessionExpired);
  };
  
  // Handle new incoming message from socket
  const handleNewMessage = (data: any) => {
    if (data.senderId !== currentUser?.id) {
      const newMessage: Message = {
        id: data.id,
        text: data.text,
        senderId: data.senderId,
        recipientId: data.recipientId,
        timestamp: data.timestamp,
        isRead: false,
        isGhost: data.isGhost,
        ghostDuration: data.ghostDuration,
        type: data.type,
        isDelivered: true,
        audioUrl: data.type === 'audio' ? data.audioUrl : undefined
      };
      
      setMessages(prev => [...prev, newMessage]);
      
      // Mark as read if chat is open
      apiService.makeRequest('/chat/mark-read', 'POST', { 
        messageId: data.id,
        chatId
      });
    }
  };
  
  // Handle message read status update
  const handleMessageRead = (data: any) => {
    if (data.messageIds && data.messageIds.length) {
      setMessages(prev => 
        prev.map(msg => 
          data.messageIds.includes(msg.id) ? { ...msg, isRead: true } : msg
        )
      );
    }
  };
  
  // Handle user typing indicator
  const handleUserTyping = (data: any) => {
    if (data.userId === chatId) {
      setOtherUser(prev => prev ? { ...prev, isTyping: true } : null);
    }
  };
  
  // Handle user stop typing indicator
  const handleUserStopTyping = (data: any) => {
    if (data.userId === chatId) {
      setOtherUser(prev => prev ? { ...prev, isTyping: false } : null);
    }
  };
  
  // Handle session expiration
  const handleSessionExpired = () => {
    setToastMessage('Chat session expired. Upgrade to Pro for unlimited chats!');
    setShowToast(true);
    setSessionTimeLeft(0);
  };
  
  // Load chat messages from the API
  const loadMessages = async (refresh = false) => {
    try {
      const pageToLoad = refresh ? 1 : page;
      const endpoint = `/chat/messages/${chatId}?page=${pageToLoad}&limit=20`;
      
      if (refresh) {
        setIsLoading(true);
      } else if (page > 1) {
        setIsLoadingMore(true);
      }
      
      const response = await apiService.makeRequest(endpoint, 'GET');
      
      if (response.success && response.messages) {
        if (refresh || pageToLoad === 1) {
          setMessages(response.messages);
        } else {
          setMessages(prev => [...response.messages, ...prev]);
        }
        
        setHasMoreMessages(response.hasMore || false);
        
        if (refresh) {
          setPage(1);
        } else if (pageToLoad === 1) {
          setPage(2);
        } else {
          setPage(pageToLoad + 1);
        }
      } else {
        console.error('Failed to load messages:', response.message);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };
  
  // Load more messages when user scrolls to top
  const loadMoreMessages = async () => {
    if (hasMoreMessages && !isLoadingMore) {
      await loadMessages();
    }
  };
  
  // Scroll to bottom whenever new messages are added
  useEffect(() => {
    if (messages.length > 0 && !isLoadingMore) {
      scrollToBottom();
    }
  }, [messages, isLoadingMore]);
  
  const scrollToBottom = () => {
    if (contentRef.current) {
      contentRef.current.scrollToBottom(300);
    }
  };
  
  const formatTime = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const startSessionTimer = () => {
    sessionTimerRef.current = setInterval(() => {
      setSessionTimeLeft(prev => {
        if (prev <= 1) {
          // Session time expired
          clearInterval(sessionTimerRef.current!);
          // Notify server about session expiration
          apiService.makeRequest('/chat/session-expired', 'POST', { chatId });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };
  
  // Handle user typing notification
  const handleTyping = () => {
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Emit typing event
    socket.emit('typing', { 
      chatId, 
      userId: currentUser?.id 
    });
    
    // Set timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stopTyping', { 
        chatId, 
        userId: currentUser?.id 
      });
    }, 3000);
  };
  
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioRecorderRef.current = recorder;
      audioChunksRef.current = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        
        // In a real app, upload to server
        sendAudioMessage(audioBlob);
        
        // Stop all audio tracks
        stream.getAudioTracks().forEach(track => track.stop());
      };
      
      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer for recording duration
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
      setToastMessage('Could not access microphone. Please check permissions.');
      setShowToast(true);
    }
  };
  
  const stopRecording = () => {
    if (audioRecorderRef.current && isRecording) {
      audioRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };
  
  const sendMessage = async () => {
    if (!message.trim() || sending) return;
    
    try {
      setSending(true);
      
      const messageData = {
        recipientId: chatId,
        text: message,
        isGhost: selectedGhostTime !== null,
        ghostDuration: selectedGhostTime,
        type: 'text'
      };
      
      // Optimistically add message to UI
      const tempId = `temp-${Date.now()}`;
      const tempMessage: Message = {
        id: tempId,
        text: message,
        senderId: currentUser?.id || '',
        recipientId: chatId,
        timestamp: Date.now(),
        isRead: false,
        isGhost: selectedGhostTime !== null,
        type: 'text',
        isDelivered: false
      };
      
      setMessages(prev => [...prev, tempMessage]);
      setMessage('');
      setSelectedGhostTime(null);
      setShowGhostOptions(false);
      
      // Actually send the message
      const response = await apiService.makeRequest('/chat/send', 'POST', messageData);
      
      if (response.success) {
        // Update the message with server data
        setMessages(prev => 
          prev.map(msg => 
            msg.id === tempId ? { 
              ...msg, 
              id: response.messageId, 
              isDelivered: true 
            } : msg
          )
        );
      } else {
        // Handle error - mark message as failed
        setMessages(prev => 
          prev.map(msg => 
            msg.id === tempId ? { 
              ...msg, 
              text: msg.text + ' (Failed to send)' 
            } : msg
          )
        );
        setToastMessage('Failed to send message');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setToastMessage('Failed to send message');
      setShowToast(true);
    } finally {
      setSending(false);
    }
  };
  
  const sendAudioMessage = async (audioBlob: Blob) => {
    try {
      setSending(true);
      
      // Create form data for file upload
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');
      formData.append('recipientId', chatId);
      formData.append('isGhost', selectedGhostTime !== null ? 'true' : 'false');
      if (selectedGhostTime !== null) {
        formData.append('ghostDuration', selectedGhostTime.toString());
      }
      
      // Optimistically add message to UI with temporary URL
      const tempId = `temp-${Date.now()}`;
      const tempUrl = URL.createObjectURL(audioBlob);
      
      const tempMessage: Message = {
        id: tempId,
        audioUrl: tempUrl,
        senderId: currentUser?.id || '',
        recipientId: chatId,
        timestamp: Date.now(),
        isRead: false,
        isGhost: selectedGhostTime !== null,
        type: 'audio',
        isDelivered: false
      };
      
      setMessages(prev => [...prev, tempMessage]);
      setSelectedGhostTime(null);
      setShowGhostOptions(false);
      
      // Send to server
      const response = await apiService.makeRequest('/chat/send-audio', 'POST', formData);
      
      if (response.success) {
        // Update the message with server data
        setMessages(prev => 
          prev.map(msg => 
            msg.id === tempId ? { 
              ...msg, 
              id: response.messageId, 
              audioUrl: response.audioUrl,
              isDelivered: true 
            } : msg
          )
        );
      } else {
        // Handle error - mark message as failed
        setMessages(prev => 
          prev.filter(msg => msg.id !== tempId)
        );
        setToastMessage('Failed to send audio message');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Error sending audio message:', error);
      setToastMessage('Failed to send audio message');
      setShowToast(true);
    } finally {
      setSending(false);
    }
  };
  
  const handleAddFriend = async () => {
    if (!otherUser) return;
    
    // Check if already friends
    if (otherUser.isAdded) {
      setToastMessage('Already in your favorites');
      setShowToast(true);
      return;
    }
    
    setShowAddFriendConfirm(true);
  };
  
  const confirmAddFriend = async () => {
    try {
      const response = await apiService.makeRequest('/friend/request/send', 'POST', { 
        userId: chatId 
      });
      
      if (response.success) {
        setToastMessage('Friend request sent!');
        setShowToast(true);
        
        // Update local state
        setOtherUser(prev => prev ? { ...prev, isAdded: true } : null);
      } else {
        setToastMessage(response.message || 'Failed to send friend request');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      setToastMessage('Error sending friend request');
      setShowToast(true);
    } finally {
      setShowAddFriendConfirm(false);
    }
  };
  
  const handleClearChat = async () => {
    try {
      const response = await apiService.makeRequest('/chat/clear', 'POST', {
        chatId
      });
      
      if (response.success) {
        setMessages([]);
        setToastMessage('Chat cleared');
        setShowToast(true);
      } else {
        setToastMessage(response.message || 'Failed to clear chat');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Error clearing chat:', error);
      setToastMessage('Error clearing chat');
      setShowToast(true);
    }
  };
  
  const formatMessageTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const getSessionTimePercentage = (): number => {
    // 3600 seconds (1 hour) is the total time for free users
    return sessionTimeLeft / 3600;
  };
  
  const handleViewProfile = () => {
    history.push(`/profile/${chatId}`);
  };

  return (
    <IonPage className="private-chat-session">
      <IonHeader className="ion-no-border chat-header">
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/chat-individual" />
          </IonButtons>
          
          <IonTitle className="chat-title">
            {isLoading ? (
              <div className="user-info-skeleton">
                <IonSpinner name="dots" />
              </div>
            ) : otherUser ? (
              <div className="user-info" onClick={() => setShowActionSheet(true)}>
                <IonAvatar className="user-avatar">
                  <img 
                    src={otherUser.avatar || 'https://ionicframework.com/docs/img/demos/avatar.svg'} 
                    alt={otherUser.name}
                    onError={(e) => {
                      e.currentTarget.src = 'https://ionicframework.com/docs/img/demos/avatar.svg';
                    }}
                  />
                  {otherUser.isOnline && <div className="online-indicator"></div>}
                </IonAvatar>
                <div className="user-status">
                  <h2>{otherUser.name}</h2>
                  <p>
                    {otherUser.isTyping ? 'Typing...' : (
                      otherUser.isOnline ? 'Online' : otherUser.lastSeen ? 
                        `Last seen ${formatTime(Math.floor((Date.now() - otherUser.lastSeen) / 1000))} ago` : 
                        'Offline'
                    )}
                  </p>
                </div>
              </div>
            ) : (
              <div className="user-info">
                <div className="user-status">
                  <h2>Chat</h2>
                </div>
              </div>
            )}
          </IonTitle>
          
          <IonButtons slot="end">
            <IonButton onClick={() => setShowActionSheet(true)}>
              <IonIcon slot="icon-only" icon={ellipsisHorizontal} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
        
        {!isPro && (
          <div className="session-timer">
            <IonProgressBar value={getSessionTimePercentage()} color={
              sessionTimeLeft > 1800 ? "success" : 
              sessionTimeLeft > 600 ? "warning" : "danger"
            } />
            <div className="timer-text">
              <IonIcon icon={timeOutline} />
              <IonText color={
                sessionTimeLeft > 1800 ? "success" :
                sessionTimeLeft > 600 ? "warning" : "danger"
              }>
                {sessionTimeLeft <= 0 ? 'Session expired' : 'Session active'}
              </IonText>
              <IonIcon icon={lockClosedOutline} />
              <IonText>Session time: {formatTime(sessionTimeLeft)}</IonText>
              <IonButton fill="clear" size="small" routerLink="/billing">
                <IonText color="primary">Upgrade</IonText>
              </IonButton>
            </div>
          </div>
        )}
      </IonHeader>

      <IonContent 
        ref={contentRef} 
        className="chat-content"
        scrollEvents={true}
        onIonScroll={(e) => {
          // Check if scrolled to top to load more messages
          if (e.detail.scrollTop < 50 && hasMoreMessages && !isLoadingMore) {
            loadMoreMessages();
          }
        }}
      >
        {isLoading ? (
          <div className="loading-container">
            <IonSpinner name="crescent" />
            <p>Loading messages...</p>
          </div>
        ) : (
          <div className="message-container">
            {isLoadingMore && (
              <div className="loading-more">
                <IonSpinner name="dots" />
              </div>

            )}
            
            {messages.length === 0 && (
              <div className="no-messages">
                <IonIcon icon={chatbubble} />
                <p>No messages yet</p>
                <p className="hint">Start the conversation by sending a message</p>
              </div>
            )}
            
            {messages.map((msg) => (
              <div 
                key={msg.id}
                className={`message ${msg.senderId === currentUser?.id ? 'sent' : 'received'} ${msg.isGhost ? 'ghost-message' : ''}`}
              >
                {msg.type === 'text' && (
                  <div className="message-bubble">
                    {msg.text}
                    {msg.isGhost && (
                      <div className="ghost-indicator">
                        <IonIcon icon={timerOutline} />
                        <span>Ghost message</span>
                      </div>
                    )}
                  </div>
                )}

                {msg.type === 'audio' && (
                  <div className="audio-message">
                    <IonIcon icon={volumeHighOutline} className="audio-icon" />
                    <div className="audio-waveform">
                      {/* This would be a real waveform component in a real app */}
                      <div className="waveform-placeholder"></div>
                    </div>
                    <audio
                      src={msg.audioUrl}
                      controls
                      className="audio-player"
                    />
                  </div>
                )}

                <div className="message-meta">
                  <span className="message-time">{formatMessageTime(msg.timestamp)}</span>
                  {msg.senderId === currentUser?.id && (
                    <span className="message-status">
                      {msg.id.startsWith('temp-') ? (
                        <IonSpinner name="dots" />
                      ) : (
                        <IonIcon icon={msg.isRead ? checkmarkDoneOutline : (msg.isDelivered ? checkmarkOutline : alertCircleOutline)} />
                      )}
                    </span>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </IonContent>

      <IonFooter className="chat-footer">
        {isRecording ? (
          <div className="recording-container">
            <div className="recording-indicator">
              <div className="recording-pulse"></div>
              <IonText color="danger">Recording: {formatTime(recordingTime)}</IonText>
            </div>
            <IonButtons>
              <IonButton onClick={stopRecording} color="danger">
                <IonIcon icon={stopCircleOutline} />
              </IonButton>
              <IonButton onClick={() => {
                stopRecording(); // Stop recording first
                // Optionally clear audio chunks if needed
                audioChunksRef.current = []; 
                setToastMessage('Recording cancelled');
                setShowToast(true);
              }}>
                <IonIcon icon={trashOutline} />
              </IonButton>
            </IonButtons>
          </div>
        ) : (
          <div className="input-container">
            <IonButton 
              fill="clear" 
              className="ghost-toggle"
              color={selectedGhostTime !== null ? "primary" : "medium"}
              onClick={() => setShowGhostOptions(!showGhostOptions)}
              disabled={sessionTimeLeft <= 0 && !isPro}
            >
              <IonIcon icon={timerOutline} />
            </IonButton>
            
            <IonTextarea
              placeholder={sessionTimeLeft <= 0 && !isPro ? "Session expired. Upgrade to Pro!" : "Type a message..."}
              value={message}
              onIonChange={e => setMessage(e.detail.value || '')}
              onIonInput={handleTyping}
              autoGrow={true}
              rows={1}
              className="message-input"
              disabled={sessionTimeLeft <= 0 && !isPro}
            />
            
            {message.trim() ? (
              <IonButton 
                fill="clear" 
                onClick={sendMessage} 
                className="send-button"
                disabled={(sessionTimeLeft <= 0 && !isPro) || sending}
              >
                {sending ? <IonSpinner name="dots" /> : <IonIcon icon={send} />}
              </IonButton>
            ) : (
              <IonButton 
                fill="clear" 
                onClick={startRecording} 
                className="mic-button"
                disabled={sessionTimeLeft <= 0 && !isPro}
              >
                <IonIcon icon={micOutline} />
              </IonButton>
            )}
          </div>
        )}
        
        {showGhostOptions && (
          <div className="ghost-options">
            <p className="ghost-title">
              <IonIcon icon={timerOutline} />
              Set ghost message time
            </p>
            <div className="time-options">
              <IonChip 
                onClick={() => setSelectedGhostTime(10)} 
                color={selectedGhostTime === 10 ? "primary" : "medium"}
              >
                <IonLabel>10s</IonLabel>
              </IonChip>
              <IonChip 
                onClick={() => setSelectedGhostTime(30)} 
                color={selectedGhostTime === 30 ? "primary" : "medium"}
              >
                <IonLabel>30s</IonLabel>
              </IonChip>
              <IonChip 
                onClick={() => setSelectedGhostTime(60)} 
                color={selectedGhostTime === 60 ? "primary" : "medium"}
              >
                <IonLabel>1m</IonLabel>
              </IonChip>
              <IonChip 
                onClick={() => setSelectedGhostTime(300)} 
                color={selectedGhostTime === 300 ? "primary" : "medium"}
              >
                <IonLabel>5m</IonLabel>
              </IonChip>
              <IonChip 
                onClick={() => setSelectedGhostTime(null)} 
                color={selectedGhostTime === null ? "danger" : "medium"}
              >
                <IonIcon icon={trashOutline} />
                <IonLabel>Off</IonLabel>
              </IonChip>
            </div>
          </div>
        )}
      </IonFooter>

      <IonActionSheet
        isOpen={showActionSheet}
        onDidDismiss={() => setShowActionSheet(false)}
        buttons={[
          {
            text: 'View Profile',
            icon: personAddOutline,
            handler: handleViewProfile
          },
          {
            text: otherUser?.isAdded ? 'Already in Favorites' : 'Add to Favorites',
            icon: personAddOutline,
            handler: handleAddFriend,
            disabled: otherUser?.isAdded
          },
          {
            text: 'Clear Chat',
            icon: trashOutline,
            role: 'destructive',
            handler: handleClearChat
          },
          {
            text: 'Cancel',
            role: 'cancel'
          }
        ]}
      />

      <IonActionSheet
        isOpen={showAddFriendConfirm}
        onDidDismiss={() => setShowAddFriendConfirm(false)}
        header="Send Friend Request?"
        subHeader="They will need to accept your request before being added to your favorites"
        buttons={[
          {
            text: 'Send Request',
            icon: personAddOutline,
            handler: confirmAddFriend
          },
          {
            text: 'Cancel',
            role: 'cancel'
          }
        ]}
      />

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={2000}
        position="top"
      />
    </IonPage>
  );
};

export default PrivateChatSession;