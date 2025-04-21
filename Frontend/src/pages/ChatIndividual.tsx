import {
  IonContent,
  IonPage,
  IonButtons,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonAvatar,
  IonLabel,
  IonBadge,
  IonFab,
  IonFabButton,
  IonModal,
  IonInput,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonSegment,
  IonSegmentButton,
  IonToast
} from '@ionic/react';
import { 
  chatbubble, 
  personCircle, 
  add, 
  ellipsisVertical,
  checkmarkCircle,
  qrCodeOutline,
  copy,
  timeOutline
} from 'ionicons/icons';
import { useState, useEffect } from 'react';
import './ChatIndividual.css';
import { themeService } from '../services/ThemeService';
import LoginPrompt from '../components/LoginPrompt';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api.service';
import { useHistory } from 'react-router-dom';
import HeaderComponent from '../components/HeaderComponent';

// Interface definitions
interface Chat {
  id: number;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
}

interface Friend {
  id: string;
  name: string;
  avatar?: string;
  status?: string;
}

const ChatIndividual: React.FC = () => {
  const history = useHistory();
  const { currentUser, isAuthenticated, isPro } = useAuth();
  const [darkMode, setDarkMode] = useState(themeService.getDarkMode());
  const [searchText, setSearchText] = useState('');
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [chatId, setChatId] = useState('');
  const [username, setUsername] = useState('');
  const [contactMethod, setContactMethod] = useState('id');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [showLoginPrompt, setShowLoginPrompt] = useState<boolean>(false);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Update theme state when theme changes
  useEffect(() => {
    const cleanup = themeService.onThemeChange((isDark) => {
      setDarkMode(isDark);
    });
    return cleanup;
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      // Load friends from API
      const loadFriends = async () => {
        try {
          const response = await apiService.makeRequest('/friend/list', 'GET');
          if (response.success) {
            setFriends(response.friends || []);
          }
        } catch (error) {
          console.error('Error loading friends:', error);
        }
      };
      
      loadFriends();
    }
  }, [isAuthenticated]);

  const handleStartPrivateChat = async () => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }
    
    let targetUserId = '';
    
    // Determine which ID to use based on contact method
    if (contactMethod === 'id') {
      // Remove "GHOST-" prefix if present
      targetUserId = chatId.replace(/^GHOST-/i, '');
    } else if (contactMethod === 'username') {
      // Need to look up ID by username
      setIsCreatingChat(true);
      try {
        const response = await apiService.makeRequest(`/search/by-username/${encodeURIComponent(username)}`, 'GET');
        if (response.success && response.user) {
          targetUserId = response.user.id;
        } else {
          setToastMessage('User not found with that username');
          setShowToast(true);
          setIsCreatingChat(false);
          return;
        }
      } catch (error) {
        console.error('Error searching for user:', error);
        setToastMessage('Failed to find user. Please try again.');
        setShowToast(true);
        setIsCreatingChat(false);
        return;
      }
    }
    
    if (!targetUserId) {
      setToastMessage('Please enter a valid user ID or username');
      setShowToast(true);
      return;
    }
    
    // Close modal and navigate to chat
    setIsNewChatModalOpen(false);
    
    // Navigate to chat session with this user
    history.push(`/chat-individual/${targetUserId}`);
    
    // Reset form
    setChatId('');
    setUsername('');
    setContactMethod('id');
    setIsCreatingChat(false);
  };

  const handleChatClick = (chatId: number) => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }
    
    history.push(`/chat-individual/${chatId}`);
  };

  const handleSearchChange = (value: string) => {
    setSearchText(value);
  };

  const handleScanQRCode = () => {
    // Implement QR scanning functionality
    setToastMessage('QR scanning coming soon');
    setShowToast(true);
  };

  // Mock chats data
  const chats: Chat[] = [
    {
      id: 1,
      name: 'John Doe',
      avatar: 'https://ionicframework.com/docs/img/demos/avatar.svg',
      lastMessage: 'Hey, how are you doing?',
      time: '5m ago',
      unread: 2,
      online: true
    },
    {
      id: 2,
      name: 'Sarah Smith',
      avatar: 'https://ionicframework.com/docs/img/demos/avatar.svg',
      lastMessage: 'Let me know when you receive the files',
      time: '1h ago',
      unread: 0,
      online: true
    },
    {
      id: 3,
      name: 'Michael Johnson',
      avatar: 'https://ionicframework.com/docs/img/demos/avatar.svg',
      lastMessage: 'Can we schedule a meeting tomorrow?',
      time: '3h ago',
      unread: 1,
      online: false
    }
  ];

  // Filter chats based on search text
  const filteredChats = searchText
    ? chats.filter(chat =>
        chat.name.toLowerCase().includes(searchText.toLowerCase())
      )
    : chats;

  return (
    <IonPage>
      <HeaderComponent 
        title="Chats" 
        showSearch={true} 
        onSearchChange={handleSearchChange} 
        searchPlaceholder="Search chats..."
      />
      
      <IonContent>
        {filteredChats.length > 0 ? (
          <IonList className="chat-list">
            {filteredChats.map((chat) => (
              <IonItem 
                key={chat.id} 
                className={`chat-item staggered-item ${chat.unread > 0 ? 'has-unread' : ''}`} 
                onClick={() => handleChatClick(chat.id)}
                lines="none"
              >
                <IonAvatar slot="start" className="chat-avatar">
                  <img src={chat.avatar} alt={chat.name} />
                  {chat.online && <div className="online-indicator-chatindividual"></div>}
                </IonAvatar>
                <IonLabel>
                  <h2>{chat.name}</h2>
                  <p>{chat.lastMessage}</p>
                </IonLabel>
                <div className="chat-meta">
                  <span className="chat-time">{chat.time}</span>
                  {chat.unread > 0 && (
                    <IonBadge color="primary" className="unread-badge">{chat.unread}</IonBadge>
                  )}
                </div>
              </IonItem>
            ))}
          </IonList>
        ) : (
          <div className="no-chats-container ghost-appear">
            <IonIcon icon={chatbubble} />
            <h4>No chats found</h4>
            <p>Start a new chat or modify your search.</p>
          </div>
        )}

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => setIsNewChatModalOpen(true)} className="ghost-shadow">
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

        {/* Chat Creation Modal */}
        <IonModal isOpen={isNewChatModalOpen} onDidDismiss={() => setIsNewChatModalOpen(false)}>
          <IonHeader>
            <IonToolbar color="primary">
              <IonTitle>Start New Chat</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setIsNewChatModalOpen(false)}>
                  Cancel
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          
          <IonContent className="ion-padding">
            <div className="new-chat-info">
              <IonIcon icon={personCircle} color="primary" />
              <p>Connect with someone by entering their username or ID, or select from your favorites.</p>
            </div>
            
            {/* Session time info for free users */}
            {isAuthenticated && !isPro && (
              <div className="session-info">
                <IonIcon icon={timeOutline} color="warning" />
                <p>Free users have 1-hour chat sessions. <IonButton fill="clear" size="small" routerLink="/billing">Upgrade to Pro</IonButton></p>
              </div>
            )}
            
            {/* Segment to toggle between ID, username and favorites */}
            <IonSegment value={contactMethod} onIonChange={e => setContactMethod(e.detail.value as string)}>
              <IonSegmentButton value="id">
                <IonLabel>By ID</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="username">
                <IonLabel>By Username</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="favorites">
                <IonLabel>Favorites</IonLabel>
              </IonSegmentButton>
            </IonSegment>
            
            {contactMethod === 'id' && (
              <IonItem className="chat-id-input">
                <IonInput 
                  value={chatId}
                  onIonChange={e => setChatId(e.detail.value || '')}
                  placeholder="Enter GHOST-ID"
                />
              </IonItem>
            )}
            
            {contactMethod === 'username' && (
              <IonItem className="chat-username-input">
                <IonInput 
                  value={username}
                  onIonChange={e => setUsername(e.detail.value || '')}
                  placeholder="Enter username"
                />
              </IonItem>
            )}
            
            {contactMethod === 'favorites' && (
              <div className="favorites-selection">
                {friends.length > 0 ? (
                  <IonList className="favorites-list">
                    {friends.map((friend) => (
                      <IonItem 
                        key={friend.id}
                        onClick={() => {
                          setChatId(friend.id);
                          setContactMethod('id');
                        }}
                      >
                        <IonAvatar slot="start">
                          {friend.avatar ? (
                            <img src={friend.avatar} alt={friend.name} />
                          ) : (
                            <div className="default-avatar">{friend.name[0]}</div>
                          )}
                          {friend.status === 'Online' && <div className="online-indicator-chatindividual"></div>}
                        </IonAvatar>
                        <IonLabel>{friend.name}</IonLabel>
                      </IonItem>
                    ))}
                  </IonList>
                ) : (
                  <div className="no-favorites">
                    <p>You don't have any favorites yet</p>
                    <IonButton 
                      fill="clear"
                      routerLink="/favorites"
                      onClick={() => setIsNewChatModalOpen(false)}
                    >
                      Add Friends
                    </IonButton>
                  </div>
                )}
              </div>
            )}
            
            <IonButton 
              expand="block"
              className="start-chat-button ghost-shadow"
              onClick={handleStartPrivateChat}
              disabled={
                isCreatingChat || 
                (contactMethod === 'id' && !chatId.trim()) || 
                (contactMethod === 'username' && !username.trim())
              }
            >
              {isCreatingChat ? 'Creating Chat...' : (
                <>
                  <IonIcon slot="start" icon={chatbubble} />
                  Start Chat
                </>
              )}
            </IonButton>
            
            <div className="separator">
              <span>OR</span>
            </div>
            
            <IonButton 
              expand="block" 
              fill="outline"
              className="scan-code-button"
              onClick={handleScanQRCode}
            >
              <IonIcon slot="start" icon={qrCodeOutline} />
              Scan QR Code
            </IonButton>
            
            <div className="id-share-container">
              <h4>Share your Chat ID</h4>
              <div className="user-id-display">
                <span className="user-id">{currentUser?.id ? `GHOST-${currentUser.id}` : 'Login to see your ID'}</span>
                {currentUser?.id && (
                  <IonButton 
                    fill="clear" 
                    size="small"
                    onClick={() => {
                      navigator.clipboard.writeText(`GHOST-${currentUser.id}`);
                      setToastMessage('ID copied to clipboard');
                      setShowToast(true);
                    }}
                  >
                    <IonIcon icon={copy} slot="icon-only" />
                  </IonButton>
                )}
              </div>
            </div>
          </IonContent>
        </IonModal>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
          position="top"
        />

        <LoginPrompt 
          isOpen={showLoginPrompt}
          onClose={() => setShowLoginPrompt(false)}
          message="You need to be logged in to chat with users."
        />
      </IonContent>
    </IonPage>
  );
};

export default ChatIndividual;