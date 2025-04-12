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
  IonModal
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
  downloadOutline
} from 'ionicons/icons';
import { useState, useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import './Profile.css';
import BackHeaderComponent from '../components/BackHeaderComponent';
import { userService, ProfileUpdateData } from '../services/userService';
import { useAuth } from '../contexts/AuthContext';

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

  useEffect(() => {
    loadUserProfile();
  }, []);

  const formatMemberSince = (timestamp: number): string => {
    if (!timestamp) return 'Unknown';
    
    try {
      const date = new Date(timestamp * 1000);
      return `Member since ${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown join date';
    }
  };

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      const response = await userService.getProfile();
      
      if (response.success) {
        const user = response.user;
        setUsername(user.name || 'GhostUser');
        setEmail(user.email || '');
        setBio(user.bio || 'Just a friendly ghost in the digital world.');
        setUserId(user.id || '');
        setIsOnline(user.isOnline || false);
        setProStatus(user.proStatus || 'free');
        setGender(user.gender || 'prefer_not_to_say');
        
        // Format registration date correctly
        if (user.registration) {
          setMemberSince(formatMemberSince(user.registration));
        }
        
        // Set avatar if available from the backend
        if (user.avatar) {
          // If avatar is a full URL
          if (user.avatar.startsWith('http')) {
            setAvatar(user.avatar);
          } else {
            // If it's a path or ID that needs to be constructed with the API URL
            const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            setAvatar(`${apiBaseUrl}/user/avatar/${user.avatar}`);
          }
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
    if (!userId) return;
    
    setIsGeneratingQR(true);
    try {
      const response = await userService.generateQRCode(userId);
      if (response.success) {
        setQrCodeUrl(response.qrCodeUrl || '');
        setShowQRModal(true);
      } else {
        setToastMessage('Failed to generate QR code');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      setToastMessage('Failed to generate QR code');
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
      setShowPhotoOptions(true);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // TODO: Implement file upload logic with your backend
      // For now, we'll just create a local URL for preview
      const localUrl = URL.createObjectURL(file);
      setAvatar(localUrl);
      setShowPhotoOptions(false);
      
      // Here you would upload the file to your backend
      // and update the avatar URL accordingly
    }
  };

  const handleTakePicture = () => {
    // This would be implemented for mobile with Capacitor Camera API
    setShowPhotoOptions(false);
  };

  return (
    <IonPage className="ghost-appear">
      <BackHeaderComponent title="Profile" />
      
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
                  <img src={avatar} alt="Profile" />
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
                <IonChip 
                  color={proStatus !== 'free' ? "success" : "primary"} 
                  className="pro-badge"
                >
                  <IonLabel>
                    {proStatus === 'free' ? 'Free User' : 
                     proStatus === 'monthly' ? 'Pro Monthly' : 'Pro Yearly'}
                  </IonLabel>
                </IonChip>
                
                <div className="profile-meta">
                  <div className="profile-meta-item profile-meta-gender">
                    <IonIcon icon={person} />
                    {gender === 'male' ? 'Male' : 
                     gender === 'female' ? 'Female' : 
                     gender === 'other' ? 'Other' : 'Prefer not to say'}
                  </div>
                  <div className="profile-meta-item profile-meta-since">
                    <IonIcon icon={calendar} />
                    {memberSince}
                  </div>
                </div>
              </div>
            </div>

            <div className="profile-settings-link" onClick={() => history.replace('/settings')} style={{ cursor: 'pointer' }}>
              <div className="profile-settings-link-text">
                <h4>Privacy & Settings</h4>
                <p>Manage your privacy, notifications and account settings</p>
              </div>
              <IonIcon icon={chevronForward} />
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
                      disabled={!isEditing}
                    />
                  </IonItem>
                  
                  <IonItem>
                    <IonLabel position="stacked">Email</IonLabel>
                    <IonInput 
                      type="email" 
                      value={email} 
                      onIonChange={e => setEmail(e.detail.value!)} 
                      disabled={!isEditing}
                    />
                  </IonItem>
                  
                  <IonItem>
                    <IonLabel position="stacked">Bio</IonLabel>
                    <IonInput 
                      value={bio} 
                      onIonChange={e => setBio(e.detail.value!)} 
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
                      onIonChange={handleOnlineStatusChange}
                    />
                  </IonItem>

                  {!isEditing ? (
                    <IonButton 
                      expand="block" 
                      className="profile-action-btn edit-btn"
                      onClick={() => setIsEditing(true)}
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

              <IonCard className="upgrade-card ghost-shadow">
                <IonCardHeader>
                  <h3>Upgrade to GhostTalk Pro</h3>
                </IonCardHeader>
                <IonCardContent>
                  <p>Get premium features and enhance your experience.</p>
                  <ul>
                    <li>Ad-free experience</li>
                    <li>Priority matching</li>
                    <li>Exclusive chat themes</li>
                    <li>Extended chat history</li>
                  </ul>
                  <IonButton expand="block" color="primary" className="pro-upgrade-btn">
                    Go Pro
                  </IonButton>
                </IonCardContent>
              </IonCard>
            </div>

            <IonToast
              isOpen={showToast}
              onDidDismiss={() => setShowToast(false)}
              message={toastMessage}
              duration={2000}
              position="bottom"
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
              icon: 'images-outline',
              handler: () => fileInputRef.current?.click()
            },
            {
              text: 'Cancel',
              role: 'cancel'
            }
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default Profile;