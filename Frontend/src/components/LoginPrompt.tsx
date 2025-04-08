import {
  IonButton,
  IonContent,
  IonIcon,
  IonModal,
  IonRippleEffect,
} from '@ionic/react';
import { logIn, personAdd, arrowBack, keyOutline } from 'ionicons/icons';
import './LoginPrompt.css';
import BackHeaderComponent from './BackHeaderComponent';

interface LoginPromptProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
  onExplorePublic?: () => void;
}

const LoginPrompt: React.FC<LoginPromptProps> = ({ isOpen, onClose, message, onExplorePublic }) => {
  return (
    <IonModal 
      isOpen={isOpen} 
      onDidDismiss={onClose} 
      backdropDismiss={false} 
      className="ghost-login-modal auth-modal"
    >
      <BackHeaderComponent
        title="Authentication Required"
        onBack={onClose}
        isModal={true}
      />
      <IonContent className="ion-padding">
        <div className="login-prompt-container">
          <div className="login-prompt-blob"></div>
          
          <div className="login-prompt-icon-container">
            <div className="login-prompt-icon-outer">
              <div className="login-prompt-icon">
                <IonIcon icon={keyOutline} />
              </div>
            </div>
          </div>
          
          <h2 className="login-prompt-title">Sign In Required</h2>
          
          <p className="login-prompt-message">
            {message || "You need to be logged in to access this feature."}
          </p>
          
          <div className="login-prompt-buttons">
            <IonButton routerLink="/login" expand="block" className="login-btn ion-activatable">
              <IonRippleEffect></IonRippleEffect>
              <IonIcon slot="start" icon={logIn} />
              Login
            </IonButton>
            
            <IonButton routerLink="/register" expand="block" fill="outline" className="register-btn ion-activatable">
              <IonRippleEffect></IonRippleEffect>
              <IonIcon slot="start" icon={personAdd} />
              Register
            </IonButton>
            
            {onExplorePublic && (
              <div className="explore-container">
                <div className="separator">
                  <span>OR</span>
                </div>
                
                <IonButton 
                  expand="block" 
                  fill="clear" 
                  onClick={() => {
                    onClose();
                    onExplorePublic();
                  }} 
                  className="explore-btn ion-activatable"
                >
                  <IonRippleEffect></IonRippleEffect>
                  <IonIcon slot="start" icon={arrowBack} />
                  Explore Public Rooms
                </IonButton>
              </div>
            )}
          </div>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default LoginPrompt;