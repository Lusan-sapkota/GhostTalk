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
  IonProgressBar
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
  pulseOutline
} from 'ionicons/icons';
import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './PrivateChatSession.css';

interface Message {
  id: string;
  text?: string;
  senderId: string;
  recipientId: string;
  timestamp: number;
  isRead: boolean;
  isGhost: boolean;
  audioUrl?: string;
  type: 'text' | 'audio' | 'image' | 'file';
  isDelivered: boolean;
}

interface ChatUser {
  id: string;
  name: string;
  avatar: string;
  isOnline: boolean;
  lastSeen?: string;
  isTyping?: boolean;
}

const PrivateChatSession: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const { currentUser, isAuthenticated, isPro } = useAuth();
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
  const contentRef = useRef<HTMLIonContentElement>(null);
  const audioRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Fetch chat and user data on component mount
  useEffect(() => {
    // Simulate API call to get chat data
    const fetchChatData = async () => {
      // Mock data - in real app, this would be an API call
      const mockUser: ChatUser = {
        id: 'user123',
        name: 'Alex Morgan',
        avatar: 'https://ionicframework.com/docs/img/demos/avatar.svg',
        isOnline: true,
        lastSeen: 'Just now',
        isTyping: false
      };
      
      const mockMessages: Message[] = [
        {
          id: '1',
          text: 'Hey, how are you doing?',
          senderId: 'user123',
          recipientId: currentUser?.id || '',
          timestamp: Date.now() - 3600000, // 1 hour ago
          isRead: true,
          isGhost: false,
          type: 'text',
          isDelivered: true
        },
        {
          id: '2',
          text: 'I\'m doing great! Thanks for asking.',
          senderId: currentUser?.id || '',
          recipientId: 'user123',
          timestamp: Date.now() - 3300000, // 55 minutes ago
          isRead: true,
          isGhost: false,
          type: 'text',
          isDelivered: true
        },
        {
          id: '3',
          text: 'Have you checked out the new feature?',
          senderId: 'user123',
          recipientId: currentUser?.id || '',
          timestamp: Date.now() - 1800000, // 30 minutes ago
          isRead: true,
          isGhost: true,
          type: 'text',
          isDelivered: true
        },
        {
          id: '4',
          audioUrl: '/assets/sample-audio.mp3',
          senderId: currentUser?.id || '',
          recipientId: 'user123',
          timestamp: Date.now() - 600000, // 10 minutes ago
          isRead: false,
          isGhost: false,
          type: 'audio',
          isDelivered: true
        }
      ];
      
      setOtherUser(mockUser);
      setMessages(mockMessages);
      
      // Start session timer for free users
      if (!isPro) {
        startSessionTimer();
      }
    };
    
    fetchChatData();
    
    // Cleanup function
    return () => {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      stopRecording();
    };
  }, [chatId, currentUser, isPro]);
  
  // Scroll to bottom whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
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
          setToastMessage('Chat session expired. Upgrade to Pro for unlimited chats!');
          setShowToast(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
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
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // In a real app, you would upload this blob to your server
        sendAudioMessage(audioUrl);
        
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
  
  const sendMessage = () => {
    if (!message.trim()) return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      text: message,
      senderId: currentUser?.id || '',
      recipientId: otherUser?.id || '',
      timestamp: Date.now(),
      isRead: false,
      isGhost: selectedGhostTime !== null,
      type: 'text',
      isDelivered: false
    };
    
    setMessages([...messages, newMessage]);
    setMessage('');
    setSelectedGhostTime(null);
    
    // In a real app, you would send this message to your server
    // And then update the isDelivered status when you get confirmation
    setTimeout(() => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === newMessage.id ? { ...msg, isDelivered: true } : msg
        )
      );
    }, 1000);
  };
  
  const sendAudioMessage = (audioUrl: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      audioUrl,
      senderId: currentUser?.id || '',
      recipientId: otherUser?.id || '',
      timestamp: Date.now(),
      isRead: false,
      isGhost: selectedGhostTime !== null,
      type: 'audio',
      isDelivered: false
    };
    
    setMessages([...messages, newMessage]);
    
    // In a real app, you would upload the audio to your server
    // and then update the message with the server URL
    setTimeout(() => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === newMessage.id ? { ...msg, isDelivered: true } : msg
        )
      );
    }, 1000);
  };
  
  const handleAddFriend = () => {
    setShowAddFriendConfirm(true);
  };
  
  const confirmAddFriend = () => {
    // In a real app, you would call your API to send a friend request
    setToastMessage('Friend request sent!');
    setShowToast(true);
    setShowAddFriendConfirm(false);
  };
  
  const formatMessageTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const getSessionTimePercentage = (): number => {
    // 3600 seconds (1 hour) is the total time for free users
    return sessionTimeLeft / 3600;
  };

  return (
    <IonPage className="private-chat-session">
      <IonHeader className="ion-no-border chat-header">
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/chat-individual" />
          </IonButtons>
          
          <IonTitle className="chat-title">
            <div className="user-info" onClick={() => setShowActionSheet(true)}>
              <IonAvatar className="user-avatar">
                <img src={otherUser?.avatar} alt={otherUser?.name} />
                {otherUser?.isOnline && <div className="online-indicator"></div>}
              </IonAvatar>
              <div className="user-status">
                <h2>{otherUser?.name}</h2>
                <p>{otherUser?.isTyping ? 'Typing...' : (otherUser?.isOnline ? 'Online' : otherUser?.lastSeen)}</p>
              </div>
            </div>
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
                Session time: {formatTime(sessionTimeLeft)}
              </IonText>
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
      >
        <div className="message-container">
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
                  <IonButton fill="clear" size="small" className="play-button">
                    <IonIcon icon={pulseOutline} />
                  </IonButton>
                </div>
              )}
              
              <div className="message-meta">
                <span className="message-time">{formatMessageTime(msg.timestamp)}</span>
                {msg.senderId === currentUser?.id && (
                  <span className="message-status">
                    <IonIcon icon={msg.isRead ? checkmarkDoneOutline : checkmarkOutline} />
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
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
                stopRecording();
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
            >
              <IonIcon icon={timerOutline} />
            </IonButton>
            
            <IonTextarea
              placeholder="Type a message..."
              value={message}
              onIonChange={e => setMessage(e.detail.value || '')}
              autoGrow={true}
              rows={1}
              maxRows={4}
              className="message-input"
            />
            
            {message.trim() ? (
              <IonButton fill="clear" onClick={sendMessage} className="send-button">
                <IonIcon icon={send} />
              </IonButton>
            ) : (
              <IonButton fill="clear" onClick={startRecording} className="mic-button">
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
            handler: () => {
              // Navigate to profile
            }
          },
          {
            text: 'Add to Favorites',
            icon: personAddOutline,
            handler: handleAddFriend
          },
          {
            text: 'Clear Chat',
            icon: trashOutline,
            role: 'destructive',
            handler: () => {
              setMessages([]);
            }
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