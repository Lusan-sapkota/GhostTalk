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
  IonRefresher,
  IonRefresherContent,
  IonSkeletonText,
  IonFab,
  IonFabButton,
  IonToast,
  IonActionSheet,
  IonModal,
  IonChip,
  IonText,
  IonSpinner
} from '@ionic/react';
import { 
  personAdd, 
  person, 
  timeOutline, 
  arrowForward, 
  peopleOutline,
  checkmarkOutline,
  closeOutline,
  hourglassOutline,
  addOutline,
  searchOutline,
  chatbubble,
  heart,
  heartOutline,
  close,
  calendar,
  text,
  mail,
  star,
  diamond,
  checkmarkCircle,
  fingerPrint,
  copy,
  eye,
  lockClosed,
  chevronDown,
  chevronUp,
  qrCodeOutline
} from 'ionicons/icons';
import { useAuth } from '../contexts/AuthContext';
import { useHistory } from 'react-router-dom';
import BackHeaderComponent from '../components/BackHeaderComponent';
import { apiService } from '../services/api.service';
import './FavoritesPage.css';

// Add these to your existing interface
interface Friend {
  id: string;
  name: string;
  avatar?: string;
  status: 'Online' | 'Offline';
  lastSeen: string;
  bio?: string;
  proStatus?: string;
  isVerified?: boolean;
}

// Define the FriendRequest interface
interface FriendRequest {
  id: string;
  name: string;
  avatar?: string;
  sentTime: string;
  userId: string;
}

// Add this new function at the top level before your component
function formatLastSeen(timestamp: number): string {
  if (!timestamp) return 'Unknown';
  
  const now = Math.floor(Date.now() / 1000);
  const secondsAgo = now - timestamp;
  
  if (secondsAgo < 60) return 'Just now';
  if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)} min ago`;
  if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)} hr ago`;
  if (secondsAgo < 604800) return `${Math.floor(secondsAgo / 86400)} days ago`;
  
  return new Date(timestamp * 1000).toLocaleDateString();
}

const FavoritesPage: React.FC = () => {
  // Add these new state variables
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showDetailedProfile, setShowDetailedProfile] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [showQrCodeModal, setShowQrCodeModal] = useState(false);
  
  // Existing state variables...
  const [activeSegment, setActiveSegment] = useState<'friends' | 'requests'>('friends');
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showAddFriendSheet, setShowAddFriendSheet] = useState(false);
  const [friendIdToAdd, setFriendIdToAdd] = useState('');
  const { isAuthenticated, currentUser } = useAuth();
  const history = useHistory();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState({
    incoming: [] as FriendRequest[],
    outgoing: [] as FriendRequest[]
  });

  // Add this at the top of your component after your useState declarations

  // Check for tab parameter in URL
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const tab = queryParams.get('tab');
    if (tab === 'requests') {
      setActiveSegment('requests');
    }
  }, []);

  // Load data on component mount
  useEffect(() => {
    if (isAuthenticated) {
      loadFriends();
      loadRequests();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Add this new function to handle user clicks
  const handleUserClick = async (friend: Friend) => {
    // Set initial user data
    setSelectedUser({
      id: friend.id,
      name: friend.name,
      avatar: friend.avatar,
      isOnline: friend.status === 'Online',
      lastSeen: friend.status === 'Online' ? Date.now() / 1000 : Date.now() / 1000 - 3600,
      isAdded: true, // They are already friends
      bio: friend.bio || '',
      proStatus: friend.proStatus || 'free',
      isVerified: friend.isVerified || false,
      // Add default visibility settings
      visibility: 'limited',
      bioVisibility: 'private',
      memberSinceVisibility: 'public',
      emailVisibility: 'private',
      genderVisibility: 'private'
    });
    
    setShowUserProfile(true);
    setShowDetailedProfile(false);
    
    // Fetch more detailed profile info
    try {
      const response = await apiService.makeRequest(`/search/by-id/${friend.id}`, 'GET');
      console.log("User profile response:", response); // Debug log
      
      if (response.success && response.user) {
        // Update with additional details if available
        // Define interfaces for the user data
        interface UserProfileVisibility {
          visibility?: 'public' | 'limited';
          bioVisibility?: 'public' | 'private';
          memberSinceVisibility?: 'public' | 'private';
          emailVisibility?: 'public' | 'private';
          genderVisibility?: 'public' | 'private';
        }

        interface UserProfileDetails extends UserProfileVisibility {
          bio?: string;
          email?: string;
          gender?: string;
          memberSince?: string;
          lastActive?: number;
        }

        interface DetailedUserProfile extends UserProfileVisibility {
          id: string;
          name: string;
          avatar?: string;
          isOnline: boolean;
          lastSeen: number;
          isAdded: boolean;
          bio: string;
          proStatus: string;
          isVerified: boolean;
          email?: string;
          gender?: string;
          memberSince?: string;
          lastActive?: number;
        }

        interface UserApiResponse {
          success: boolean;
          user?: UserProfileDetails;
        }

        // Apply the types to the original code
        setSelectedUser((prevUser: DetailedUserProfile) => ({
          ...prevUser,
          bio: response.user.bio || prevUser.bio,
          email: response.user.email,
          gender: response.user.gender,
          memberSince: response.user.memberSince,
          lastActive: response.user.lastActive,
          // Include visibility settings
          visibility: response.user.visibility || 'limited',
          bioVisibility: response.user.bioVisibility || 'private',
          memberSinceVisibility: response.user.memberSinceVisibility || 'public',
          emailVisibility: response.user.emailVisibility || 'private',
          genderVisibility: response.user.genderVisibility || 'private'
        }));
      }
    } catch (error) {
      console.error('Error fetching detailed user info:', error);
    }
  };

  // Add this new function to handle request clicks (place it after handleUserClick)

  const handleRequestClick = async (request: FriendRequest, isIncoming: boolean) => {
    // Set initial user data based on whether it's incoming or outgoing
    const userId = isIncoming ? request.userId : request.userId;
    setSelectedUser({
      id: userId,
      name: request.name,
      avatar: request.avatar,
      isOnline: false, // We don't know the status from request data
      lastSeen: Date.now() / 1000 - 3600, // Default to an hour ago
      isAdded: false, // Not yet friends
      bio: '',
      proStatus: 'free',
      isVerified: false,
      // Add default visibility settings
      visibility: 'limited',
      bioVisibility: 'private',
      memberSinceVisibility: 'public',
      emailVisibility: 'private',
      genderVisibility: 'private'
    });
    
    setShowUserProfile(true);
    setShowDetailedProfile(false);
    
    // Fetch more detailed profile info
    try {
      const response = await apiService.makeRequest(`/search/by-id/${userId}`, 'GET');
      console.log("Request user profile response:", response);
      
      if (response.success && response.user) {
        setSelectedUser((prevUser: any) => ({
          ...prevUser,
          bio: response.user.bio || prevUser.bio,
          email: response.user.email,
          gender: response.user.gender,
          memberSince: response.user.memberSince,
          lastActive: response.user.lastActive,
          // Include visibility settings
          visibility: response.user.visibility || 'limited',
          bioVisibility: response.user.bioVisibility || 'private',
          memberSinceVisibility: response.user.memberSinceVisibility || 'public',
          emailVisibility: response.user.emailVisibility || 'private',
          genderVisibility: response.user.genderVisibility || 'private'
        }));
      }
    } catch (error) {
      console.error('Error fetching detailed user info:', error);
    }
  };

  // Add this function to toggle detailed profile view
  const toggleDetailedProfile = () => {
    setShowDetailedProfile(!showDetailedProfile);
  };

  // Add this function to close profile
  const handleCloseProfile = () => {
    setShowUserProfile(false);
  };

  // Add this function to handle messaging
  const handleStartChat = (userId: string) => {
    setShowUserProfile(false);
    history.push(`/chat-individual/${userId}`);
  };

  // Add this function to handle friend removal
  const handleRemoveFriend = async (userId: string) => {
    try {
      setIsLoading(true);
      const response = await apiService.makeRequest('/friend/remove', 'POST', { userId });
      
      if (response.success) {
        // Refresh friends list
        await loadFriends();
        setShowUserProfile(false);
        setToastMessage('Friend removed successfully');
        setShowToast(true);
      } else {
        setToastMessage(response.message || 'Failed to remove friend');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Error removing friend:', error);
      setToastMessage('Error removing friend');
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Add this function to generate QR code
  const generateQRCode = async (userId: string) => {
    if (!userId) return;
    
    setIsGeneratingQR(true);
    try {
      // Make sure the endpoint is correct and properly configured
      const response = await apiService.makeRequest(`/user/qrcode/${userId}`, 'GET');
      
      console.log('QR code response:', response); // Debug log
      
      if (response.success && response.qrCodeUrl) {
        setQrCodeUrl(response.qrCodeUrl);
        setShowQrCodeModal(true);
      } else {
        setToastMessage('Failed to generate QR code: ' + (response.message || 'Unknown error'));
        setShowToast(true);
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      setToastMessage('Network error when generating QR code');
      setShowToast(true);
    } finally {
      setIsGeneratingQR(false);
    }
  };

  const loadFriends = async () => {
    try {
      const response = await apiService.makeRequest('/friend/list', 'GET');
      
      if (response.success && response.friends) {
        const formattedFriends = response.friends.map((friend: any) => ({
          id: friend.id,
          name: friend.name,
          avatar: friend.avatar,
          status: friend.isOnline ? 'Online' : 'Offline',
          lastSeen: friend.lastSeenText || 'Unknown',
          bio: friend.bio || '',
          proStatus: friend.proStatus || 'free',
          isVerified: friend.isVerified || false
        }));
        
        setFriends(formattedFriends);
      }
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const loadRequests = async () => {
    try {
      const response = await apiService.makeRequest('/friend/requests', 'GET');
      
      if (response.success) {
        const incomingRequests = response.received.map((req: any) => ({
          id: req.requestId,
          name: req.senderName,
          avatar: req.senderAvatar,
          sentTime: req.timeAgo,
          userId: req.senderId
        }));
        
        const outgoingRequests = response.sent.map((req: any) => ({
          id: req.requestId,
          name: req.recipientName,
          avatar: req.recipientAvatar,
          sentTime: req.timeAgo,
          userId: req.recipientId
        }));
        
        setRequests({
          incoming: incomingRequests,
          outgoing: outgoingRequests
        });
      }
    } catch (error) {
      console.error('Error loading friend requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async (event: CustomEvent) => {
    try {
      await Promise.all([loadFriends(), loadRequests()]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      event.detail.complete();
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchText(value);
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      setIsLoading(true);
      const response = await apiService.makeRequest('/friend/request/accept', 'POST', { requestId });
      
      if (response.success) {
        // Refresh friends and requests lists
        await Promise.all([loadFriends(), loadRequests()]);
        
        // Show success message
        setToastMessage('Friend request accepted');
        setShowToast(true);
      } else {
        setToastMessage(response.message || 'Failed to accept request');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
      setToastMessage('Error accepting friend request');
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      setIsLoading(true);
      const response = await apiService.makeRequest('/friend/request/reject', 'POST', { requestId });
      
      if (response.success) {
        // Only need to refresh requests list
        await loadRequests();
        
        // Show success message
        setToastMessage('Friend request rejected');
        setShowToast(true);
      } else {
        setToastMessage(response.message || 'Failed to reject request');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      setToastMessage('Error rejecting friend request');
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      setIsLoading(true);
      const response = await apiService.makeRequest('/friend/request/cancel', 'POST', { requestId });
      
      if (response.success) {
        // Only need to refresh requests list
        await loadRequests();
        
        // Show success message
        setToastMessage('Friend request canceled');
        setShowToast(true);
      } else {
        setToastMessage(response.message || 'Failed to cancel request');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Error canceling friend request:', error);
      setToastMessage('Error canceling friend request');
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFriend = () => {
    // Navigate to search page
    history.push('/search');
  };

  const handleAddFriendById = () => {
    setShowAddFriendSheet(true);
  };

  const submitFriendRequest = async () => {
    if (!friendIdToAdd.trim()) {
      setToastMessage('Please enter a valid User ID');
      setShowToast(true);
      return;
    }
    
    // Clean the ID (remove GHOST- prefix if present)
    const cleanId = friendIdToAdd.replace('GHOST-', '').trim();
    
    try {
      setIsLoading(true);
      const response = await apiService.makeRequest('/friend/request/send', 'POST', { userId: cleanId });
      
      if (response.success) {
        setToastMessage('Friend request sent successfully');
        setShowToast(true);
        setFriendIdToAdd('');
        
        // Refresh requests list
        await loadRequests();
      } else {
        setToastMessage(response.message || 'Failed to send friend request');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      setToastMessage('Error sending friend request');
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
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

  // Modify the renderFriendsList function to use handleUserClick
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
      <IonItem 
        key={friend.id} 
        className="friend-item staggered-item"
        onClick={() => handleUserClick(friend)} // Add this onClick handler
      >
        <IonAvatar slot="start">
          {friend.avatar ? (
            <img 
              src={friend.avatar} 
              alt={friend.name} 
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://ionicframework.com/docs/img/demos/avatar.svg';
              }}
            />
          ) : (
            <div className="default-avatar">{friend.name[0]}</div>
          )}
          {friend.status === 'Online' && <div className="online-indicator-favorites"></div>}
        </IonAvatar>
        
        <IonLabel>
          <h2>{friend.name}</h2>
          <p className="friend-status">
            <IonIcon icon={timeOutline} />
            {friend.status === 'Online' ? 'Active now' : `Last seen ${friend.lastSeen}`}
          </p>
        </IonLabel>
        
        <IonButton 
          fill="clear" 
          routerLink={`/chat-individual/${friend.id}`}
          onClick={(e) => {
            e.stopPropagation(); // Prevent the item's onClick from firing
          }}
        >
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
              <IonItem 
                key={request.id} 
                className="request-item incoming staggered-item"
                onClick={() => handleRequestClick(request, true)}
              >
                <IonAvatar slot="start">
                  {request.avatar ? (
                    <img 
                      src={request.avatar} 
                      alt={request.name} 
                      onError={(e) => {
                        console.log("Failed to load avatar:", request.avatar);
                        (e.target as HTMLImageElement).src = 'https://ionicframework.com/docs/img/demos/avatar.svg';
                      }}
                    />
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
                  <IonButton 
                    fill="clear" 
                    color="success" 
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent the item's onClick from firing
                      handleAcceptRequest(request.id);
                    }}
                  >
                    <IonIcon slot="icon-only" icon={checkmarkOutline} />
                  </IonButton>
                  <IonButton 
                    fill="clear" 
                    color="danger" 
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent the item's onClick from firing  
                      handleRejectRequest(request.id);
                    }}
                  >
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
              <IonItem 
                key={request.id} 
                className="request-item outgoing staggered-item"
                onClick={() => handleRequestClick(request, false)}
              >
                <IonAvatar slot="start">
                  {request.avatar ? (
                    <img 
                      src={request.avatar} 
                      alt={request.name} 
                      onError={(e) => {
                        console.log("Failed to load avatar:", request.avatar);
                        (e.target as HTMLImageElement).src = 'https://ionicframework.com/docs/img/demos/avatar.svg';
                      }}
                    />
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
                
                <IonButton 
                  fill="clear" 
                  color="medium" 
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent the item's onClick from firing
                    handleCancelRequest(request.id);
                  }}
                >
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
      
      {/* Add User Profile Modal */}
      <IonModal
        isOpen={showUserProfile}
        onDidDismiss={handleCloseProfile}
        className="ghost-profile-modal"
      >
        {selectedUser && (
          <>
            <div className="ghost-profile-header">
              <div className="ghost-profile-avatar">
                {selectedUser.avatar ? (
                  <img 
                    src={selectedUser.avatar} 
                    alt={selectedUser.name}
                    className="profile-avatar-image"
                    onError={(e) => {
                      console.log("Failed to load profile avatar:", selectedUser.avatar);
                      (e.target as HTMLImageElement).src = 'https://ionicframework.com/docs/img/demos/avatar.svg';
                    }}
                  />
                ) : (
                  <div className="ghost-default-avatar">
                    {selectedUser.name.charAt(0)}
                  </div>
                )}
              </div>
              
              <h2 
                className="ghost-profile-name" 
                onClick={toggleDetailedProfile}
                style={{ cursor: 'pointer' }}
              >
                {selectedUser.name}
                <IonIcon 
                  icon={showDetailedProfile ? chevronUp : chevronDown} 
                  style={{ fontSize: '0.9rem', marginLeft: '5px', verticalAlign: 'middle' }} 
                />
              </h2>
              
              <div className="ghost-profile-badges">
                {selectedUser.isVerified && (
                  <IonChip color="primary">
                    <IonIcon icon={checkmarkCircle} />
                    <IonLabel>Verified</IonLabel>
                  </IonChip>
                )}
                
                {selectedUser.proStatus && selectedUser.proStatus !== 'free' && (
                  <IonChip color={selectedUser.proStatus === 'yearly' ? 'secondary' : 'primary'}>
                    <IonIcon icon={selectedUser.proStatus === 'yearly' ? diamond : star} />
                    <IonLabel>Pro {selectedUser.proStatus === 'yearly' ? 'Yearly' : 'Monthly'}</IonLabel>
                  </IonChip>
                )}
              </div>
              
              <div className="ghost-profile-meta">
                <div className="ghost-profile-meta-item">
                  <IonIcon icon={timeOutline} />
                  {selectedUser.isOnline ? (
                    <span className="status-online">Online now</span>
                  ) : (
                    <span className="status-offline">Offline • {formatLastSeen(selectedUser.lastSeen || 0)}</span>
                  )}
                </div>
                
                {/* Add Member Since if it's public */}
                {selectedUser.memberSince && selectedUser.memberSinceVisibility === 'public' && (
                  <div className="ghost-profile-meta-item">
                    <IonIcon icon={calendar} />
                    Member since {selectedUser.memberSince}
                  </div>
                )}
              </div>
              
              {/* Detailed Profile Section - Collapsible */}
              {showDetailedProfile && (
                <div className="ghost-profile-details">
                  <IonList className="ghost-profile-details-list">
                    <IonItem lines="full" className="ghost-profile-detail-item">
                      <IonIcon slot="start" icon={fingerPrint} color="medium" />
                      <IonLabel>
                        <h3>User ID</h3>
                        <p className="ghost-user-id">GHOST-{selectedUser.id}</p>
                      </IonLabel>
                      <IonButton 
                        fill="clear" 
                        slot="end"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(`GHOST-${selectedUser.id}`);
                          setToastMessage('User ID copied to clipboard');
                          setShowToast(true);
                        }}
                      >
                        <IonIcon icon={copy} />
                      </IonButton>
                    </IonItem>
                    
                    {/* Only show bio if it exists and is public */}
                    {selectedUser.bio && selectedUser.bioVisibility === 'public' && (
                      <IonItem lines="full" className="ghost-profile-detail-item">
                        <IonIcon slot="start" icon={text} color="medium" />
                        <IonLabel>
                          <h3>Bio</h3>
                          <p>{selectedUser.bio}</p>
                        </IonLabel>
                      </IonItem>
                    )}
                    
                    {/* Only show email if it exists and is public */}
                    {selectedUser.email && selectedUser.emailVisibility === 'public' && (
                      <IonItem lines="full" className="ghost-profile-detail-item">
                        <IonIcon slot="start" icon={mail} color="medium" />
                        <IonLabel>
                          <h3>Email</h3>
                          <p>{selectedUser.email}</p>
                        </IonLabel>
                      </IonItem>
                    )}
                    
                    {/* Only show gender if it exists and is public */}
                    {selectedUser.gender && selectedUser.genderVisibility === 'public' && (
                      <IonItem lines="full" className="ghost-profile-detail-item">
                        <IonIcon slot="start" icon={person} color="medium" />
                        <IonLabel>
                          <h3>Gender</h3>
                          <p>
                            {selectedUser.gender === 'male' ? 'Male' : 
                             selectedUser.gender === 'female' ? 'Female' : 
                             selectedUser.gender === 'other' ? 'Other' : 'Prefer not to say'}
                          </p>
                        </IonLabel>
                      </IonItem>
                    )}
                    
                    <IonItem lines="full" className="ghost-profile-detail-item">
                      <IonIcon slot="start" icon={eye} color="medium" />
                      <IonLabel>
                        <h3>Profile Visibility</h3>
                        <p>{selectedUser.visibility === 'public' ? 'Public Profile' : 'Limited Profile'}</p>
                      </IonLabel>
                    </IonItem>
                    
                    {/* Show QR Code Option */}
                    <IonItem lines="none" className="ghost-profile-detail-item">
                      <IonIcon slot="start" icon={qrCodeOutline} color="medium" />
                      <IonLabel>
                        <h3>User QR Code</h3>
                        <p>View this user's QR code to connect quickly</p>
                      </IonLabel>
                      <IonButton 
                        fill="clear" 
                        slot="end"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (selectedUser.id) {
                            generateQRCode(selectedUser.id);
                          }
                        }}
                      >
                        <IonIcon icon={qrCodeOutline} />
                      </IonButton>
                    </IonItem>
                  </IonList>
                  
                  {/* Show a notice when most details are private */}
                  {!selectedUser.bio && 
                   !selectedUser.email && 
                   !selectedUser.gender && (
                    <div className="private-info-notice">
                      <IonIcon icon={lockClosed} />
                      <span>This user has set their profile details to private</span>
                    </div>
                  )}
                </div>
              )}
              
              <div className="ghost-profile-actions">
                <IonButton 
                  expand="block" 
                  color="primary"
                  className="ghost-modal-action-button"
                  onClick={() => handleStartChat(selectedUser.id)}
                >
                  <IonIcon slot="start" icon={chatbubble} />
                  Message
                </IonButton>
                
                <IonButton 
                  expand="block" 
                  color="danger"
                  className="ghost-modal-action-button"
                  onClick={() => handleRemoveFriend(selectedUser.id)}
                >
                  <IonIcon slot="start" icon={heartOutline} />
                  Remove Friend
                </IonButton>
              </div>
              
              <IonButton 
                expand="block" 
                fill="clear"
                color="medium"
                className="ghost-modal-close"
                onClick={handleCloseProfile}
              >
                <IonIcon slot="start" icon={close} />
                Close
              </IonButton>
            </div>
          </>
        )}
      </IonModal>
      
      {/* QR Code Modal */}
      <IonModal isOpen={showQrCodeModal} onDidDismiss={() => setShowQrCodeModal(false)}>
        <div className="qr-modal-header">
          <h3>{selectedUser ? selectedUser.name : ''}'s GhostTalk ID</h3>
          <IonButton fill="clear" onClick={() => setShowQrCodeModal(false)}>
            <IonIcon icon={close} />
          </IonButton>
        </div>
        <div className="qr-code-container">
          {isGeneratingQR ? (
            <div className="qr-loading">
              <IonSpinner name="dots" />
              <p>Generating QR code...</p>
            </div>
          ) : (
            <>
              <img src={qrCodeUrl} alt="QR Code" className="qr-code-image" />
              <p className="qr-code-id">GHOST-{selectedUser?.id}</p>
              <div className="qr-code-actions">
                <IonButton fill="clear" onClick={() => {
                  navigator.clipboard.writeText(`GHOST-${selectedUser?.id}`);
                  setToastMessage('User ID copied to clipboard');
                  setShowToast(true);
                }}>
                  <IonIcon slot="start" icon={copy} />
                  Copy ID
                </IonButton>
              </div>
            </>
          )}
        </div>
      </IonModal>
      
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={2000}
        position="top"
      />
      
      <IonActionSheet
        isOpen={showAddFriendSheet}
        onDidDismiss={() => setShowAddFriendSheet(false)}
        header="Add Friend"
        buttons={[
          {
            text: 'Search for Users',
            icon: searchOutline,
            handler: handleAddFriend
          },
          {
            text: 'Cancel',
            role: 'cancel'
          }
        ]}
      />
    </IonPage>
  );
};

export default FavoritesPage;