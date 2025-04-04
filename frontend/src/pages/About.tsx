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
  IonCardContent,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonBadge
} from '@ionic/react';
import { 
  informationCircle, 
  lockClosed, 
  heart, 
  globe, 
  bookmarks,
  mail,
  logoGithub,
  logoTwitter,
  ellipsisVertical
} from 'ionicons/icons';
import { useState } from 'react';
import './About.css';
import { themeService } from '../services/ThemeService';

const About: React.FC = () => {
  const [darkMode, setDarkMode] = useState(themeService.getDarkMode());

  const handleToggleTheme = () => {
    const isDark = themeService.toggleTheme();
    setDarkMode(isDark);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>About GhostTalk</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleToggleTheme}>
              <IonIcon slot="icon-only" icon={ellipsisVertical} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <div className="about-content">
          <div className="app-logo">
            <img src="assets/icon/icon.png" alt="GhostTalk Logo" />
            <h1>GhostTalk</h1>
            <IonBadge color="primary">v1.0.0</IonBadge>
          </div>

          <IonCard>
            <IonCardContent>
              <p className="app-description">
                GhostTalk is an anonymous chat platform that lets you connect with strangers around the world,
                join topic-based chat rooms, or chat privately with friends using secure IDs.
              </p>
            </IonCardContent>
          </IonCard>

          <IonCard>
            <IonListHeader>
              <IonIcon icon={informationCircle} color="primary" />
              <h2>Key Features</h2>
            </IonListHeader>
            <IonList lines="none">
              <IonItem>
                <IonIcon icon={globe} slot="start" color="primary" />
                <IonLabel>Random Anonymous Chats</IonLabel>
              </IonItem>
              <IonItem>
                <IonIcon icon={bookmarks} slot="start" color="primary" />
                <IonLabel>Topic-Based Chat Rooms</IonLabel>
              </IonItem>
              <IonItem>
                <IonIcon icon={lockClosed} slot="start" color="primary" />
                <IonLabel>Secure Private Messaging</IonLabel>
              </IonItem>
              <IonItem>
                <IonIcon icon={heart} slot="start" color="primary" />
                <IonLabel>Lightweight & Fast Experience</IonLabel>
              </IonItem>
            </IonList>
          </IonCard>

          <IonCard>
            <IonListHeader>
              <h2>Privacy Policy</h2>
            </IonListHeader>
            <IonCardContent>
              <p>
                GhostTalk respects your privacy and is committed to protecting your personal data.
                We collect minimal information necessary for the app to function.
              </p>
              <IonButton expand="block" fill="outline" className="privacy-button">
                Read Full Privacy Policy
              </IonButton>
            </IonCardContent>
          </IonCard>

          <IonCard>
            <IonListHeader>
              <h2>Contact Us</h2>
            </IonListHeader>
            <IonList lines="none">
              <IonItem href="mailto:support@ghosttalk.com">
                <IonIcon icon={mail} slot="start" color="primary" />
                <IonLabel>support@ghosttalk.com</IonLabel>
              </IonItem>
              <IonItem href="https://github.com/ghosttalk" target="_blank">
                <IonIcon icon={logoGithub} slot="start" color="primary" />
                <IonLabel>GitHub</IonLabel>
              </IonItem>
              <IonItem href="https://twitter.com/ghosttalk" target="_blank">
                <IonIcon icon={logoTwitter} slot="start" color="primary" />
                <IonLabel>Twitter</IonLabel>
              </IonItem>
            </IonList>
          </IonCard>

          <div className="app-footer">
            <p>© 2023 GhostTalk App. All rights reserved.</p>
            <p>Made with <IonIcon icon={heart} color="danger" /> by the GhostTalk Team</p>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default About;