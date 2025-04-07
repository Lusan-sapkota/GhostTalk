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
  ellipsisVertical
} from 'ionicons/icons';
import { useState, useEffect } from 'react';
import './Profile.css';
import BackHeaderComponent from '../components/BackHeaderComponent';

const Profile: React.FC = () => {
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
        showOptions={true}
        onOptionsClick={() => setIsEditing(!isEditing)}
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
          <h2 className="username">{username}</h2>
          <p className="user-id">ID: GHOST-92834</p>
          <IonChip color="primary" className="pro-badge">
            <IonLabel>Free User</IonLabel>
          </IonChip>
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
            </IonCardContent>
          </IonCard>

          <IonList className="ghost-shadow">
            <IonItemDivider>Settings</IonItemDivider>

            <IonItem>
              <IonIcon icon={shield} slot="start" color="primary" />
              <IonLabel>Privacy</IonLabel>
              <IonButtons slot="end">
                <IonButton routerLink="/privacy-settings">
                  Manage
                </IonButton>
              </IonButtons>
            </IonItem>

            <IonItem>
              <IonIcon icon={notifications} slot="start" color="primary" />
              <IonLabel>Notifications</IonLabel>
              <IonToggle checked={true} slot="end" />
            </IonItem>

            <IonItem button routerLink="/change-password">
              <IonIcon icon={key} slot="start" color="primary" />
              <IonLabel>Change Password</IonLabel>
            </IonItem>

            <IonItem button onClick={() => setShowLogoutAlert(true)}>
              <IonIcon icon={logOut} slot="start" color="danger" />
              <IonLabel color="danger">Logout</IonLabel>
            </IonItem>
          </IonList>

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
              <IonButton expand="block" color="warning">
                Go Pro
              </IonButton>
            </IonCardContent>
          </IonCard>
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