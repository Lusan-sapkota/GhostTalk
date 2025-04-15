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
  IonSkeletonText,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonFab,
  IonFabButton,
  IonModal,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonHeader,
  IonToast,
  IonFabList,
  IonSpinner,
  IonChip
} from '@ionic/react';
import { 
  personAdd, 
  chatbubble, 
  search as searchIcon,
  checkmarkCircle,
  scanOutline,
  close,
  timeOutline,
  qrCodeOutline,
  cameraOutline,
  star, 
  diamond, 
  calendar, 
  heart,
  heartOutline,
  chevronUp,
  chevronDown,
  fingerPrint,
  copy,
  text,
  eye,
  scan,
  mail,
  person,
  arrowForward,
  lockClosed,
  downloadOutline
} from 'ionicons/icons';
import { useState, useEffect, useRef } from 'react';
import './SearchPage.css';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api.service';
import LoginPrompt from '../components/LoginPrompt';
import HeaderComponent from '../components/HeaderComponent';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import jsQR from 'jsqr';
import { isPlatform } from '@ionic/react';
import { useHistory } from 'react-router-dom';

interface User {
  id: string;
  name: string;
  avatar?: string;
  status?: string;
  proStatus?: string;
  isVerified?: boolean;
  isOnline?: boolean;
  lastSeen?: number;
  isAdded?: boolean;
  // Add the missing properties
  bio?: string;
  visibility?: string;
  bioVisibility?: string;
  memberSinceVisibility?: string;
  emailVisibility?: string;
  genderVisibility?: string;
  gender?: string;
  email?: string;
  memberSince?: string;
  lastActive?: number;
}

const SearchPage: React.FC = () => {
  const history = useHistory();
  const [searchText, setSearchText] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [isProcessingQR, setIsProcessingQR] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [hasMoreResults, setHasMoreResults] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchOffset, setSearchOffset] = useState(0);
  const searchLimit = 15;
  
  const { isAuthenticated, currentUser } = useAuth();
  const modalRef = useRef<HTMLIonModalElement>(null);

  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showDetailedProfile, setShowDetailedProfile] = useState(false);

  // Add these with your other state variables
  const [showQrCodeModal, setShowQrCodeModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);

  // Handle search
  const handleSearch = async (value: string) => {
    setSearchText(value);
    
    // Check if value starts with GHOST- (case insensitive) and extract the ID part
    let searchValue = value;
    if (value.match(/^ghost-/i)) {
      // Strip the "ghost-" prefix for the API call
      searchValue = value.replace(/^ghost-/i, '');
      console.log(`Stripped "ghost-" prefix, searching for ID: ${searchValue}`);
    }
    
    if (searchValue.length >= 2) {
      setIsLoading(true);
      setHasSearched(true);
      setSearchOffset(0); // Reset pagination for new search
      setUsers([]); // Clear previous results
      
      try {
        const response = await apiService.makeRequest(`/search/users?q=${encodeURIComponent(searchValue)}&limit=${searchLimit}&offset=0`, 'GET');
        
        if (response.success) {
          setUsers(response.users || []);
          setHasMoreResults(response.users?.length >= searchLimit);
        } else {
          console.error('Search failed:', response.message);
          setToastMessage(response.message || 'Search failed');
          setShowToast(true);
        }
      } catch (error) {
        console.error('Error during search:', error);
        setToastMessage('Network error during search');
        setShowToast(true);
      } finally {
        setIsLoading(false);
      }
    } else if (searchValue.length === 0) {
      setUsers([]);
      setHasSearched(false);
      setHasMoreResults(false);
    }
  };

  const handleAddFriend = async (userId: string) => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }
    
    try {
      const response = await apiService.makeRequest('/friend/request/send', 'POST', { userId });
      
      if (response.success) {
        setToastMessage('Friend request sent successfully');
        
        // Update UI to show the request was sent
        const updatedUsers = users.map(user => {
          if (user.id === userId) {
            return { ...user, isAdded: true };
          }
          return user;
        });
        
        setUsers(updatedUsers);
      } else {
        setToastMessage(response.message || 'Failed to send friend request');
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      setToastMessage('Network error when sending friend request');
    } finally {
      setShowToast(true);
    }
  };

  const handleStartChat = (userId: string) => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }
    
    // Navigate to private chat with this user
    history.push(`/chat-individual/${userId}`);
  };

  const loadMoreUsers = async (event: CustomEvent) => {
    const newOffset = searchOffset + searchLimit;
    
    try {
      const response = await apiService.makeRequest(
        `/search/users?q=${encodeURIComponent(searchText)}&limit=${searchLimit}&offset=${newOffset}`, 
        'GET'
      );
      
      if (response.success && response.users) {
        if (response.users.length > 0) {
          setUsers([...users, ...response.users]);
          setSearchOffset(newOffset);
          setHasMoreResults(response.users.length >= searchLimit);
        } else {
          setHasMoreResults(false);
        }
      } else {
        console.error('Failed to load more results:', response.message);
      }
    } catch (error) {
      console.error('Error loading more results:', error);
    } finally {
      if (event.target) {
        (event.target as HTMLIonInfiniteScrollElement).complete();
      }
    }
  };

  // Format the last seen time
  const formatLastSeen = (timestamp: number): string => {
    if (!timestamp) return 'Unknown';
    
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString();
  };
  
  // QR Code scanner
  const startScan = async () => {
    if (!isPlatform('capacitor')) {
      setToastMessage('QR scanning is only available on mobile devices');
      setShowToast(true);
      return;
    }
    
    try {
      setIsProcessingQR(true);
      
      // Take a photo with the camera
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera
      });
      
      if (!image.dataUrl) {
        setToastMessage('Failed to capture image');
        setShowToast(true);
        setIsProcessingQR(false);
        return;
      }
      
      // Process the image to find QR codes
      const qrCode = await processQRFromImage(image.dataUrl);
      
      if (qrCode) {
        await processQrCode(qrCode);
      } else {
        setToastMessage('No QR code found in the image');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Error scanning QR code:', error);
      setToastMessage('Failed to scan QR code');
      setShowToast(true);
    } finally {
      setIsProcessingQR(false);
    }
  };
  
  // Add this helper method to decode QR codes from images
  const processQRFromImage = async (dataUrl: string): Promise<string | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        // Create a canvas to draw the image
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        if (!context) {
          resolve(null);
          return;
        }
        
        // Set canvas dimensions to image dimensions
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw image to canvas
        context.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Get image data for QR code processing
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        
        // Use jsQR to find QR code in the image
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        // Resolve with the QR code data or null if not found
        resolve(code ? code.data : null);
      };
      
      img.onerror = () => {
        resolve(null);
      };
      
      // Set image source to the data URL
      img.src = dataUrl;
    });
  };
  
  // Update the processQrCode function to better handle QR code data
  const processQrCode = async (content: string) => {
    try {
      // Check if it's a valid GhostTalk user ID (with or without GHOST- prefix)
      let userId = content;
      
      // Handle GHOST- prefix if present
      if (content.match(/^GHOST-/i)) {
        userId = content.replace(/^GHOST-/i, '');
      }
      
      console.log(`Processing QR code, extracted user ID: ${userId}`);
      
      // Look up the user by ID
      const response = await apiService.makeRequest(`/search/by-id/${userId}`, 'GET');
      
      if (response.success && response.user) {
        // Add user to search results
        const newUser = response.user;
        setUsers([newUser]);
        setHasSearched(true);
        setSearchText(`GHOST-${userId}`);
      } else {
        setToastMessage(response.message || 'User not found');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Error processing QR code:', error);
      setToastMessage('Failed to process QR code');
      setShowToast(true);
    }
  };
  
  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (isProcessingQR) {
        document.querySelector('body')?.classList.remove('scanner-active');
      }
    };
  }, [isProcessingQR]);

  const handleUserClick = async (user: User) => {
    // Set initial user data
    setSelectedUser({
      ...user,
      // Add default visibility settings if not already present
      visibility: user.visibility || 'limited',
      bioVisibility: user.bioVisibility || 'private',
      memberSinceVisibility: user.memberSinceVisibility || 'public',
      emailVisibility: user.emailVisibility || 'private',
      genderVisibility: user.genderVisibility || 'private'
    });
    
    setShowUserProfile(true);
    setShowDetailedProfile(false); // Reset detailed view
  
    // If authenticated, try to get more user details
    if (isAuthenticated) {
      try {
        const response = await apiService.getUserById(user.id);
        console.log("User profile response:", response); // Debug log
        
        if (response.success && response.user) {
          // Merge additional user details with type safety
          // Define interfaces for the API response and detailed user profile
          interface UserApiResponse {
            success: boolean;
            user: {
              bio?: string;
              email?: string;
              gender?: string;
              memberSince?: string;
              lastActive?: number;
              visibility?: string;
              bioVisibility?: string;
              memberSinceVisibility?: string;
              emailVisibility?: string;
              genderVisibility?: string;
            };
          }

          interface DetailedUserProfile extends User {
            bio?: string;
            email?: string;
            gender?: string;
            memberSince?: string;
            lastActive?: number;
            visibility: string;
            bioVisibility: string;
            memberSinceVisibility: string;
            emailVisibility: string;
            genderVisibility: string;
          }

          // Type the function with the new interfaces
          setSelectedUser((prevUser: DetailedUserProfile): DetailedUserProfile => ({
            ...prevUser,
            bio: response.user.bio || prevUser.bio || '',
            email: response.user.email,
            gender: response.user.gender,
            memberSince: response.user.memberSince,
            lastActive: response.user.lastActive,
            // Include visibility settings
            visibility: response.user.visibility || prevUser.visibility || 'limited',
            bioVisibility: response.user.bioVisibility || prevUser.bioVisibility || 'private',
            memberSinceVisibility: response.user.memberSinceVisibility || prevUser.memberSinceVisibility || 'public',
            emailVisibility: response.user.emailVisibility || prevUser.emailVisibility || 'private',
            genderVisibility: response.user.genderVisibility || prevUser.genderVisibility || 'private'
          }));
        }
      } catch (error) {
        console.error('Error fetching detailed user info:', error);
      }
    }
  };

  const handleCloseProfile = () => {
    setShowUserProfile(false);
  };

  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const handleAddRemoveFriend = async (userId: string, isAdded: boolean) => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }
    
    // Set loading state for this specific user
    setActionInProgress(userId);
    
    try {
      let response;
      
      if (isAdded) {
        // Remove friend - Using the correct endpoint
        response = await apiService.makeRequest('/friend/remove', 'POST', { userId });
        
        if (response.success) {
          setToastMessage('Friend removed successfully');
          
          // Update the selected user and users list
          setSelectedUser((prevUser: User): User => ({
            ...prevUser,
            isAdded: false
          }));
          
          // Update the users list if this user is there
          setUsers(prevUsers => 
            prevUsers.map(u => 
              u.id === userId ? {...u, isAdded: false} : u
            )
          );
          
          // Also refresh favorites list if we're viewing this user's profile
          if (showUserProfile && selectedUser?.id === userId) {
            // You could emit an event or use a context to notify FavoritesPage
            // For now, we'll rely on the FavoritesPage refreshing on focus
            console.log('Friend removed, favorites should refresh');
          }
        } else {
          setToastMessage(response.message || 'Failed to remove friend');
          setShowToast(true);
        }
      } else {
        // Add friend - show loading state and send request
        response = await apiService.makeRequest('/friend/request/send', 'POST', { userId });
        
        if (response.success) {
          setToastMessage('Friend request sent successfully');
          
          // Update UI to show the request was sent
          setSelectedUser((prevUser: User): User => ({
            ...prevUser,
            isAdded: true
          }));
          
          // Update the users list if this user is there
          setUsers(prevUsers => 
            prevUsers.map(u => 
              u.id === userId ? {...u, isAdded: true} : u
            )
          );
        } else {
          setToastMessage(response.message || 'Failed to send friend request');
          setShowToast(true);
        }
      }
    } catch (error) {
      console.error('Error updating friend status:', error);
      setToastMessage('Network error when updating friend status');
      setShowToast(true);
    } finally {
      // Clear loading state
      setActionInProgress(null);
    }
  };

  const toggleDetailedProfile = () => {
    setShowDetailedProfile(!showDetailedProfile);
  };

  // Add this function to your component
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

  return (
    <IonPage className="ghost-appear">
      <HeaderComponent 
        title="Search Users" 
        showSearch={true}
        onSearchChange={handleSearch}
        searchPlaceholder="Search by username or ID..."
      />
      
      <IonContent fullscreen>
        <div className="search-container">
          {!hasSearched && !isLoading && (
            <div className="search-instructions ghost-appear">
              <div className="search-icon-container ghost-float">
                <IonIcon icon={searchIcon} />
              </div>
              <h2>Find Friends on GhostTalk</h2>
              <p>
                Search for users by username or ID to connect.
                Start typing above or scan a QR code to find someone.
              </p>
              <div className="search-instructions-qr">
                <IonButton 
                  expand="block" 
                  fill="outline"
                  onClick={startScan}
                  disabled={!isPlatform('capacitor')}
                >
                  <IonIcon slot="start" icon={qrCodeOutline} />
                  Scan QR Code
                </IonButton>
              </div>
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
                Try a different search term or scan their QR code.
              </p>
            </div>
          )}
          
          {users.length > 0 && (
            <IonList className="search-results">
              {users.map(user => (
                <IonItem 
                  key={user.id} 
                  className="ghost-user-item staggered-item"
                  lines="none"
                  detail={false}
                  onClick={() => handleUserClick(user)}
                >
                  <IonAvatar slot="start" className="ghost-user-avatar">
                    <div className="ghost-avatar-container">
                      {user.avatar ? (
                        <img 
                          src={user.avatar} 
                          alt={user.name}
                          className="ghost-avatar-img"
                          onError={(e) => {
                            e.currentTarget.src = 'https://ionicframework.com/docs/img/demos/avatar.svg';
                          }}
                        />
                      ) : (
                        <div className="ghost-default-avatar">
                          {user.name.charAt(0)}
                        </div>
                      )}
                      {user.isOnline && <div className="ghost-online-indicator"></div>}
                    </div>
                  </IonAvatar>
                  
                  <div className="ghost-user-content">
                    <div className="ghost-user-header">
                      <h2 className="ghost-user-name">{user.name}</h2>
                      <div className="ghost-badge-container">
                        {user.isVerified && (
                          <IonIcon icon={checkmarkCircle} className="ghost-verified-badge" />
                        )}
                        {user.proStatus && user.proStatus !== 'free' && (
                          <IonBadge 
                            className={`ghost-pro-badge ${user.proStatus === 'yearly' ? 'ghost-pro-yearly' : ''}`}
                          >
                            <IonIcon icon={user.proStatus === 'yearly' ? diamond : star} />
                            Pro
                          </IonBadge>
                        )}
                      </div>
                    </div>
                    
                    <div className="ghost-user-meta">
                      <IonIcon icon={timeOutline} />
                      {user.isOnline ? (
                        <span className="status-online">Online now</span>
                      ) : (
                        <span className="status-offline">Offline • {formatLastSeen(user.lastSeen || 0)}</span>
                      )}
                    </div>
                  </div>
                </IonItem>
              ))}
            </IonList>
          )}
          
          {hasMoreResults && (
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
        
        {/* QR Scanner FAB button for mobile devices */}
        {isPlatform('capacitor') && (
          <IonFab vertical="bottom" horizontal="end" slot="fixed">
            <IonFabButton onClick={startScan} disabled={isProcessingQR}>
              {isProcessingQR ? (
                <IonSpinner name="crescent" />
              ) : (
                <IonIcon icon={scanOutline} />
              )}
            </IonFabButton>
          </IonFab>
        )}
        
        {/* QR Scanner Modal for web preview */}
        <IonModal 
          isOpen={showQrScanner && !isPlatform('capacitor')} 
          onDidDismiss={() => setShowQrScanner(false)}
          ref={modalRef}
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>Scan QR Code</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowQrScanner(false)}>
                  <IonIcon icon={close} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="qr-scanner-content">
            <div className="qr-scanner-placeholder">
              <IonIcon icon={cameraOutline} color="medium" />
              <p>QR scanning is only available on mobile devices</p>
              <IonButton 
                expand="block"
                onClick={() => {
                  setShowQrScanner(false);
                  // For testing, simulate a successful scan
                  processQrCode('GHOST-testuser123');
                }}
              >
                Simulate Scan (Test Only)
              </IonButton>
            </div>
          </IonContent>
        </IonModal>
        
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          position="bottom"
        />

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
                      onError={(e) => {
                        e.currentTarget.src = 'https://ionicframework.com/docs/img/demos/avatar.svg';
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
                  
                  {/* Only show memberSince if it exists and visibility is public */}
                  {selectedUser.memberSince && selectedUser.memberSinceVisibility === 'public' && (
                    <div className="ghost-profile-meta-item">
                      <IonIcon icon={calendar} />
                      Member since {selectedUser.memberSince}
                    </div>
                  )}
                </div>
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
                    
                    {/* Only show the QR scanning option for the user's own profile */}
                    {currentUser?.id === selectedUser.id && (
                      <IonItem lines="none" className="ghost-profile-detail-item">
                        <IonIcon slot="start" icon={qrCodeOutline} color="medium" />
                        <IonLabel>
                          <h3>Your QR Code</h3>
                          <p>Share your QR code to connect quickly</p>
                        </IonLabel>
                        <IonButton 
                          fill="clear" 
                          slot="end"
                          onClick={() => {
                            if (selectedUser.id) {
                              history.push('/profile');
                            }
                          }}
                        >
                          <IonIcon icon={arrowForward} />
                        </IonButton>
                      </IonItem>
                    )}

                    {/* Show QR code option for all users */}
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
                          if (selectedUser && selectedUser.id) {
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
                   !selectedUser.gender && 
                   currentUser?.id !== selectedUser.id && (
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
                  color={selectedUser.isAdded ? 'danger' : 'secondary'}
                  className="ghost-modal-action-button"
                  onClick={() => handleAddRemoveFriend(selectedUser.id, selectedUser.isAdded)}
                  disabled={actionInProgress === selectedUser.id}
                >
                  {actionInProgress === selectedUser.id ? (
                    <IonSpinner name="dots" />
                  ) : (
                    <>
                      <IonIcon slot="start" icon={selectedUser.isAdded ? heart : heartOutline} />
                      {selectedUser.isAdded ? 'Remove' : 'Add Friend'}
                    </>
                  )}
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
                    if (selectedUser) {
                      navigator.clipboard.writeText(`GHOST-${selectedUser.id}`);
                      setToastMessage('User ID copied to clipboard');
                      setShowToast(true);
                    }
                  }}>
                    <IonIcon slot="start" icon={copy} />
                    Copy ID
                  </IonButton>
                  <IonButton fill="clear" onClick={() => {
                    // Download QR code functionality
                    if (qrCodeUrl) {
                      const link = document.createElement('a');
                      link.href = qrCodeUrl;
                      link.download = `ghosttalk-qr-${selectedUser?.id || 'user'}.png`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }
                  }}>
                    <IonIcon slot="start" icon={downloadOutline} />
                    Download
                  </IonButton>
                </div>
              </>
            )}
          </div>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default SearchPage;