import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonMenuButton,
  IonButton,
  IonIcon,
  IonSearchbar,
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
  IonTextarea
} from '@ionic/react';
import { 
  chatbubble, 
  personCircle, 
  add, 
  ellipsisVertical,
  checkmarkCircle,
  searchCircle
} from 'ionicons/icons';
import { useState, useEffect } from 'react';
import './ChatIndividual.css';
import { themeService } from '../services/ThemeService';
import LoginPrompt from '../components/LoginPrompt';
import { appwriteService } from '../services/AppwriteService';

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
  const [darkMode, setDarkMode] = useState(themeService.getDarkMode());
  const [searchText, setSearchText] = useState('');
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [chatId, setChatId] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState<boolean>(false);

  useEffect(() => {
    const checkAuth = async () => {
      const user = await appwriteService.getCurrentUser();
      setIsLoggedIn(!!user);
    };
    
    checkAuth();
  }, []);

  const handleToggleTheme = () => {
    const isDark = themeService.toggleTheme();
    setDarkMode(isDark);
  };

  const handleStartNewChat = () => {
    console.log(`Starting chat with ID: ${chatId}`);
    setIsNewChatModalOpen(false);
    setChatId('');
  };

  const handleStartPrivateChat = () => {
    if (!isLoggedIn) {
      setShowLoginPrompt(true);
      return;
    }
    
    handleStartNewChat();
  };

  const handleChatClick = (chatId: number) => {
    if (!isLoggedIn) {
      setShowLoginPrompt(true);
      return;
    }
    
    history.push(`/chat-individual/${chatId}`);
  };

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
    {
      id: 4,
      name: 'Emma Wilson',
      avatar: 'https://ionicframework.com/docs/img/demos/avatar.svg',
      lastMessage: 'Thanks for your help!',
      time: 'Yesterday',
      unread: 0,
      online: false
    }
  ];

  const filteredChats = chats.filter(chat => 
    chat.name.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Individual Chats</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleToggleTheme}>
              <IonIcon slot="icon-only" icon={ellipsisVertical} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
        <IonToolbar>
          <IonSearchbar 
            value={searchText} 
            onIonChange={e => setSearchText(e.detail.value!)}
            placeholder="Search contacts"
          />
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <IonList>
          {filteredChats.map(chat => (
            <IonItem key={chat.id} routerLink={`/chat-individual/${chat.id}`} detail={true} onClick={() => handleChatClick(chat.id)}>
              <IonAvatar slot="start">
                <div className="avatar-container">
                  <img src={chat.avatar} alt={chat.name} />
                  {chat.online && <div className="online-indicator"></div>}
                </div>
              </IonAvatar>
              <IonLabel>
                <h2>{chat.name}</h2>
                <p>{chat.lastMessage}</p>
                <span className="message-time">{chat.time}</span>
              </IonLabel>
              {chat.unread > 0 && (
                <IonBadge color="primary" slot="end">{chat.unread}</IonBadge>
              )}
            </IonItem>
          ))}
        </IonList>

        <div className="no-chats-message" style={{ display: filteredChats.length === 0 ? 'flex' : 'none' }}>
          <IonIcon icon={chatbubble} />
          <h4>No chats found</h4>
          <p>Start a new chat or modify your search.</p>
        </div>

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => setIsNewChatModalOpen(true)}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

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
                Enter the unique ID of the person you want to chat with.
                They'll need to accept your request first.
              </p>
            </div>
            
            <IonItem>
              <IonLabel position="floating">User ID</IonLabel>
              <IonInput 
                value={chatId} 
                onIonChange={e => setChatId(e.detail.value!)} 
                placeholder="Enter user ID"
                required
              />
            </IonItem>

            <IonButton 
              expand="block" 
              className="start-chat-button"
              onClick={handleStartPrivateChat}
              disabled={!chatId.trim()}
            >
              <IonIcon slot="start" icon={chatbubble} />
              Start Chat
            </IonButton>

            <div className="separator">
              <span>OR</span>
            </div>

            <IonButton 
              expand="block" 
              fill="outline"
              className="scan-code-button"
              onClick={() => console.log('Scan code')}
            >
              <IonIcon slot="start" icon={searchCircle} />
              Scan QR Code
            </IonButton>
          </IonContent>
        </IonModal>

        <LoginPrompt
          isOpen={showLoginPrompt}
          message="Please log in to start private conversations."
          onDismiss={() => setShowLoginPrompt(false)}
          onLogin={() => {
            setShowLoginPrompt(false);
            history.push('/login');
          }}
          onRegister={() => {
            setShowLoginPrompt(false);
            history.push('/register');
          }}
        />
      </IonContent>
    </IonPage>
  );
};

export default ChatIndividual;