import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonList,
  IonItem,
  IonAvatar,
  IonIcon,
  IonBadge,
  IonButton,
  IonSearchbar,
  IonRefresher,
  IonRefresherContent,
  IonSkeletonText,
  IonEmptyButton,
  IonFab,
  IonFabButton
} from '@ionic/react';
import { 
  personAdd, 
  person, 
  checkmarkCircle, 
  closeCircle, 
  timeOutline, 
  arrowForward, 
  heartOutline, 
  peopleOutline,
  checkmarkOutline,
  closeOutline,
  hourglassOutline,
  addOutline
} from 'ionicons/icons';
import { useAuth } from '../contexts/AuthContext';
import BackHeaderComponent from '../components/BackHeaderComponent';
import './FavoritesPage.css';

const FavoritesPage: React.FC = () => {
  const [activeSegment, setActiveSegment] = useState<'friends' | 'requests'>('friends');
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  // Mock data - replace with actual API calls in production
  const [friends, setFriends] = useState([
    {
      id: 'user1',
      name: 'Alex Morgan',
      avatar: '',
      status: 'Online',
      lastSeen: 'Now'
    },
    {
      id: 'user2',
      name: 'Jamie Chen',
      avatar: '',
      status: 'Offline',
      lastSeen: '2h ago'
    },
    {
      id: 'user3',
      name: 'Taylor Swift',
      avatar: '',
      status: 'Online',
      lastSeen: 'Now'
    }
  ]);

  const [requests, setRequests] = useState({
    incoming: [
      {
        id: 'req1',
        name: 'Chris Johnson',
        avatar: '',
        sentTime: '2 days ago'
      },
      {
        id: 'req2',
        name: 'Morgan Freeman',
        avatar: '',
        sentTime: '5 hours ago'
      }
    ],
    outgoing: [
      {
        id: 'sent1',
        name: 'Pat Smith',
        avatar: '',
        sentTime: '1 day ago'
      }
    ]
  });

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleRefresh = (event: CustomEvent) => {
    // Simulate refreshing data
    setTimeout(() => {
      // Refresh your data here
      console.log('Data refreshed');
      event.detail.complete();
    }, 1000);
  };

  const handleSearchChange = (value: string) => {
    setSearchText(value);
    // Filter friends or requests based on search text
  };

  const handleAcceptRequest = (requestId: string) => {
    // Handle accepting a friend request
    console.log(`Accepting request ${requestId}`);
    
    // In a real app, call your API and then update the state
    setRequests(prev => ({
      ...prev,
      incoming: prev.incoming.filter(req => req.id !== requestId)
    }));
    
    // Add to friends
    const acceptedRequest = requests.incoming.find(req => req.id === requestId);
    if (acceptedRequest) {
      setFriends(prev => [...prev, {
        id: acceptedRequest.id,
        name: acceptedRequest.name,
        avatar: acceptedRequest.avatar,
        status: 'Offline',
        lastSeen: 'Just now'
      }]);
    }
  };

  const handleRejectRequest = (requestId: string) => {
    // Handle rejecting a friend request
    console.log(`Rejecting request ${requestId}`);
    
    // In a real app, call your API and then update the state
    setRequests(prev => ({
      ...prev,
      incoming: prev.incoming.filter(req => req.id !== requestId)
    }));
  };

  const handleCancelRequest = (requestId: string) => {
    // Handle canceling a sent friend request
    console.log(`Canceling request ${requestId}`);
    
    // In a real app, call your API and then update the state
    setRequests(prev => ({
      ...prev,
      outgoing: prev.outgoing.filter(req => req.id !== requestId)
    }));
  };

  const handleAddFriend = () => {
    // Navigate to search page or open modal to add friend
    console.log('Add friend');
  };

  // Filter friends based on search
  const filteredFriends = searchText 
    ? friends.filter(friend => friend.name.toLowerCase().includes(searchText.toLowerCase()))
    : friends;

  // Filter requests based on search
  const filteredRequests = {
    incoming: searchText 
      ? requests.incoming.filter(req => req.name.toLowerCase().includes(searchText.toLowerCase()))
      : requests.incoming,
    outgoing: searchText 
      ? requests.outgoing.filter(req => req.name.toLowerCase().includes(searchText.toLowerCase()))
      : requests.outgoing
  };

  const renderFriendsList = () => {
    if (isLoading) {
      return Array(3).fill(0).map((_, index) => (
        <IonItem key={`skeleton-${index}`} className="friend-item skeleton">
          <IonAvatar slot="start">
            <IonSkeletonText animated />
          </IonAvatar>
          <IonLabel>
            <IonSkeletonText animated style={{ width: '60%' }} />
            <IonSkeletonText animated style={{ width: '30%' }} />
          </IonLabel>
        </IonItem>
      ));
    }

    if (filteredFriends.length === 0) {
      return (
        <div className="empty-state">
          <IonIcon icon={peopleOutline} />
          <h3>No friends yet</h3>
          <p>Add friends to start chatting with them anytime</p>
          <IonButton onClick={handleAddFriend} className="add-friend-btn">
            <IonIcon slot="start" icon={personAdd} />
            Add Friends
          </IonButton>
        </div>
      );
    }

    return filteredFriends.map(friend => (
      <IonItem key={friend.id} className="friend-item staggered-item">
        <IonAvatar slot="start">
          {friend.avatar ? (
            <img src={friend.avatar} alt={friend.name} />
          ) : (
            <div className="default-avatar">{friend.name[0]}</div>
          )}
          {friend.status === 'Online' && <div className="online-indicator"></div>}
        </IonAvatar>
        
        <IonLabel>
          <h2>{friend.name}</h2>
          <p className="friend-status">
            <IonIcon icon={timeOutline} />
            {friend.status === 'Online' ? 'Active now' : `Last seen ${friend.lastSeen}`}
          </p>
        </IonLabel>
        
        <IonButton fill="clear" routerLink={`/chat-individual/${friend.id}`}>
          <IonIcon slot="icon-only" icon={arrowForward} />
        </IonButton>
      </IonItem>
    ));
  };

  const renderRequestsList = () => {
    if (isLoading) {
      return Array(2).fill(0).map((_, index) => (
        <IonItem key={`skeleton-${index}`} className="request-item skeleton">
          <IonAvatar slot="start">
            <IonSkeletonText animated />
          </IonAvatar>
          <IonLabel>
            <IonSkeletonText animated style={{ width: '60%' }} />
            <IonSkeletonText animated style={{ width: '30%' }} />
          </IonLabel>
        </IonItem>
      ));
    }

    if (filteredRequests.incoming.length === 0 && filteredRequests.outgoing.length === 0) {
      return (
        <div className="empty-state">
          <IonIcon icon={personAdd} />
          <h3>No pending requests</h3>
          <p>Friend requests you send or receive will appear here</p>
          <IonButton onClick={handleAddFriend} className="add-friend-btn">
            <IonIcon slot="start" icon={personAdd} />
            Find Friends
          </IonButton>
        </div>
      );
    }

    return (
      <>
        {filteredRequests.incoming.length > 0 && (
          <>
            <div className="request-section-header">
              <h3>
                <IonIcon icon={personAdd} />
                Incoming Requests
                {filteredRequests.incoming.length > 0 && (
                  <IonBadge color="primary">{filteredRequests.incoming.length}</IonBadge>
                )}
              </h3>
            </div>
            
            {filteredRequests.incoming.map(request => (
              <IonItem key={request.id} className="request-item incoming staggered-item">
                <IonAvatar slot="start">
                  {request.avatar ? (
                    <img src={request.avatar} alt={request.name} />
                  ) : (
                    <div className="default-avatar">{request.name[0]}</div>
                  )}
                </IonAvatar>
                
                <IonLabel>
                  <h2>{request.name}</h2>
                  <p className="request-time">
                    <IonIcon icon={timeOutline} />
                    Sent {request.sentTime}
                  </p>
                </IonLabel>
                
                <div className="request-actions">
                  <IonButton fill="clear" color="success" onClick={() => handleAcceptRequest(request.id)}>
                    <IonIcon slot="icon-only" icon={checkmarkOutline} />
                  </IonButton>
                  <IonButton fill="clear" color="danger" onClick={() => handleRejectRequest(request.id)}>
                    <IonIcon slot="icon-only" icon={closeOutline} />
                  </IonButton>
                </div>
              </IonItem>
            ))}
          </>
        )}
        
        {filteredRequests.outgoing.length > 0 && (
          <>
            <div className="request-section-header">
              <h3>
                <IonIcon icon={hourglassOutline} />
                Sent Requests
                {filteredRequests.outgoing.length > 0 && (
                  <IonBadge color="medium">{filteredRequests.outgoing.length}</IonBadge>
                )}
              </h3>
            </div>
            
            {filteredRequests.outgoing.map(request => (
              <IonItem key={request.id} className="request-item outgoing staggered-item">
                <IonAvatar slot="start">
                  {request.avatar ? (
                    <img src={request.avatar} alt={request.name} />
                  ) : (
                    <div className="default-avatar">{request.name[0]}</div>
                  )}
                </IonAvatar>
                
                <IonLabel>
                  <h2>{request.name}</h2>
                  <p className="request-time">
                    <IonIcon icon={timeOutline} />
                    Sent {request.sentTime}
                  </p>
                </IonLabel>
                
                <IonButton fill="clear" color="medium" onClick={() => handleCancelRequest(request.id)}>
                  <IonIcon slot="icon-only" icon={closeOutline} />
                </IonButton>
              </IonItem>
            ))}
          </>
        )}
      </>
    );
  };

  return (
    <IonPage className="favorites-page">
      <BackHeaderComponent 
        title="Favorites" 
        showSearch={true} 
        searchPlaceholder={`Search ${activeSegment}...`}
        onSearchChange={handleSearchChange}
        defaultHref="/profile"
      />
      
      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>
        
        <div className="favorites-segment-container">
          <IonSegment 
            value={activeSegment} 
            onIonChange={e => setActiveSegment(e.detail.value as 'friends' | 'requests')}
            className="favorites-segment"
          >
            <IonSegmentButton value="friends" className="favorites-segment-button">
              <IonLabel>
                <IonIcon icon={person} />
                Friends
              </IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="requests" className="favorites-segment-button">
              <IonLabel>
                <IonIcon icon={personAdd} />
                Requests
                {requests.incoming.length > 0 && (
                  <IonBadge color="danger" className="request-badge">{requests.incoming.length}</IonBadge>
                )}
              </IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </div>
        
        <div className="favorites-content">
          {activeSegment === 'friends' ? (
            <IonList className="friends-list">
              {renderFriendsList()}
            </IonList>
          ) : (
            <IonList className="requests-list">
              {renderRequestsList()}
            </IonList>
          )}
        </div>
        
        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={handleAddFriend} className="add-friend-fab">
            <IonIcon icon={addOutline} />
          </IonFabButton>
        </IonFab>
      </IonContent>
    </IonPage>
  );
};

export default FavoritesPage;