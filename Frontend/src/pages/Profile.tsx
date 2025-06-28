import {
  IonContent,
  IonPage,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonToggle,
  IonAvatar,
  IonChip,
  IonAlert,
  IonToast,
  IonSpinner,
  IonActionSheet,
  IonModal,
  IonBadge,
  IonSearchbar
} from '@ionic/react';
import { 
  person, 
  camera, 
  settings, 
  qrCode, 
  calendar,
  chevronForward,
  shieldOutline,
  documentTextOutline,
  create,
  checkmarkOutline,
  settingsOutline,
  optionsOutline,
  logOut,
  copyOutline,
  close,
  share,
  downloadOutline,
  image as imagesOutline, // Change this import - Ionicons doesn't have 'imagesOutline'
  diamond,
  star,
  chevronBack
} from 'ionicons/icons';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import './Profile.css';
import BackHeaderComponent from '../components/BackHeaderComponent';
import { userService, ProfileUpdateData } from '../services/userService';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api.service';

const Profile: React.FC = () => {
  const history = useHistory();
  const { logout, currentUser } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [userId, setUserId] = useState('');
  const [memberSince, setMemberSince] = useState('');
  const [gender, setGender] = useState('');
  const [isOnline, setIsOnline] = useState(false);
  const [proStatus, setProStatus] = useState('free');
  const [avatar, setAvatar] = useState('https://ionicframework.com/docs/img/demos/avatar.svg');
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [availableAvatars, setAvailableAvatars] = useState<{id: string; name: string; url: string; mimeType?: string}[]>([]);
  const [loadingAvatars, setLoadingAvatars] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedAlert, setShowUnsavedAlert] = useState(false);

  const [hasProfileChanges, setHasProfileChanges] = useState(false);
  const [showProfileUnsavedAlert, setShowProfileUnsavedAlert] = useState(false);
  const [originalProfileData, setOriginalProfileData] = useState({
    username: '',
    email: '',
    bio: '',
    isOnline: false
  });

  useEffect(() => {
    loadUserProfile();
  }, []);
  

  const formatMemberSince = (timestamp: string | number): string => {
    if (!timestamp) return 'Unknown';
    
    try {
      let date;
      
      // Check if timestamp is a string with ISO format
      if (typeof timestamp === 'string' && timestamp.includes('T')) {
        date = new Date(timestamp);
      } 
      // Check if timestamp is a number (unix timestamp in seconds)
      else if (typeof timestamp === 'number') {
        date = new Date(timestamp * 1000);
      } 
      // Fallback
      else {
        date = new Date(timestamp);
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.error('Invalid date format:', timestamp);
        return 'Unknown join date';
      }
      
      return `Member since ${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
    } catch (error) {
      console.error('Error formatting date:', error, timestamp);
      return 'Unknown join date';
    }
  };

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      const response = await userService.getProfile();
      
      if (response.success) {
        const user = response.user;
        console.log('User data from backend:', user);
        
        // Set current values
        setUsername(user.name || 'GhostUser');
        setEmail(user.email || '');
        setBio(user.bio || 'Just a friendly ghost in the digital world.');
        setUserId(user.id || '');
        setIsOnline(user.isOnline || false);
        setProStatus(user.proStatus || 'free');
        setGender(user.gender || 'prefer_not_to_say');
        
        // Store original values for change detection
        setOriginalProfileData({
          username: user.name || 'GhostUser',
          email: user.email || '',
          bio: user.bio || 'Just a friendly ghost in the digital world.',
          isOnline: user.isOnline || false
        });
        
        // Format registration date correctly
        if (user.registration) {
          setMemberSince(formatMemberSince(user.registration));
        }
        
        // Set avatar if available from the backend
        if (user.avatar) {
          console.log('Avatar from backend:', user.avatar);
          
          // If avatar is a full URL
          if (typeof user.avatar === 'string' && user.avatar.startsWith('http')) {
            console.log('Using full URL for avatar');
            setAvatar(user.avatar);
          } else {
            // Use our consistent getAvatarUrl function for all avatar loading
            console.log(`Setting avatar with ID: ${user.avatar}`);
            setAvatar(getAvatarUrl(user.avatar));
          }
        } else {
          console.log('No avatar found in user data');
          setAvatar('https://ionicframework.com/docs/img/demos/avatar.svg');
        }
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Failed to load profile. Please try again.');
      setToastMessage('Failed to load profile');
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsLoading(true);
      
      const profileData: ProfileUpdateData = {
        username: username,
        email: email,
        bio: bio,
        gender: gender,
        proStatus: proStatus
      };
      
      const response = await userService.updateProfile(profileData);
      
      if (response.success) {
        setToastMessage('Profile updated successfully!');
        setShowToast(true);
        setIsEditing(false);
      } else {
        setError('Failed to update profile');
        setToastMessage('Failed to update profile');
        setShowToast(true);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
      setToastMessage('Failed to update profile');
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleOnlineStatusChange = async (event: CustomEvent) => {
    const newStatus = event.detail.checked;
    setIsOnline(newStatus);
    
    try {
      const response = await userService.updateOnlineStatus(newStatus);
      if (!response.success) {
        // Revert UI if update failed
        setIsOnline(!newStatus);
        setToastMessage('Failed to update online status');
        setShowToast(true);
      }
    } catch (err) {
      console.error('Error updating online status:', err);
      // Revert UI if update failed
      setIsOnline(!newStatus);
      setToastMessage('Failed to update online status');
      setShowToast(true);
    }
  };
  
  const handleLogout = async () => {
    try {
      await logout();
      history.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
      setToastMessage('Failed to logout');
      setShowToast(true);
    }
  };

  const generateQRCode = async () => {
    if (!userId) {
      console.error("Cannot generate QR code: No user ID available");
      setToastMessage('Failed to generate QR code: User ID not available');
      setShowToast(true);
      return;
    }
    
    setIsGeneratingQR(true);
    try {
      console.log(`Generating QR code for user ID: ${userId}`);
      
      // Call the API directly instead of going through userService for debugging
      const response = await apiService.makeRequest(`/user/qrcode/${userId}`, 'GET');
      
      console.log('QR code API response:', response);
      
      if (response.success && response.qrCodeUrl) {
        setQrCodeUrl(response.qrCodeUrl);
        setShowQRModal(true);
      } else {
        console.error('QR code generation failed:', response.message || 'Unknown error');
        setToastMessage('Failed to generate QR code: ' + (response.message || 'Unknown error'));
        setShowToast(true);
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      setToastMessage('Failed to generate QR code: Network error');
      setShowToast(true);
    } finally {
      setIsGeneratingQR(false);
    }
  };

  const copyUserId = () => {
    const userIdToCopy = `GHOST-${userId}`;
    navigator.clipboard.writeText(userIdToCopy)
      .then(() => {
        setToastMessage('User ID copied to clipboard');
        setShowToast(true);
      })
      .catch(err => {
        console.error('Error copying to clipboard:', err);
        setToastMessage('Failed to copy ID');
        setShowToast(true);
      });
  };

  const handleAvatarClick = () => {
    if (isEditing) {
      // Load available avatars first
      loadAvailableAvatars();
      setShowAvatarSelector(true);
    }
  };

  // Modify the loadAvailableAvatars function to add more logging
  const loadAvailableAvatars = async () => {
    setLoadingAvatars(true);
    
    // Add a timeout to prevent endless loading
    const loadingTimeout = setTimeout(() => {
      setLoadingAvatars(false);
      setToastMessage('Avatar loading timed out. Please try again.');
      setShowToast(true);
    }, 30000); // 30 second timeout
    
    try {
      console.log('Calling getAvailableAvatars...');
      const response = await userService.getAvailableAvatars();
      console.log('Avatar API response:', response);
      
      // Clear the timeout since we got a response
      clearTimeout(loadingTimeout);
      
      if (response.success && response.avatars) {
        console.log(`Loaded ${response.avatars.length} avatars from backend`);
        
        // Add this warning only if no avatars were returned
        if (response.avatars.length === 0) {
          console.warn('Server returned success but no avatars were included');
        }
        
        // Log the first few avatars for debugging
        if (response.avatars.length > 0) {
          console.log('First 3 avatars:', response.avatars.slice(0, 3));
        }
        
        setAvailableAvatars(response.avatars);
        // Reset pagination when loading avatars
        setCurrentPage(1);
        setSelectedAvatar(null);
      } else {
        console.error('Failed to load avatars - API returned:', response);
        setToastMessage('Failed to load avatars. Please try again.');
        setShowToast(true);
      }
    } catch (error) {
      // Clear the timeout in case of error too
      clearTimeout(loadingTimeout);
      
      console.error('Error loading avatars:', error);
      setToastMessage('Error loading avatars. Please try again.');
      setShowToast(true);
    } finally {
      setLoadingAvatars(false);
    }
  };

  // Add this function to create proper avatar URLs
  // Update the function to consider SVG mime types
  const getAvatarUrl = (avatarId: string) => {
    if (!avatarId) {
      console.log('No avatar ID provided, using default');
      return 'https://ionicframework.com/docs/img/demos/avatar.svg';
    }
    
    // Use the backend proxy endpoint
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://192.168.18.2:5000/api';
    const url = `${apiBaseUrl}/user/avatar/${avatarId}`;
    console.log('Generated avatar URL:', url);
    return url;
  };

  const selectAvatar = async (avatarId: string) => {
    setIsLoading(true);
    try {
      const response = await userService.selectAvatar(avatarId);
      if (response.success) {
        setAvatar(getAvatarUrl(avatarId));
        setToastMessage('Avatar updated successfully');
        setShowToast(true);
      } else {
        setToastMessage(response.message || 'Failed to update avatar');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Error selecting avatar:', error);
      setToastMessage('Failed to update avatar');
      setShowToast(true);
    } finally {
      setIsLoading(false);
      setShowAvatarSelector(false);
    }
  };

  

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
  
    // Create a temporary local preview
    const localUrl = URL.createObjectURL(file);
    setAvatar(localUrl);
    setShowPhotoOptions(false);
    
    // Upload to the backend
    const formData = new FormData();
    formData.append('avatar', file);
    
    setIsLoading(true);
    userService.uploadAvatar(formData)
      .then(response => {
        if (response.success) {
          setToastMessage('Avatar updated successfully');
          // Set the new avatar URL from the backend
          if (response.avatar) {
            const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://192.168.18.2:5000/api';
            setAvatar(`${apiBaseUrl}/user/avatar/${response.avatar}`);
          }
        } else {
          setToastMessage('Failed to update avatar');
          // Reset to previous avatar
          loadUserProfile();
        }
      })
      .catch(error => {
        console.error('Error uploading avatar:', error);
        setToastMessage('Failed to update avatar');
        // Reset to previous avatar
        loadUserProfile();
      })
      .finally(() => {
        setShowToast(true);
        setIsLoading(false);
      });
  };

  const handleTakePicture = () => {
    // This would be implemented for mobile with Capacitor Camera API
    setShowPhotoOptions(false);
  };

  // First, ensure you're checking the user's subscription status
  const isPro = proStatus === 'monthly' || proStatus === 'yearly';

  const renderProBadge = () => {
    if (!proStatus || proStatus === 'free') return null;
    
    if (proStatus === 'yearly') {
      return (
        <IonBadge className="pro-badge yearly-pro-badge">
          <IonIcon icon={diamond} /> Pro Yearly
        </IonBadge>
      );
    } else if (proStatus === 'monthly') {
      return (
        <IonBadge className="pro-badge monthly-pro-badge">
          <IonIcon icon={star} /> Pro Monthly
        </IonBadge>
      );
    }
    
    return null;
  };

  const paginatedAvatars = useMemo(() => {
    // Debug the data
    console.log(`Total avatars available: ${availableAvatars.length}`);
    console.log(`Current search query: "${searchQuery}"`);
    
    // Filter by search query
    let filtered = availableAvatars;
    
    // Only filter if search query has actual content
    if (searchQuery && searchQuery.trim() !== '') {
      const searchTerms = searchQuery.toLowerCase().trim().split(/\s+/);
      
      filtered = filtered.filter(avatar => {
        const avatarName = avatar.name?.toLowerCase() || '';
        // Check if any of the search terms match
        return searchTerms.some(term => avatarName.includes(term));
      });
      
      console.log(`Search results for "${searchQuery}": ${filtered.length} avatars found`);
    }
    
    // Calculate total pages
    const total = Math.ceil(filtered.length / itemsPerPage);
    setTotalPages(Math.max(1, total)); // Ensure at least 1 page
    
    // Return paginated results
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    // Reset to page 1 if current page would be empty due to search filtering
    if (startIndex >= filtered.length && currentPage > 1 && filtered.length > 0) {
      setCurrentPage(1);
      return filtered.slice(0, itemsPerPage);
    }
    
    const result = filtered.slice(startIndex, endIndex);
    console.log(`Showing ${result.length} avatars on page ${currentPage}`);
    return result;
  }, [availableAvatars, currentPage, itemsPerPage, searchQuery]);

  useEffect(() => {
    // Reset to first page whenever search query changes
    setCurrentPage(1);
  }, [searchQuery]);

  // Add this useEffect to monitor changes to availableAvatars
  useEffect(() => {
    if (availableAvatars.length > 0) {
      // Make sure currentPage is valid based on total pages
      const maxPages = Math.ceil(availableAvatars.length / itemsPerPage);
      if (currentPage > maxPages) {
        setCurrentPage(1);
      }
      console.log(`Avatar array updated. Total: ${availableAvatars.length}, Pages: ${maxPages}`);
    }
  }, [availableAvatars, itemsPerPage]);

  const handleSelectAvatar = (avatarId: string) => {
    setSelectedAvatar(avatarId);
    setHasUnsavedChanges(true);
  };

  const handleSaveAvatar = async () => {
    if (!selectedAvatar) return;
    
    setIsLoading(true);
    try {
      const response = await userService.selectAvatar(selectedAvatar);
      if (response.success) {
        setAvatar(getAvatarUrl(selectedAvatar));
        setToastMessage('Avatar updated successfully');
        setShowToast(true);
        setHasUnsavedChanges(false);
        setShowAvatarSelector(false);
      } else {
        setToastMessage(response.message || 'Failed to update avatar');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Error selecting avatar:', error);
      setToastMessage('Failed to update avatar');
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseAvatarModal = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedAlert(true);
    } else {
      setShowAvatarSelector(false);
    }
  };

  const discardAvatarChanges = () => {
    setSelectedAvatar(null);
    setHasUnsavedChanges(false);
    setShowAvatarSelector(false);
    setShowUnsavedAlert(false);
  };

  // Add this function to check for unsaved changes
  const hasUnsavedProfileChanges = () => {
    return bio !== originalProfileData.bio || 
           isOnline !== originalProfileData.isOnline;
  };

  // Modify to track changes as user edits
  const handleBioChange = (value: string) => {
    setBio(value);
    setHasProfileChanges(true);
  };

  // Update the enabling/disabling of edit mode
  const enableEditMode = () => {
    setIsEditing(true);
    setHasProfileChanges(false); // Reset change tracking when entering edit mode
  };

  const disableEditMode = () => {
    if (hasUnsavedProfileChanges()) {
      setShowProfileUnsavedAlert(true);
    } else {
      setIsEditing(false);
    }
  };

  const discardProfileChanges = () => {
    // Reset to original values
    setBio(originalProfileData.bio);
    setIsOnline(originalProfileData.isOnline);
    setHasProfileChanges(false);
    setIsEditing(false);
    setShowProfileUnsavedAlert(false);
  };

  useEffect(() => {
    // Handle hardware back button on mobile devices
    const handleHardwareBackButton = (e: CustomEvent<any>) => {
      if (isEditing && hasUnsavedProfileChanges()) {
        e.detail.register(10, () => {
          setShowProfileUnsavedAlert(true);
        });
      } else if (showAvatarSelector && hasUnsavedChanges) {
        e.detail.register(10, () => {
          setShowUnsavedAlert(true);
        });
      }
    };

    document.addEventListener('ionBackButton', handleHardwareBackButton as EventListener);
    
    return () => {
      document.removeEventListener('ionBackButton', handleHardwareBackButton as EventListener);
    };
  }, [isEditing, showAvatarSelector, hasUnsavedChanges]);

  // Add this function to handle back button clicks
  const handleBack = () => {
    // Check for unsaved changes in edit mode
    if (isEditing && hasUnsavedProfileChanges()) {
      setShowProfileUnsavedAlert(true);
      return; // Don't navigate back yet
    }
    
    // Check for unsaved avatar selection
    if (showAvatarSelector && hasUnsavedChanges) {
      setShowUnsavedAlert(true);
      return; // Don't navigate back yet
    }
    
    // No unsaved changes, proceed with normal back navigation
    window.history.back();
  };

  return (
    <IonPage className="ghost-appear">
      <BackHeaderComponent 
        title="Profile" 
        onBack={handleBack} 
      />
      
      <IonContent fullscreen>
        {isLoading ? (
          <div className="loading-container">
            <IonSpinner name="crescent" />
            <p>Loading profile...</p>
          </div>
        ) : (
          <>
            <div className="profile-header">
              <div className="avatar-upload" onClick={handleAvatarClick}>
                <IonAvatar className="profile-avatar">
                  {isLoading ? (
                    <div className="avatar-loading">
                      <IonSpinner name="crescent" />
                    </div>
                  ) : (
                    <img 
                      src={avatar} 
                      alt="Profile"
                      className={`avatar-image ${avatar.includes('svg') ? 'svg-avatar' : ''}`}
                      onError={(e) => {
                        console.log('Avatar failed to load, using default');
                        e.currentTarget.src = 'https://ionicframework.com/docs/img/demos/avatar.svg';
                      }}
                    />
                  )}
                </IonAvatar>
                {isEditing && (
                  <div className="avatar-upload-overlay">
                    <IonIcon icon={camera} />
                  </div>
                )}
              </div>
              
              <div className="profile-info-container">
                <h2 className="username">{username}</h2>
                <p className="user-id" onClick={() => generateQRCode()}>
                  <IonIcon icon={qrCode} />
                  {userId ? `GHOST-${userId.substring(0,8)}` : 'GHOST-USER'}
                  <IonIcon icon={copyOutline} className="copy-icon" onClick={(e) => {
                    e.stopPropagation();
                    copyUserId();
                  }} />
                </p>
                {renderProBadge()}
                <div className="profile-meta">
                  <div className="profile-meta-item profile-meta-online">
                    <div className={`online-indicator-profile ${isOnline ? 'online' : 'offline'}`}></div>
                    {isOnline ? 'Online' : 'Offline'}
                  </div>
                  <div className="profile-meta-item profile-meta-since">
                    <IonIcon icon={calendar} />
                    {memberSince}
                  </div>
                </div>
              </div>
            </div>

            <div className="profile-content">

              <IonCard className="ghost-shadow">
                <IonCardHeader>
                  <h3>
                    <IonIcon icon={person} color="primary" />
                    Personal Information
                  </h3>
                </IonCardHeader>
                <IonCardContent>
                  <IonItem>
                    <IonLabel position="stacked">Username</IonLabel>
                    <IonInput 
                      value={username} 
                      onIonChange={e => setUsername(e.detail.value!)} 
                      disabled={true}
                    />
                  </IonItem>
                  
                  <IonItem>
                    <IonLabel position="stacked">Email</IonLabel>
                    <IonInput 
                      type="email" 
                      value={email} 
                      onIonChange={e => setEmail(e.detail.value!)} 
                      disabled={true}
                    />
                  </IonItem>
                  
                  <IonItem>
                    <IonLabel position="stacked">Bio</IonLabel>
                    <IonInput 
                      value={bio} 
                      onIonChange={e => handleBioChange(e.detail.value!)} 
                      disabled={!isEditing}
                    />
                  </IonItem>

                  <IonItem>
                    <IonLabel position="stacked">Gender</IonLabel>
                    <IonInput 
                      value={
                        gender === 'male' ? 'Male' : 
                        gender === 'female' ? 'Female' : 
                        gender === 'other' ? 'Other' : 'Prefer not to say'
                      } 
                      disabled={true} // We don't edit gender here, it's in settings
                    />
                  </IonItem>

                  <IonItem>
                    <IonLabel>Online Status</IonLabel>
                    <IonToggle 
                      checked={isOnline} 
                      onIonChange={e => {
                        setIsOnline(e.detail.checked);
                        setHasProfileChanges(true);
                        handleOnlineStatusChange(e);
                      }}
                      disabled={!isEditing}
                    />
                  </IonItem>

                  {!isEditing ? (
                    <IonButton 
                      expand="block" 
                      className="profile-action-btn edit-btn"
                      onClick={enableEditMode}
                    >
                      <IonIcon slot="start" icon={create} />
                      Enable Editing
                    </IonButton>
                  ) : (
                    <IonButton 
                      expand="block" 
                      color="primary" 
                      className="profile-action-btn save-btn"
                      onClick={handleSaveProfile}
                    >
                      <IonIcon slot="start" icon={checkmarkOutline} />
                      Save Changes
                    </IonButton>
                  )}
                </IonCardContent>
              </IonCard>

              <IonCard className="ghost-shadow" onClick={() => history.push('/settings')} style={{ cursor: 'pointer' }}>
                <IonCardHeader>
                  <h3>
                    <IonIcon icon={documentTextOutline} color="primary" />
                    Privacy and Settings
                  </h3>
                </IonCardHeader>
                <IonCardContent>
                <h4>
                  Manage your account settings and privacy options.{' '}
                  <span style={{ color: 'green', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontWeight: 'bold' }}>
                    Click here to get started
                  </span>
                </h4>
                </IonCardContent>
              </IonCard>

              <IonCard className="profile-options-card ghost-shadow">
                <IonCardHeader>
                  <h3>
                    <IonIcon icon={settingsOutline} color="primary" />
                    Account Options
                  </h3>
                </IonCardHeader>
                <IonCardContent>
                  <div className="profile-options-container">
                    <IonButton expand="block" fill="clear" className="profile-option-btn" routerLink="/settings">
                      <IonIcon slot="start" icon={optionsOutline} />
                      Go to Settings
                      <IonIcon slot="end" icon={chevronForward} />
                    </IonButton>
                    
                    <IonButton expand="block" fill="clear" className="profile-option-btn" routerLink="/privacy">
                      <IonIcon slot="start" icon={shieldOutline} />
                      Review Privacy Policy
                      <IonIcon slot="end" icon={chevronForward} />
                    </IonButton>
                    
                    <IonButton expand="block" fill="clear" className="profile-option-btn" routerLink="/terms">
                      <IonIcon slot="start" icon={documentTextOutline} />
                      Review Terms of Service
                      <IonIcon slot="end" icon={chevronForward} />
                    </IonButton>
                    
                    <IonButton 
                      expand="block" 
                      fill="clear" 
                      className="profile-option-btn logout-btn" 
                      onClick={() => setShowLogoutAlert(true)}
                    >
                      <IonIcon slot="start" icon={logOut} color="danger" />
                      Logout
                    </IonButton>
                  </div>
                </IonCardContent>
              </IonCard>

              {!isPro && (
                <div className="profile-section">
                  <IonCard className="upgrade-card">
                    <IonCardContent>
                      <h3>Upgrade to GhostTalk Pro</h3>
                      <ul>
                        <li>24-hour message retention</li>
                        <li>Unlimited chat rooms</li>
                        <li>Premium avatars & themes</li>
                        <li>No advertisements</li>
                      </ul>
                      <IonButton 
                        expand="block" 
                        className="pro-upgrade-btn"
                        onClick={() => history.push('/billing')}
                      >
                        <IonIcon slot="start" icon={diamond} />
                        Upgrade to Pro
                      </IonButton>
                    </IonCardContent>
                  </IonCard>
                </div>
              )}
            </div>

            <IonToast
              isOpen={showToast}
              onDidDismiss={() => setShowToast(false)}
              message={toastMessage}
              duration={2000}
              position={isPro ? "top" : "bottom"}
            />
          </>
        )}

        <div className="profile-legal-links">
          <a href="/privacy" className="profile-legal-link">
            <IonIcon icon={shieldOutline} />
            Privacy Policy
          </a>
          <a href="/terms" className="profile-legal-link">
            <IonIcon icon={documentTextOutline} />
            Terms of Service
          </a>
        </div>

        <IonAlert
          isOpen={showLogoutAlert}
          onDidDismiss={() => setShowLogoutAlert(false)}
          header="Logout"
          message="Are you sure you want to logout?"
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel'
            },
            {
              text: 'Logout',
              handler: handleLogout
            }
          ]}
        />

        {/* QR Code Modal */}
        <IonModal isOpen={showQRModal} onDidDismiss={() => setShowQRModal(false)}>
          <div className="qr-modal-header">
            <h3>Your GhostTalk ID</h3>
            <IonButton fill="clear" onClick={() => setShowQRModal(false)}>
              <IonIcon icon={close} />
            </IonButton>
          </div>
          <div className="qr-code-container">
            {isGeneratingQR ? (
              <IonSpinner name="circles" />
            ) : (
              <>
                <img src={qrCodeUrl} alt="QR Code" className="qr-code-image" />
                <p className="qr-code-id">GHOST-{userId}</p>
                <div className="qr-code-actions">
                  <IonButton fill="clear" onClick={copyUserId}>
                    <IonIcon slot="start" icon={copyOutline} />
                    Copy ID
                  </IonButton>
                  <IonButton fill="clear" onClick={() => {
                    // Share functionality would be implemented here
                    // For mobile, you'd use Capacitor Share API
                    setToastMessage('Sharing feature coming soon');
                    setShowToast(true);
                  }}>
                    <IonIcon slot="start" icon={share} />
                    Share
                  </IonButton>
                  <IonButton fill="clear" onClick={() => {
                    // Download QR code functionality
                    const link = document.createElement('a');
                    link.href = qrCodeUrl;
                    link.download = `ghosttalk-qr-${userId}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}>
                    <IonIcon slot="start" icon={downloadOutline} />
                    Download
                  </IonButton>
                </div>
              </>
            )}
          </div>
        </IonModal>

        {/* Hidden file input for avatar upload */}
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }}
          accept="image/*" 
          onChange={handleFileUpload}
        />

        {/* Photo options action sheet */}
        <IonActionSheet
          isOpen={showPhotoOptions}
          onDidDismiss={() => setShowPhotoOptions(false)}
          buttons={[
            {
              text: 'Take Photo',
              icon: camera,
              handler: handleTakePicture
            },
            {
              text: 'Choose from Gallery',
              icon: imagesOutline, // Changed from 'images-outline'
              handler: () => fileInputRef.current?.click()
            },
            {
              text: 'Cancel',
              role: 'cancel'
            }
          ]}
        />

        {/* Avatar Selector Modal */}
        <IonModal isOpen={showAvatarSelector} onDidDismiss={handleCloseAvatarModal}>
          <div className="avatar-modal-header">
            <h3>Choose Avatar</h3>
            <IonButton fill="clear" onClick={handleCloseAvatarModal}>
              <IonIcon icon={close} />
            </IonButton>
          </div>
          
          <div className="avatar-grid-container">
            <div className="avatar-search-container">
              <IonSearchbar
                className="avatar-search-bar"
                value={searchQuery}
                onIonChange={e => setSearchQuery(e.detail.value || '')}
                placeholder="Search avatars..."
                animated={true}
                debounce={300}
              />
              
              {/* Add a reset button to help if things get stuck */}
              {availableAvatars.length > 0 && paginatedAvatars.length === 0 && (
                <div className="avatar-reset">
                  <IonButton 
                    size="small" 
                    fill="outline" 
                    onClick={() => {
                      setSearchQuery('');
                      setCurrentPage(1);
                      setSelectedCategory('all');
                    }}
                  >
                    Reset Filters
                  </IonButton>
                </div>
              )}
            </div>
            
            {/* Simplified categories - since you only have SVGs */}
            <div className="avatar-categories">
              <IonChip 
                className="avatar-category" 
                color={selectedCategory === 'all' ? 'primary' : undefined} 
                onClick={() => setSelectedCategory('all')}
              >
                All Avatars
              </IonChip>
            </div>
            
            {loadingAvatars ? (
              <div className="avatar-loading-container">
                <IonSpinner name="dots" />
                <p>Loading avatars...</p>
              </div>
            ) : (
              <>
                {availableAvatars.length === 0 ? (
                  <div className="no-avatars-found">
                    <p>No avatars available from server may be due to some errors</p>
                    <IonButton 
                      size="small" 
                      fill="outline" 
                      onClick={loadAvailableAvatars}
                    >
                      Retry Loading Avatars
                    </IonButton>
                  </div>
                ) : paginatedAvatars.length === 0 && searchQuery.trim() !== '' ? (
                  <div className="no-avatars-found">
                    <p>No avatars found matching "{searchQuery}"</p>
                    <IonButton 
                      size="small" 
                      fill="clear" 
                      onClick={() => setSearchQuery('')}
                    >
                      Clear Search
                    </IonButton>
                  </div>
                ) : paginatedAvatars.length === 0 ? (
                  <div className="no-avatars-found">
                    <p>No avatars to display. Try adjusting page settings.</p>
                    <IonButton 
                      size="small" 
                      fill="clear" 
                      onClick={() => setCurrentPage(1)}
                    >
                      Go to First Page
                    </IonButton>
                  </div>
                ) : (
                  <>
                    <div className="avatar-grid">
                      {paginatedAvatars.map(avatar => {
                        const safeUrl = getAvatarUrl(avatar.id);
                        const isSelected = selectedAvatar === avatar.id;
                        
                        return (
                          <div 
                            key={avatar.id} 
                            className={`avatar-option ${isSelected ? 'selected' : ''}`} 
                            onClick={() => handleSelectAvatar(avatar.id)}
                          >
                            <div className="avatar-image-container">
                              <img 
                                src={safeUrl} 
                                alt={avatar.name}
                                className="avatar-thumbnail svg-avatar"
                                onError={(e) => {
                                  console.log(`Avatar image failed to load: ${safeUrl}`);
                                  e.currentTarget.src = 'https://ionicframework.com/docs/img/demos/avatar.svg';
                                }} 
                              />
                            </div>
                            <div className="avatar-name">{avatar.name}</div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {totalPages > 1 && (
                      <div className="avatar-pagination">
                        <IonButton 
                          fill="clear" 
                          className="pagination-button"
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        >
                          <IonIcon slot="icon-only" icon={chevronBack} />
                        </IonButton>
                        
                        <span className="avatar-page-info">
                          {currentPage}/{totalPages} ({availableAvatars.length} total)
                        </span>
                        
                        <IonButton 
                          fill="clear" 
                          className="pagination-button"
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        >
                          <IonIcon slot="icon-only" icon={chevronForward} />
                        </IonButton>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
          
          <div className="avatar-modal-footer">
            <IonButton 
              fill="outline" 
              onClick={handleCloseAvatarModal}
            >
              Cancel
            </IonButton>
            
            <IonButton 
              onClick={handleSaveAvatar}
              disabled={!selectedAvatar || isLoading}
            >
              {isLoading ? <IonSpinner name="dots" /> : 'Apply Avatar'}
            </IonButton>
          </div>
          
          {/* Unsaved Changes Alert */}
          <IonAlert
            isOpen={showUnsavedAlert}
            onDidDismiss={() => setShowUnsavedAlert(false)}
            cssClass="unsaved-avatar-modal"
            header="Unsaved Changes"
            message="You have selected a new avatar but haven't applied it yet. Do you want to discard your selection?"
            buttons={[
              {
                text: 'Cancel',
                role: 'cancel',
                cssClass: 'secondary'
              },
              {
                text: 'Discard',
                handler: discardAvatarChanges,
                cssClass: 'danger'
              },
              {
                text: 'Apply Avatar',
                handler: handleSaveAvatar
              }
            ]}
          />
        </IonModal>

        {/* Profile Unsaved Changes Alert */}
        <IonAlert
          isOpen={showProfileUnsavedAlert}
          onDidDismiss={() => setShowProfileUnsavedAlert(false)}
          cssClass="unsaved-profile-modal"
          header="Unsaved Changes"
          message="You have made changes to your profile but haven't saved them. What would you like to do?"
          buttons={[
            {
              text: 'Continue Editing',
              role: 'cancel',
              cssClass: 'secondary'
            },
            {
              text: 'Discard Changes',
              handler: discardProfileChanges,
              cssClass: 'danger'
            },
            {
              text: 'Save Changes',
              handler: handleSaveProfile
            }
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default Profile;