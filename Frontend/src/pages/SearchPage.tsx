import {
  IonContent,
  IonPage,
  IonList,
  IonItem,
  IonAvatar,
  IonLabel,
  IonBadge,
  IonIcon,
  IonButton,
  IonChip,
  IonSkeletonText,
  IonInfiniteScroll,
  IonInfiniteScrollContent
} from '@ionic/react';
import { 
  personAdd, 
  chatbubble, 
  search as searchIcon,
  star,
  checkmarkCircle
} from 'ionicons/icons';
import { useState, useEffect } from 'react';
import './SearchPage.css';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api.service';
import LoginPrompt from '../components/LoginPrompt';
import HeaderComponent from '../components/HeaderComponent';
// import RoamingGhost from '../components/RoamingGhost';

interface User {
  id: string;
  name: string;
  avatar?: string;
  status?: string;
  proStatus?: string; // Change from isPro to proStatus
  isVerified?: boolean;
  lastSeen?: string;
}

const SearchPage: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const { isAuthenticated } = useAuth();
  const [hasSearched, setHasSearched] = useState(false);

  // Handle search
  const handleSearch = (value: string) => {
    setSearchText(value);
    
    if (value.length >= 2) {
      setIsLoading(true);
      setHasSearched(true);
      
      // Simulate API call with timeout
      setTimeout(() => {
        // Mock search results - in a real app, this would call apiService.searchUsers(value)
        const mockResults: User[] = [
          {
            id: 'user1',
            name: `${value} Smith`,
            status: 'Online',
            proStatus: 'monthly', // Changed from isPro: true
            isVerified: true,
            lastSeen: 'Just now'
          },
          {
            id: 'user2',
            name: `Alex ${value}son`,
            status: 'Away',
            proStatus: 'free', // Changed from isPro: false
            isVerified: false,
            lastSeen: '2 hours ago'
          },
          {
            id: 'user3',
            name: `Jamie ${value}`,
            status: 'Offline',
            proStatus: 'free', // Changed from isPro: false
            isVerified: true,
            lastSeen: '1 day ago'
          }
        ];
        
        setUsers(mockResults);
        setIsLoading(false);
      }, 800);
    } else if (value.length === 0) {
      setUsers([]);
      setHasSearched(false);
    }
  };

  const handleAddFriend = (userId: string) => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }
    
    // Here we would call apiService.addFriend(userId)
    console.log(`Adding friend with ID: ${userId}`);
    
    // Show success feedback
    const updatedUsers = users.map(user => {
      if (user.id === userId) {
        return { ...user, isAdded: true };
      }
      return user;
    });
    
    setUsers(updatedUsers);
  };

  const handleStartChat = (userId: string) => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }
    
    // Here we would call apiService.createChat(userId)
    // and then navigate to the chat
    console.log(`Starting chat with user ID: ${userId}`);
  };

  const loadMoreUsers = (event: CustomEvent) => {
    setTimeout(() => {
      // Load more results - would be an API call in a real app
      const moreUsers: User[] = [
        {
          id: 'user4',
          name: `Taylor ${searchText}`,
          status: 'Online',
          proStatus: 'yearly', // Changed from isPro: true
          isVerified: false,
          lastSeen: 'Just now'
        },
        {
          id: 'user5',
          name: `Morgan ${searchText}son`,
          status: 'Away',
          proStatus: 'free', // Changed from isPro: false
          isVerified: false,
          lastSeen: '5 hours ago'
        }
      ];
      
      setUsers([...users, ...moreUsers]);
      if (event.target) {
        (event.target as HTMLIonInfiniteScrollElement).complete();
      }
    }, 1000);
  };

  return (
    <IonPage className="ghost-appear">
      <HeaderComponent 
        title="Search Users" 
        showSearch={true}
        onSearchChange={handleSearch}
        searchPlaceholder="Search by username or ID..."
      />
      
      <IonContent fullscreen>
        {/* <RoamingGhost pageId="search" /> */}
        
        <div className="search-container">
          {!hasSearched && !isLoading && (
            <div className="search-instructions ghost-appear">
              <div className="search-icon-container ghost-float">
                <IonIcon icon={searchIcon} />
              </div>
              <h2>Find Friends on GhostTalk</h2>
              <p>
                Search for users by username or ID to connect.
                Start typing above to see results.
              </p>
            </div>
          )}
          
          {isLoading && (
            <div className="search-loading">
              {[1, 2, 3].map(i => (
                <IonItem key={i} className="search-skeleton">
                  <IonAvatar slot="start">
                    <IonSkeletonText animated />
                  </IonAvatar>
                  <IonLabel>
                    <h3><IonSkeletonText animated style={{ width: '70%' }} /></h3>
                    <p><IonSkeletonText animated style={{ width: '50%' }} /></p>
                  </IonLabel>
                </IonItem>
              ))}
            </div>
          )}
          
          {hasSearched && !isLoading && users.length === 0 && (
            <div className="no-results-container ghost-appear">
              <div className="no-results-icon ghost-float">
                <IonIcon icon={searchIcon} />
              </div>
              <h3>No Users Found</h3>
              <p>
                We couldn't find any users matching "{searchText}". 
                Try a different search term.
              </p>
            </div>
          )}
          
          {users.length > 0 && (
            <IonList className="search-results">
              {users.map((user, index) => (
                <IonItem key={user.id} className="user-item staggered-item" lines="none">
                  <IonAvatar slot="start" className="user-avatar">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} />
                    ) : (
                      <div className="default-avatar">{user.name[0]}</div>
                    )}
                    {user.status === 'Online' && <div className="online-indicator"></div>}
                  </IonAvatar>
                  
                  <IonLabel>
                    <div className="user-name-row">
                      <h2>{user.name}</h2>
                      {user.proStatus && user.proStatus !== 'free' && (
                        <IonBadge color="warning" className="pro-badge">PRO</IonBadge>
                      )}
                      {user.isVerified && (
                        <IonIcon icon={checkmarkCircle} color="primary" className="verified-icon" />
                      )}
                    </div>
                    <p className="user-last-seen">{user.lastSeen}</p>
                  </IonLabel>
                  
                  <div className="user-actions">
                    <IonButton fill="clear" onClick={() => handleStartChat(user.id)}>
                      <IonIcon slot="icon-only" icon={chatbubble} />
                    </IonButton>
                    
                    <IonButton fill="clear" onClick={() => handleAddFriend(user.id)}>
                      <IonIcon slot="icon-only" icon={personAdd} />
                    </IonButton>
                  </div>
                </IonItem>
              ))}
            </IonList>
          )}
          
          {users.length > 0 && (
            <IonInfiniteScroll threshold="100px" onIonInfinite={loadMoreUsers}>
              <IonInfiniteScrollContent
                loadingSpinner="bubbles"
                loadingText="Loading more users..."
              />
            </IonInfiniteScroll>
          )}
        </div>
        
        <LoginPrompt 
          isOpen={showLoginPrompt}
          onClose={() => setShowLoginPrompt(false)}
          message="You need to be logged in to connect with other users."
        />
      </IonContent>
    </IonPage>
  );
};

export default SearchPage;