import {
  IonContent,
  IonPage,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonList,
  IonItem,
  IonIcon,
  IonButton,
  IonModal,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonToggle,
  IonSearchbar
} from '@ionic/react';
import { 
  chatbubble, 
  people, 
  add, 
  lockClosed,
  globe,
  search,
  personAdd
} from 'ionicons/icons';
import { useState, useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import './ChatRoom.css';
import { themeService } from '../services/ThemeService';
import LoginPrompt from '../components/LoginPrompt';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api.service';
import BackHeaderComponent from '../components/BackHeaderComponent';
import HeaderComponent from '../components/HeaderComponent';

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
  const [activeSegment, setActiveSegment] = useState<'public' | 'private'>('public');
  const [searchText, setSearchText] = useState('');
  const [showPublicRoomModal, setShowPublicRoomModal] = useState(false);
  const [showPrivateRoomModal, setShowPrivateRoomModal] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState<boolean>(false);
  const [isSearchActive, setIsSearchActive] = useState(false);

  const [publicRoomData, setPublicRoomData] = useState({
    name: '',
    description: '',
    requireLogin: false,
    chatType: 'discussion'
  });

  const [privateRoomData, setPrivateRoomData] = useState({
    name: '',
    description: '',
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

  // Handle segment change
  const handleSegmentChange = (value: 'public' | 'private') => {
    if (value === 'private' && !isAuthenticated) {
      setShowLoginPrompt(true);
    } else {
      setActiveSegment(value);
    }
  };

  // Handle room click
  const handleRoomClick = (room: Room) => {
    if (room.isPrivate && !isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }
    history.push(`/chat-room/${room.id}`);
  };

  // Handle public room creation
  const handleCreatePublicRoom = async () => {
    try {
      const response = await apiService.createRoom(
        publicRoomData.name,
        publicRoomData.description,
        false, // not private
        publicRoomData.requireLogin,
        publicRoomData.chatType
      );

      if (response.success) {
        setShowPublicRoomModal(false);
        // Reset form
        setPublicRoomData({
          name: '',
          description: '',
          requireLogin: false,
          chatType: 'discussion'
        });
        // Success message or notification could be added here
        alert('Public room created successfully!');
      } else {
        alert(`Failed to create room: ${response.message}`);
      }
    } catch (error) {
      console.error('Error creating room:', error);
      alert('Failed to create room due to a network error.');
    }
  };

  // Handle private room creation
  const handleCreatePrivateRoom = async () => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }

    try {
      const response = await apiService.createRoom(
        privateRoomData.name,
        privateRoomData.description,
        true, // private
        privateRoomData.requireLogin,
        privateRoomData.chatType
      );

      if (response.success) {
        setShowPrivateRoomModal(false);
        // Reset form
        setPrivateRoomData({
          name: '',
          description: '',
          requireLogin: true,
          chatType: 'discussion'
        });
        alert('Private room created successfully!');
      } else {
        alert(`Failed to create room: ${response.message}`);
      }
    } catch (error) {
      console.error('Error creating room:', error);
      alert('Failed to create room due to a network error.');
    }
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

  // Filter rooms based on segment and search
  const filteredRooms = roomsData
    .filter(room => room.isPrivate === (activeSegment === 'private'))
    .filter(room => 
      searchText ? 
        room.name.toLowerCase().includes(searchText.toLowerCase()) || 
        room.description.toLowerCase().includes(searchText.toLowerCase()) : 
        true
    );

  // Handle search functionality
  const handleSearchChange = (value: string): void => {
    setIsSearchActive(!!value);
    setSearchText(value);
  };

  return (
    <IonPage className="chat-room-page">
      <HeaderComponent 
        title="Chat Rooms" 
        onSearchChange={handleSearchChange} 
        searchPlaceholder="Search for rooms..."
      />
      
      <IonContent className="ion-padding-horizontal">
        {isSearchActive && (
          <div className="search-container">
            <IonSearchbar
              value={searchText}
              onIonChange={e => setSearchText(e.detail.value!)}
              placeholder="Search rooms..."
              showCancelButton="always"
              onIonCancel={() => {
                setIsSearchActive(false);
                setSearchText('');
              }}
              animated
            />
          </div>
        )}

        {/* Room Type Segment */}
        <div className="segment-container">
          <IonSegment value={activeSegment} onIonChange={e => handleSegmentChange(e.detail.value as 'public' | 'private')}>
            <IonSegmentButton value="public">
              <IonLabel>Public Rooms</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="private">
              <IonLabel>Private Rooms</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </div>

        {/* Create Room Button */}
        <div className="create-button-container">
          {activeSegment === 'public' ? (
            <IonButton 
              expand="block"
              onClick={() => setShowPublicRoomModal(true)}
              className="create-room-btn public"
            >
              <IonIcon slot="start" icon={add} />
              Create Public Room
            </IonButton>
          ) : (
            <IonButton 
              expand="block"
              onClick={() => isAuthenticated ? setShowPrivateRoomModal(true) : setShowLoginPrompt(true)}
              className="create-room-btn private"
            >
              <IonIcon slot="start" icon={add} />
              Create Private Room
            </IonButton>
          )}
        </div>

        {/* Room List */}
        {filteredRooms.length > 0 ? (
          <IonList className="room-list">
            {filteredRooms.map((room) => (
              <IonItem 
                key={room.id} 
                className={`room-item ${room.isPrivate ? 'private' : 'public'}`}
                onClick={() => handleRoomClick(room)}
                lines="none"
                detail={false}
              >
                <div className="room-content">
                  <div className="room-header">
                    <h2 className="room-name">{room.name}</h2>
                    {room.isPrivate && (
                      <div className="room-status private">
                        <IonIcon icon={lockClosed} />
                        <span>Private</span>
                      </div>
                    )}
                    {!room.isPrivate && (
                      <div className="room-status public">
                        <IonIcon icon={globe} />
                        <span>Public</span>
                      </div>
                    )}
                  </div>
                  
                  <p className="room-description">{room.description}</p>
                  
                  {room.lastMessage && (
                    <div className="room-message">
                      <IonIcon icon={chatbubble} size="small" />
                      <p>{room.lastMessage}</p>
                    </div>
                  )}
                  
                  <div className="room-footer">
                    <div className="member-count">
                      <IonIcon icon={people} />
                      <span>{room.members} members</span>
                    </div>
                    <IonButton fill="clear" size="small" className="join-btn">
                      Join
                    </IonButton>
                  </div>
                </div>
              </IonItem>
            ))}
          </IonList>
        ) : (
          <div className="empty-state">
            <IonIcon icon={chatbubble} />
            <h3>No {activeSegment} rooms found</h3>
            <p>
              {activeSegment === 'public' 
                ? 'Create a public room for everyone to join!' 
                : 'Create a private room to chat securely with selected members.'}
            </p>
          </div>
        )}
      </IonContent>
      
      {/* Public Room Creation Modal */}
      <IonModal 
        isOpen={showPublicRoomModal} 
        onDidDismiss={() => setShowPublicRoomModal(false)}
        className="ghost-create-room-modal public-room-modal"
        backdropDismiss={false}
      >
        <BackHeaderComponent 
          title="Create Public Room" 
          onBack={() => setShowPublicRoomModal(false)} 
          isModal={true}
        />
        
        <IonContent className="ion-padding">
          <div className="create-room-container">
            <div className="gradient-blob public-blob"></div>
            
            <div className="modal-icon-wrapper public">
              <div className="modal-icon-outer public-glow">
                <div className="modal-icon public">
                  <IonIcon icon={globe} />
                </div>
              </div>
            </div>
            
            <h3 className="modal-title">New Public Room</h3>
            
            <p className="modal-description">
              Create a public room that anyone can join and participate in discussions.
            </p>
            
            <div className="form-container">
              <div className="form-field">
                <div className="field-header">
                  <h4>Room Name*</h4>
                </div>
                <IonItem className="form-item animated-input">
                  <IonInput 
                    value={publicRoomData.name} 
                    onIonChange={e => setPublicRoomData({...publicRoomData, name: e.detail.value || ''})}
                  />
                </IonItem>
              </div>

              <div className="form-field">
                <div className="field-header">
                  <h4>Description</h4>
                </div>
                <IonItem className="form-item textarea animated-input">
                  <IonTextarea 
                    value={publicRoomData.description} 
                    onIonChange={e => setPublicRoomData({...publicRoomData, description: e.detail.value || ''})}
                    rows={3}
                  />
                </IonItem>
              </div>

              <div className="form-field toggle-field">
                <div className="toggle-label">
                  <h4>Require Login</h4>
                  <p className="field-hint">When enabled, users must be logged in to access this room</p>
                </div>
                <IonToggle 
                  checked={publicRoomData.requireLogin} 
                  onIonChange={e => setPublicRoomData({...publicRoomData, requireLogin: e.detail.checked})}
                  className="custom-toggle"
                />
              </div>

              <div className="form-field">
                <div className="field-header">
                  <h4>Chat Type</h4>
                </div>
                <IonItem className="form-item select-item animated-input">
                  <IonSelect 
                    value={publicRoomData.chatType} 
                    onIonChange={e => setPublicRoomData({...publicRoomData, chatType: e.detail.value})}
                    interface="popover"
                  >
                    <IonSelectOption value="discussion">Discussion (Everyone can post)</IonSelectOption>
                    <IonSelectOption value="notice">Notice (Only admins can post)</IonSelectOption>
                  </IonSelect>
                </IonItem>
              </div>
            </div>
            
            <div className="note-box public">
              <div className="note-icon">
                <IonIcon icon={globe} />
              </div>
              <div className="note-content">
                <h5>Public Visibility</h5>
                <p>This room will be listed in public directories and visible to all users</p>
              </div>
            </div>
            
            <IonButton 
              expand="block" 
              onClick={handleCreatePublicRoom}
              disabled={!publicRoomData.name.trim()}
              className="create-button public-button"
            >
              <div className="button-content">
                <span>Create Public Room</span>
                <IonIcon icon={add} />
              </div>
            </IonButton>
          </div>
        </IonContent>
      </IonModal>

      {/* Private Room Creation Modal */}
      <IonModal 
        isOpen={showPrivateRoomModal} 
        onDidDismiss={() => setShowPrivateRoomModal(false)}
        className="ghost-create-room-modal private-room-modal"
        backdropDismiss={false}
      >
        <BackHeaderComponent 
          title="Create Private Room" 
          onBack={() => setShowPrivateRoomModal(false)} 
          isModal={true}
        />
        
        <IonContent className="ion-padding">
          <div className="create-room-container">
            <div className="gradient-blob private-blob"></div>
            
            <div className="modal-icon-wrapper private">
              <div className="modal-icon-outer private-glow">
                <div className="modal-icon private">
                  <IonIcon icon={lockClosed} />
                </div>
              </div>
            </div>
            
            <h3 className="modal-title">New Private Room</h3>
            
            <p className="modal-description">
              Create a private room that only invited members can join.
            </p>
            
            <div className="form-container">
              <div className="form-field">
                <div className="field-header">
                  <h4>Room Name*</h4>
                </div>
                <IonItem className="form-item animated-input">
                  <IonInput 
                    value={privateRoomData.name} 
                    onIonChange={e => setPrivateRoomData({...privateRoomData, name: e.detail.value || ''})}
                    placeholder="Enter a name for your room"
                  />
                </IonItem>
              </div>

              <div className="form-field">
                <div className="field-header">
                  <h4>Description</h4>
                </div>
                <IonItem className="form-item textarea animated-input">
                  <IonTextarea 
                    value={privateRoomData.description} 
                    onIonChange={e => setPrivateRoomData({...privateRoomData, description: e.detail.value || ''})}
                    rows={3}
                    placeholder="What is this room about?"
                  />
                </IonItem>
              </div>

              <div className="form-field toggle-field">
                <div className="toggle-label">
                  <h4>Require Login</h4>
                  <p className="field-hint">When enabled, users must be logged in to access this room</p>
                </div>
                <IonToggle 
                  checked={privateRoomData.requireLogin}
                  onIonChange={e => setPrivateRoomData({...privateRoomData, requireLogin: e.detail.checked})}
                  className="custom-toggle"
                />
              </div>

              <div className="form-field">
                <div className="field-header">
                  <h4>Chat Type</h4>
                </div>
                <IonItem className="form-item select-item animated-input">
                  <IonSelect 
                    value={privateRoomData.chatType} 
                    onIonChange={e => setPrivateRoomData({...privateRoomData, chatType: e.detail.value})}
                    interface="popover"
                  >
                    <IonSelectOption value="discussion">Discussion (Everyone can post)</IonSelectOption>
                    <IonSelectOption value="notice">Notice (Only admins can post)</IonSelectOption>
                  </IonSelect>
                </IonItem>
              </div>
            </div>
            
            <div className="invite-section">
              <div className="invite-header">
                <div className="invite-icon">
                  <IonIcon icon={personAdd} />
                </div>
                <h5>Invite Members</h5>
              </div>
              <p className="invite-text">You can invite members after creating the room</p>
            </div>
            
            <div className="note-box private">
              <div className="note-icon">
                <IonIcon icon={lockClosed} />
              </div>
              <div className="note-content">
                <h5>Private Access</h5>
                <p>This room will only be visible to invited members</p>
              </div>
            </div>
            
            <IonButton 
              expand="block" 
              onClick={handleCreatePrivateRoom}
              disabled={!privateRoomData.name.trim()}
              className="create-button private-button"
            >
              <div className="button-content">
                <span>Create Private Room</span>
                <IonIcon icon={add} />
              </div>
            </IonButton>
          </div>
        </IonContent>
      </IonModal>

      {/* Login Prompt - moved outside IonContent */}
      <LoginPrompt 
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        message={activeSegment === 'private' ? 
          "You need to be logged in to create a room." : 
          "You need to be logged in to access private rooms."}
        onExplorePublic={() => setActiveSegment('public')}
      />
    </IonPage>
  );
};

export default ChatRoom;