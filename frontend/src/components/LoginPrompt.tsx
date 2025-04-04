import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonText
} from '@ionic/react';
import { lockClosed, personAdd, logIn } from 'ionicons/icons';
import './LoginPrompt.css';

interface LoginPromptProps {
  isOpen: boolean;
  message?: string;
  onDismiss: () => void;
  onLogin: () => void;
  onRegister: () => void;
}

const LoginPrompt: React.FC<LoginPromptProps> = ({ 
  isOpen, 
  message = "Please log in to access this feature", 
  onDismiss, 
  onLogin, 
  onRegister 
}) => {
  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDismiss} className="login-prompt-modal">
      <div className="login-prompt-container">
        <div className="login-prompt-icon">
          <IonIcon icon={lockClosed} />
        </div>
        
        <h2>Authentication Required</h2>
        
        <IonText color="medium">
          <p>{message}</p>
        </IonText>
        
        <IonGrid>
          <IonRow>
            <IonCol>
              <IonButton expand="block" onClick={onLogin}>
                <IonIcon slot="start" icon={logIn} />
                Log In
              </IonButton>
            </IonCol>
            <IonCol>
              <IonButton expand="block" fill="outline" onClick={onRegister}>
                <IonIcon slot="start" icon={personAdd} />
                Register
              </IonButton>
            </IonCol>
          </IonRow>
        </IonGrid>
        
        <div className="login-prompt-secondary">
          <IonButton fill="clear" size="small" onClick={onDismiss}>
            Continue as Guest
          </IonButton>
        </div>
      </div>
    </IonModal>
  );
};

export default LoginPrompt;