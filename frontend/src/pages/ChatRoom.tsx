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
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonSearchbar,
  IonList,
  IonItem,
  IonAvatar,
  IonBadge,
  IonFab,
  IonFabButton,
  IonModal,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonToggle,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonText
} from '@ionic/react';
import { 
  chatbubble, 
  people, 
  add, 
  ellipsisVertical, 
  lockClosed,
  globe,
  personAdd,
  sunny,
  moon,
  createOutline
} from 'ionicons/icons';
import { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import './ChatRoom.css';
import { themeService } from '../services/ThemeService';
import LoginPrompt from '../components/LoginPrompt';
import { appwriteService } from '../services/AppwriteService';

interface Room {
  id: number;
  name: string;
  description: string;
  members: number;
  isPrivate: boolean;
  lastActivity: string;
}

const ChatRoom: React.FC = () => {
  const history = useHistory();
  const [darkMode, setDarkMode] = useState(themeService.getDarkMode());
  const [segment, setSegment] = useState<'public' | 'private'>('public');
  const [searchText, setSearchText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState<boolean>(false);
  const [createRoomData, setCreateRoomData] = useState({
    name: '',
    description: '',
    isPrivate: false,
    requireLogin: true,
    chatType: 'discussion'
  });

  useEffect(() => {
    const checkAuth = async () => {
      const user = await appwriteService.getCurrentUser();
      setIsLoggedIn(!!user);
    };
    checkAuth();
  }, []);

  // Handle segment change - show login prompt or modal when switching to private
  const handleSegmentChange = (value: 'public' | 'private') => {
    setSegment(value);
    
    // If switching to private segment, check authentication
    if (value === 'private') {
      if (!isLoggedIn) {
        setShowLoginPrompt(true);
      }
    }
  };

  const handleToggleTheme = () => {
    const isDark = themeService.toggleTheme();
    setDarkMode(isDark);
  };

  const handleRoomClick = (room: Room) => {
    if (room.isPrivate && !isLoggedIn) {
      setShowLoginPrompt(true);
      return;
    }
    history.push(`/chat-room/${room.id}`);
  };
  
  // Reset form data when opening modal
  const openCreateModal = (initialPrivate = false) => {
    if (!isLoggedIn) {
      setShowLoginPrompt(true);
      return;
    }

    // Reset form data
    setCreateRoomData({
      name: '',
      description: '',
      isPrivate: initialPrivate, // Set initial private state
      requireLogin: true,
      chatType: 'discussion'
    });
    
    setIsModalOpen(true);
  };

  const handleCreateRoom = async () => {
    if (!isLoggedIn) {
      setShowLoginPrompt(true);
      return;
    }

    try {
      const user = await appwriteService.getCurrentUser();
      if (!user) return;

      await appwriteService.createChatRoom(
        createRoomData.name,
        createRoomData.description,
        createRoomData.isPrivate,
        user.$id,
        createRoomData.chatType,
        createRoomData.requireLogin
      );

      setIsModalOpen(false);
      
      // Update UI - in a real app you would fetch rooms again
      // For now we'll just show a message that would normally be handled by automatic refetch
      alert('Room created successfully!');
    } catch (error) {
      console.error('Error creating room:', error);
    }
  };

  const handleInputChange = (e: any) => {
    const { name, value, checked } = e.target;
    setCreateRoomData(prev => ({
      ...prev,
      [name]: name === 'isPrivate' || name === 'requireLogin' ? checked : value
    }));
  };

  const handleLogin = () => {
    setShowLoginPrompt(false);
    history.push('/login');
  };

  const handleRegister = () => {
    setShowLoginPrompt(false);
    history.push('/register');
  };

  const publicRooms: Room[] = [
    {
      id: 1,
      name: 'General Chat',
      description: 'Open discussion about anything',
      members: 124,
      isPrivate: false,
      lastActivity: '1m ago'
    },
    {
      id: 2,
      name: 'Music Lovers',
      description: 'Share your favorite tunes',
      members: 56,
      isPrivate: false,
      lastActivity: '5m ago'
    },
    {
      id: 3,
      name: 'Technology Talk',
      description: 'Discuss the latest tech',
      members: 87,
      isPrivate: false,
      lastActivity: '2m ago'
    },
    {
      id: 4,
      name: 'Movie Buffs',
      description: 'Film discussions and recommendations',
      members: 42,
      isPrivate: false,
      lastActivity: '15m ago'
    }
  ];

  const privateRooms: Room[] = [
    {
      id: 5,
      name: 'Project Alpha',
      description: 'Team coordination for Project Alpha',
      members: 8,
      isPrivate: true,
      lastActivity: '30s ago'
    },
    {
      id: 6,
      name: 'Friends Only',
      description: 'Private chat for close friends',
      members: 12,
      isPrivate: true,
      lastActivity: '1h ago'
    }
  ];

  const filteredRooms = segment === 'public'
    ? publicRooms.filter(room => room.name.toLowerCase().includes(searchText.toLowerCase()))
    : privateRooms.filter(room => room.name.toLowerCase().includes(searchText.toLowerCase()));

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Chat Rooms</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleToggleTheme}>
              <IonIcon slot="icon-only" icon={darkMode ? sunny : moon} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
        <IonToolbar>
          <IonSegment value={segment} onIonChange={e => handleSegmentChange(e.detail.value as 'public' | 'private')}>
            <IonSegmentButton value="public">
              <IonIcon icon={globe} />
              <IonLabel>Public</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="private">
              <IonIcon icon={lockClosed} />
              <IonLabel>Private</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
        <IonToolbar>
          <IonSearchbar 
            value={searchText} 
            onIonChange={e => setSearchText(e.detail.value!)}
            placeholder="Search rooms"
          />
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        {/* Create Room Button at the top */}
        <div className="create-room-button-container">
          <IonButton 
            expand="block" 
            onClick={() => openCreateModal(segment === 'private')}
            color="primary"
            className="create-room-main-button"
          >
            <IonIcon slot="start" icon={createOutline} />
            Create New Chat Room
          </IonButton>
        </div>

        {/* Room list */}
        {filteredRooms.length > 0 ? (
          <IonList>
            {filteredRooms.map(room => (
              <IonItem key={room.id} onClick={() => handleRoomClick(room)} detail={true}>
                <IonAvatar slot="start">
                  {room.isPrivate ? (
                    <div className="room-avatar private">
                      <IonIcon icon={lockClosed} />
                    </div>
                  ) : (
                    <div className="room-avatar public">
                      <IonIcon icon={people} />
                    </div>
                  )}
                </IonAvatar>
                <IonLabel>
                  <h2>{room.name}</h2>
                  <p>{room.description}</p>
                  <span className="room-last-activity">{room.lastActivity}</span>
                </IonLabel>
                <IonBadge color="primary" slot="end">{room.members}</IonBadge>
              </IonItem>
            ))}
          </IonList>
        ) : (
          <div className="no-rooms-container">
            <IonCard className="no-rooms-card">
              <IonCardHeader>
                {segment === 'private' ? 'No Private Rooms' : 'No Public Rooms'}
              </IonCardHeader>
              <IonCardContent>
                <p>
                  {segment === 'private' 
                    ? 'You haven\'t joined any private rooms yet.' 
                    : 'No public rooms found with that search term.'}
                </p>
                <IonButton 
                  expand="block" 
                  onClick={() => openCreateModal(segment === 'private')}
                >
                  Create a {segment === 'private' ? 'Private' : 'Public'} Room
                </IonButton>
              </IonCardContent>
            </IonCard>
          </div>
        )}

        {/* Create Room FAB Button (floating action button) */}
        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => openCreateModal(segment === 'private')}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

        {/* Create Room Modal */}
        <IonModal isOpen={isModalOpen} onDidDismiss={() => setIsModalOpen(false)}>
          <IonHeader>
            <IonToolbar color="primary">
              <IonTitle>Create New Room</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setIsModalOpen(false)}>
                  Cancel
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <div className="create-room-form">
              <IonItem>
                <IonLabel position="floating">Room Name</IonLabel>
                <IonInput 
                  name="name"
                  value={createRoomData.name} 
                  onIonChange={handleInputChange}
                  required
                />
              </IonItem>

              <IonItem>
                <IonLabel position="floating">Description</IonLabel>
                <IonTextarea 
                  name="description"
                  value={createRoomData.description} 
                  onIonChange={handleInputChange}
                  autoGrow={true}
                />
              </IonItem>

              <IonItem lines="none">
                <IonLabel>Private Room</IonLabel>
                <IonToggle 
                  name="isPrivate"
                  checked={createRoomData.isPrivate} 
                  onIonChange={handleInputChange}
                />
              </IonItem>
              
              <IonItem lines="none">
                <IonLabel>Require Login</IonLabel>
                <IonToggle 
                  name="requireLogin"
                  checked={createRoomData.requireLogin} 
                  onIonChange={handleInputChange}
                />
              </IonItem>
              
              <IonItem>
                <IonLabel>Chat Type</IonLabel>
                <IonSelect 
                  name="chatType"
                  value={createRoomData.chatType} 
                  onIonChange={handleInputChange}
                >
                  <IonSelectOption value="discussion">Discussion (Everyone can post)</IonSelectOption>
                  <IonSelectOption value="notice">Notice (Only admins can post)</IonSelectOption>
                </IonSelect>
              </IonItem>

              <div className="room-privacy-info">
                {createRoomData.isPrivate ? (
                  <p className="privacy-note">
                    <IonIcon icon={lockClosed} />
                    Private rooms are only visible to invited members
                  </p>
                ) : (
                  <p className="privacy-note">
                    <IonIcon icon={globe} />
                    Public rooms are visible to everyone
                  </p>
                )}
              </div>

              <IonButton 
                expand="block" 
                className="create-room-button"
                onClick={handleCreateRoom}
                disabled={!createRoomData.name.trim()}
              >
                Create Room
              </IonButton>
            </div>
          </IonContent>
        </IonModal>

        {/* Login Prompt Modal */}
        <LoginPrompt
          isOpen={showLoginPrompt}
          message="Please log in to access private rooms or create your own rooms."
          onDismiss={() => setShowLoginPrompt(false)}
          onLogin={handleLogin}
          onRegister={handleRegister}
        />
      </IonContent>
    </IonPage>
  );
};

export default ChatRoom;