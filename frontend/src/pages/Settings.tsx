import React, { useContext } from 'react';
import { 
  IonPage, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent,
  IonItem,
  IonLabel,
  IonToggle,
  IonList,
  IonIcon,
  IonListHeader,
  IonCard,
  IonCardContent
} from '@ionic/react';
import { moon, notifications, shield, help, informationCircle, logOut } from 'ionicons/icons';
import { ThemeContext } from '../contexts/ThemeContext';

const Settings: React.FC = () => {
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  
  const handleLogout = () => {
    localStorage.removeItem('userSession');
    window.location.href = '/login';
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Settings</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonCard>
          <IonCardContent>
            <p>Customize your GhostTalk experience</p>
          </IonCardContent>
        </IonCard>
        
        <IonList>
          <IonListHeader>Appearance</IonListHeader>
          <IonItem>
            <IonIcon icon={moon} slot="start" />
            <IonLabel>Dark Mode</IonLabel>
            <IonToggle 
              checked={darkMode} 
              onIonChange={toggleDarkMode} 
              slot="end"
            />
          </IonItem>
          
          <IonListHeader>Notifications</IonListHeader>
          <IonItem detail={true}>
            <IonIcon icon={notifications} slot="start" />
            <IonLabel>Push Notifications</IonLabel>
          </IonItem>
          
          <IonListHeader>Privacy & Security</IonListHeader>
          <IonItem detail={true}>
            <IonIcon icon={shield} slot="start" />
            <IonLabel>Privacy Settings</IonLabel>
          </IonItem>
          
          <IonListHeader>Support</IonListHeader>
          <IonItem detail={true}>
            <IonIcon icon={help} slot="start" />
            <IonLabel>Help Center</IonLabel>
          </IonItem>
          <IonItem detail={true}>
            <IonIcon icon={informationCircle} slot="start" />
            <IonLabel>About GhostTalk</IonLabel>
          </IonItem>
        </IonList>
        
        <IonItem button onClick={handleLogout} color="danger" className="logout-button">
          <IonIcon icon={logOut} slot="start" />
          <IonLabel>Logout</IonLabel>
        </IonItem>
      </IonContent>
    </IonPage>
  );
};

export default Settings;