import {
  IonContent,
  IonPage,
  IonCard,
  IonCardHeader,
  IonCardContent,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonList,
  IonAvatar,
  IonChip,
  IonText,
  IonFab,
  IonFabButton,
  IonTextarea,
  IonFooter
} from '@ionic/react';
import { 
  chatbubbles, 
  send, 
  pulse, 
  personCircleOutline, 
  refresh
} from 'ionicons/icons';
import { useState, useEffect } from 'react';
import './RandomChat.css';
import { themeService } from '../services/ThemeService';
import HeaderComponent from '../components/HeaderComponent';

const RandomChat: React.FC = () => {

  const [darkMode, setDarkMode] = useState(themeService.getDarkMode());
  
  return (
    <IonPage>
      <HeaderComponent 
        title="Random Chat" 
        showSearch={false}
      />
      
      <IonContent fullscreen>
          <div className="start-container">
            <IonCard>
              <IonCardHeader>
                <div className="random-icon">
                  <IonIcon icon={pulse} color="primary" />
                </div>
                <h1 className="random-title">Talk to Random Strangers</h1>
              </IonCardHeader>
              <IonCardContent>
                <p className="description">
                  Connect instantly with random people from around the world. 
                  All chats are anonymous and encrypted.
                </p>
                <div className="stats-container">
                  <div className="stat-item">
                    <h3>1,324</h3>
                    <p>Online Now</p>
                  </div>
                  <div className="stat-item">
                    <h3>5M+</h3>
                    <p>Users</p>
                  </div>
                  <div className="stat-item">
                    <h3>100%</h3>
                    <p>Anonymous</p>
                  </div>
                </div>
                <IonButton expand="block" className="ghost-shadow">
                  <IonIcon slot="start" icon={chatbubbles} />
                  Start Random Chat
                </IonButton>
              </IonCardContent>
            </IonCard>
          </div>
      </IonContent>

    </IonPage>
  );
};

export default RandomChat;