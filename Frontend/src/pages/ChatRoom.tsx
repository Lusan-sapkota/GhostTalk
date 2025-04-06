import {
  IonContent,
  IonPage,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonList,
  IonItem,
  IonBadge,
  IonFab,
  IonFabButton,
  IonModal,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonToggle,
  IonIcon,
  IonButton,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons
} from '@ionic/react';
import { 
  chatbubble, 
  people, 
  add, 
  lockClosed,
  globe,
} from 'ionicons/icons';
import { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import './ChatRoom.css';
import { themeService } from '../services/ThemeService';
import LoginPrompt from '../components/LoginPrompt';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api.service';
import HeaderComponent from '../components/HeaderComponent';

// Interface definitions remain unchanged
interface Room {
  id: string;
  name: string;
  description: string;
  lastMessage?: string;
  members: number;
  isPrivate: boolean;
  creatorId: string;
  createdAt?: number;
  requireLogin?: boolean;
  chatType?: string;
}

const ChatRoom: React.FC = () => {
  const history = useHistory();
  const { currentUser, isAuthenticated } = useAuth();
  const [darkMode, setDarkMode] = useState(themeService.getDarkMode());
  const [segment, setSegment] = useState<'public' | 'private'>('public');
  const [searchText, setSearchText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState<boolean>(false);
  const [createRoomData, setCreateRoomData] = useState({
    name: '',
    description: '',
    isPrivate: false,
    requireLogin: true,
    chatType: 'discussion'
  });

  // Set up theme listener
  useEffect(() => {
    const cleanup = themeService.onThemeChange((isDark) => {
      setDarkMode(isDark);
    });
    return cleanup;
  }, []);

  // Handle segment change - show login prompt or modal when switching to private
  const handleSegmentChange = (value: 'public' | 'private') => {
    setSegment(value);
    
    // If switching to private segment, check authentication
    if (value === 'private') {
      if (!isAuthenticated) {
        setShowLoginPrompt(true);
      }
    }
  };

  const handleRoomClick = (room: Room) => {
    if (room.isPrivate && !isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }
    history.push(`/chat-room/${room.id}`);
  };
  
  // Reset form data when opening modal
  const openCreateModal = (initialPrivate = false) => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }

    // Reset form data
    setCreateRoomData({
      name: '',
      description: '',
      isPrivate: initialPrivate,
      requireLogin: true,
      chatType: 'discussion'
    });
    
    setIsModalOpen(true);
  };

  const handleCreateRoom = async () => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }

    try {
      // Use our API service instead of direct Appwrite calls
      const response = await apiService.createRoom(
        createRoomData.name,
        createRoomData.description,
        createRoomData.isPrivate,
        createRoomData.requireLogin,
        createRoomData.chatType
      );

      if (response.success) {
        setIsModalOpen(false);
        // In a real app, we would refresh the list of rooms here
        alert('Room created successfully!');
      } else {
        alert(`Failed to create room: ${response.message}`);
      }
    } catch (error) {
      console.error('Error creating room:', error);
      alert('Failed to create room due to a network error.');
    }
  };

  const handleInputChange = (e: any) => {
    const { name, value, checked } = e.target;
    
    // Handle toggle inputs differently
    if (name === 'isPrivate' || name === 'requireLogin') {
      setCreateRoomData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setCreateRoomData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchText(value);
    // Filter results will happen automatically through filteredRooms
  };

  // Sample rooms data
  const roomsData: Room[] = [
    {
      id: '1',
      name: 'Tech Talk',
      description: 'Discuss the latest in technology',
      lastMessage: 'Have you tried the new React 18?',
      members: 124,
      isPrivate: false,
      creatorId: 'user1'
    },
    {
      id: '2',
      name: 'Gaming Community',
      description: 'For gamers and gaming enthusiasts',
      lastMessage: 'Anyone playing the new Zelda game?',
      members: 89,
      isPrivate: false,
      creatorId: 'user2'
    },
    {
      id: '3',
      name: 'Book Club',
      description: 'Discuss books and literature',
      lastMessage: 'Our next book will be "Dune"',
      members: 34,
      isPrivate: false,
      creatorId: 'user3'
    },
    {
      id: '4',
      name: 'Movie Buffs',
      description: 'All things cinema',
      lastMessage: 'Did you watch the Oscars?',
      members: 56,
      isPrivate: false,
      creatorId: 'user4'
    },
    {
      id: '5',
      name: 'Dev Team',
      description: 'Private developer discussions',
      lastMessage: 'Meeting at 3pm tomorrow',
      members: 8,
      isPrivate: true,
      creatorId: 'user1'
    }
  ];

  // Filter rooms based on search and segment
  const filteredRooms = roomsData
    .filter(room => room.isPrivate === (segment === 'private'))
    .filter(room => 
      searchText ? 
        room.name.toLowerCase().includes(searchText.toLowerCase()) : 
        true
    );

  return (
    <IonPage className="ghost-appear">
      <HeaderComponent 
        title="Chat Rooms" 
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search rooms..."
      />
      
      <IonContent fullscreen>
        <div className="segment-container ghost-appear">
          <IonSegment value={segment} onIonChange={e => handleSegmentChange(e.detail.value as 'public' | 'private')}>
            <IonSegmentButton value="public">
              <IonLabel>Public Rooms</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="private">
              <IonLabel>Private Rooms</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </div>

        {filteredRooms.length > 0 ? (
          <IonList className="room-list">
            {filteredRooms.map((room, index) => (
              <IonItem 
                key={room.id} 
                className="room-item staggered-item ghost-shadow" 
                onClick={() => handleRoomClick(room)}
                lines="none"
              >
                <div className="room-content">
                  <div className="room-header">
                    <h2>{room.name}</h2>
                    {room.isPrivate && <IonIcon icon={lockClosed} color="medium" />}
                  </div>
                  <p className="room-description">{room.description}</p>
                  {room.lastMessage && <p className="room-last-message">{room.lastMessage}</p>}
                  <div className="room-meta">
                    <span className="member-count">
                      <IonIcon icon={people} /> {room.members} members
                    </span>
                  </div>
                </div>
              </IonItem>
            ))}
          </IonList>
        ) : (
          <div className="no-rooms-container ghost-appear">
            <IonIcon icon={chatbubble} />
            <h4>No rooms found</h4>
            <p>{segment === 'public' ? 'Create a new public room!' : 'Create a new private room!'}</p>
            <IonButton 
              className="create-first-room ghost-float"
              onClick={() => openCreateModal(segment === 'private')}
            >
              <IonIcon slot="start" icon={add} />
              Create Room
            </IonButton>
          </div>
        )}

        {/* FAB for creating new rooms */}
        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton 
            onClick={() => openCreateModal(segment === 'private')}
            className="ghost-shadow"
          >
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
                <IonLabel position="floating">Room Name*</IonLabel>
                <IonInput 
                  name="name"
                  value={createRoomData.name} 
                  onIonChange={handleInputChange}
                  placeholder="Enter a name for your room"
                  required
                />
              </IonItem>

              <IonItem>
                <IonLabel position="floating">Description</IonLabel>
                <IonTextarea 
                  name="description"
                  value={createRoomData.description} 
                  onIonChange={handleInputChange}
                  rows={3}
                  placeholder="What is this room about?"
                />
              </IonItem>

              <IonItem className="privacy-toggle">
                <IonLabel>Private Room</IonLabel>
                <IonToggle 
                  name="isPrivate"
                  checked={createRoomData.isPrivate} 
                  onIonChange={handleInputChange}
                />
              </IonItem>

              <IonItem className="login-toggle">
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
                className="create-room-button ghost-shadow"
                onClick={handleCreateRoom}
                disabled={!createRoomData.name.trim()}
              >
                Create Room
              </IonButton>
            </div>
          </IonContent>
        </IonModal>

        <LoginPrompt 
          isOpen={showLoginPrompt}
          onClose={() => setShowLoginPrompt(false)}
          message={segment === 'private' ? 
            "You need to be logged in to access private rooms." : 
            "You need to be logged in to create a room."}
        />
      </IonContent>
    </IonPage>
  );
};

export default ChatRoom;