import {
  IonContent,
  IonPage,
  IonCard,
  IonCardContent,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonBadge,
  IonIcon,
  IonButton
} from '@ionic/react';
import { 
  informationCircle, 
  lockClosed, 
  heart, 
  globe, 
  bookmarks,
  mail,
  logoGithub,
  logoTwitter
} from 'ionicons/icons';
import './About.css';
import BackHeaderComponent from '../components/BackHeaderComponent';
// import RoamingGhost from '../components/RoamingGhost';

const About: React.FC = () => {
  return (
    <IonPage className="ghost-appear">
      <BackHeaderComponent title="About GhostTalk" />
      
      <IonContent fullscreen id="about-content">
        {/* <RoamingGhost 
          pageId="about" 
          containerId="about-content"
          zIndex={500}
        /> */}
        
        <div className="about-content">
          <div className="app-logo">
            <img src="assets/icon/icon.png" alt="GhostTalk Logo" />
            <h1>GhostTalk</h1>
            <IonBadge color="primary">v1.0.0</IonBadge>
          </div>

          <IonCard className="ghost-shadow">
            <IonCardContent>
              <p className="app-description">
                GhostTalk is an anonymous chat platform that lets you connect with strangers around the world,
                join topic-based chat rooms, or chat privately with friends using secure IDs.
              </p>
            </IonCardContent>
          </IonCard>

          <IonCard className="ghost-shadow">
            <IonListHeader>
              <IonIcon icon={informationCircle} color="primary" />
              <h2>Key Features</h2>
            </IonListHeader>
            <IonList lines="none">
              <IonItem className="staggered-item">
                <IonIcon icon={globe} slot="start" color="primary" />
                <IonLabel>Random Anonymous Chats</IonLabel>
              </IonItem>
              <IonItem className="staggered-item">
                <IonIcon icon={bookmarks} slot="start" color="primary" />
                <IonLabel>Topic-Based Chat Rooms</IonLabel>
              </IonItem>
              <IonItem className="staggered-item">
                <IonIcon icon={lockClosed} slot="start" color="primary" />
                <IonLabel>Secure Private Messaging</IonLabel>
              </IonItem>
              <IonItem className="staggered-item">
                <IonIcon icon={heart} slot="start" color="primary" />
                <IonLabel>Lightweight & Fast Experience</IonLabel>
              </IonItem>
            </IonList>
          </IonCard>

          <IonCard className="ghost-shadow">
            <IonListHeader>
              <h2>Privacy Policy</h2>
            </IonListHeader>
            <IonCardContent>
              <p>
                GhostTalk respects your privacy and is committed to protecting your personal data.
                We collect minimal information necessary for the app to function.
              </p>
              <IonButton expand="block" fill="outline" routerLink="/privacy" className="privacy-button">
                Read Full Privacy Policy
              </IonButton>
            </IonCardContent>
          </IonCard>

          <IonCard className="ghost-shadow">
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
            <p>© {new Date().getFullYear()} GhostTalk App. All rights reserved.</p>
            <p>Made with <IonIcon icon={heart} color="danger" /> by the GhostTalk Team</p>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default About;