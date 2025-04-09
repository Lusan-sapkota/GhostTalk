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
  IonCard,
  IonCardHeader,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonToggle,
  IonAvatar,
  IonChip,
  IonList,
  IonItemDivider,
  IonAlert
} from '@ionic/react';
import { 
  person, 
  camera, 
  settings, 
  shield, 
  notifications,
  colorPalette,
  moon,
  key,
  logOut,
  qrCode,
  ellipsisVertical,
  calendar,
  chevronForward,
  shieldOutline,
  documentTextOutline,
  create,
  checkmarkOutline,
  settingsOutline,
  optionsOutline
} from 'ionicons/icons';
import { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import './Profile.css';
import BackHeaderComponent from '../components/BackHeaderComponent';

const Profile: React.FC = () => {
  const history = useHistory();
  const [username, setUsername] = useState('GhostUser123');
  const [email, setEmail] = useState('user@example.com');
  const [bio, setBio] = useState('Just a friendly ghost in the digital world.');
  const [isEditing, setIsEditing] = useState(false);
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);

  const handleSaveProfile = () => {
    setIsEditing(false);
    // In a real app, save to backend
  };
  
  const handleLogout = () => {
    // Implement logout logic here
    console.log('Logging out...');
    // Redirect to login page
  };

  return (
    <IonPage className="ghost-appear">
      <BackHeaderComponent 
        title="Profile" 
      />
      
      <IonContent fullscreen>
        <div className="profile-header">
          <div className="avatar-upload">
            <IonAvatar className="profile-avatar">
              <img src="https://ionicframework.com/docs/img/demos/avatar.svg" alt="Profile" />
            </IonAvatar>
            {isEditing && (
              <div className="avatar-upload-overlay">
                <IonIcon icon={camera} />
              </div>
            )}
          </div>
          
          <div className="profile-info-container">
            <h2 className="username">{username}</h2>
            <p className="user-id">
              <IonIcon icon={qrCode} />
              GHOST-92834
            </p>
            <IonChip color="primary" className="pro-badge">
              <IonLabel>Free User</IonLabel>
            </IonChip>
            
            <div className="profile-meta">
              <div className="profile-meta-item profile-meta-gender">
                <IonIcon icon={person} />
                Male
              </div>
              <div className="profile-meta-item profile-meta-since">
                <IonIcon icon={calendar} />
                Member since Nov 2023
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
                  disabled
                />
              </IonItem>
              
              <IonItem>
                <IonLabel position="stacked">Email</IonLabel>
                <IonInput 
                  type="email" 
                  value={email} 
                  onIonChange={e => setEmail(e.detail.value!)} 
                  disabled
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

              {!isEditing && (
                <IonButton 
                  expand="block" 
                  className="profile-action-btn edit-btn"
                  onClick={() => setIsEditing(true)}
                >
                  <IonIcon slot="start" icon={create} />
                  Enable Editing
                </IonButton>
              )}
              
              {isEditing && (
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
      </IonContent>
    </IonPage>
  );
};

export default Profile;