import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonModal,
  IonTitle,
  IonToolbar
} from '@ionic/react';
import { logIn, personAdd } from 'ionicons/icons';
import './LoginPrompt.css';

interface LoginPromptProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

const LoginPrompt: React.FC<LoginPromptProps> = ({ isOpen, onClose, message }) => {
  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Login Required</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="login-prompt-container ghost-appear">
          <div className="login-prompt-icon ghost-float">
            <IonIcon icon={logIn} color="primary" />
          </div>
          
          <h2>Authentication Required</h2>
          
          <p className="login-prompt-message">
            {message || "You need to be logged in to access this feature."}
          </p>
          
          <div className="login-prompt-buttons">
            <IonButton routerLink="/login" expand="block" className="ghost-shadow">
              <IonIcon slot="start" icon={logIn} />
              Login
            </IonButton>
            
            <IonButton routerLink="/register" expand="block" fill="outline" className="ghost-shadow">
              <IonIcon slot="start" icon={personAdd} />
              Register
            </IonButton>
          </div>
          
        </div>
      </IonContent>
    </IonModal>
  );
};

export default LoginPrompt;