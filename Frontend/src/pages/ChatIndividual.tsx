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
  IonFooter,
  IonTextarea,
  IonHeader,
  IonToolbar,
  IonTitle
} from '@ionic/react';
import { 
  chatbubble, 
  personCircle, 
  add, 
  ellipsisVertical,
  checkmarkCircle
} from 'ionicons/icons';
import { useState, useEffect } from 'react';
import './ChatIndividual.css';
import { themeService } from '../services/ThemeService';
import LoginPrompt from '../components/LoginPrompt';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api.service';
import { useHistory } from 'react-router-dom';
import HeaderComponent from '../components/HeaderComponent';

// Interface definitions remain unchanged
interface Chat {
  id: number;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
}

const ChatIndividual: React.FC = () => {
  const history = useHistory();
  const { currentUser, isAuthenticated, isLoading } = useAuth();
  const [darkMode, setDarkMode] = useState(themeService.getDarkMode());
  const [searchText, setSearchText] = useState('');
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [chatId, setChatId] = useState('');
  const [showLoginPrompt, setShowLoginPrompt] = useState<boolean>(false);

  // Update theme state when theme changes
  useEffect(() => {
    const cleanup = themeService.onThemeChange((isDark) => {
      setDarkMode(isDark);
    });
    return cleanup;
  }, []);

  const handleStartNewChat = () => {
    console.log(`Starting chat with ID: ${chatId}`);
    setIsNewChatModalOpen(false);
    setChatId('');
  };

  const handleStartPrivateChat = () => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }
    
    handleStartNewChat();
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
    // Filter chats based on search text will happen automatically due to filteredChats calculation
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
    },
    // Add more mock chats here
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
        title="Private Chat" 
        onSearchChange={handleSearchChange} 
        searchPlaceholder="Search chats..."
      />

      <IonContent fullscreen>
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
                  {chat.online && <div className="online-indicator"></div>}
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

        {/* Modal and Login Prompt remain unchanged */}
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
              <p>
                Enter the ID of the person you want to chat with. You can share your own ID
                to let others initiate a chat with you.
              </p>
            </div>
            
            <IonItem className="chat-id-input">
              <IonLabel position="floating">Chat ID</IonLabel>
              <IonInput 
                value={chatId}
                onIonChange={e => setChatId(e.detail.value || '')}
                placeholder="Enter chat ID here"
              />
            </IonItem>
            
            <IonButton 
              expand="block"
              className="start-chat-button ghost-float"
              onClick={handleStartPrivateChat}
              disabled={!chatId.trim()}
            >
              <IonIcon slot="start" icon={chatbubble} />
              Start Chat
            </IonButton>
            
            <div className="id-share-container">
              <h4>Share your Chat ID</h4>
              <div className="user-id-display">
                <span className="user-id">{currentUser?.id || 'Login to see your ID'}</span>
                {currentUser?.id && (
                  <IonButton fill="clear" size="small">
                    <IonIcon icon={checkmarkCircle} slot="icon-only" />
                  </IonButton>
                )}
              </div>
            </div>
          </IonContent>
        </IonModal>

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