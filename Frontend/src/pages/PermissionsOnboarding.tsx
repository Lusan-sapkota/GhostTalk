import React, { useState } from 'react';
import {
  IonPage,
  IonContent,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonProgressBar
} from '@ionic/react';
import { 
  micOutline, 
  cameraOutline, 
  notifications, 
  folderOutline,
  checkmarkCircle,
  arrowForward 
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { usePermission } from '../hooks/usePermission';
import './PermissionsOnboarding.css';

const PermissionsOnboarding: React.FC = () => {
  const history = useHistory();
  const { permissions, requestPermissions } = usePermission();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const handleRequestPermissions = async () => {
    await requestPermissions();
    setCurrentStep(currentStep + 1);
  };

  const handleFinish = () => {
    localStorage.setItem('permissionsRequested', 'true');
    history.replace('/home');
  };

  return (
    <IonPage className="permissions-page">
      <IonContent fullscreen>
        <div className="permissions-container">
          <IonProgressBar 
            value={currentStep / totalSteps} 
            className="permissions-progress"
          />
          
          <h1>App Permissions</h1>
          <p className="permissions-intro">
            GhostTalk needs a few permissions to provide you with the best experience.
          </p>
          
          {currentStep === 1 && (
            <IonCard className="permission-card">
              <IonCardHeader>
                <div className="permission-icon">
                  <IonIcon icon={cameraOutline} />
                </div>
                <IonCardTitle>Camera</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <p>We need camera access so you can scan QR codes to find friends and take profile pictures.</p>
                <IonButton expand="block" onClick={handleRequestPermissions}>
                  Grant Camera Access
                </IonButton>
              </IonCardContent>
            </IonCard>
          )}
          
          {currentStep === 2 && (
            <IonCard className="permission-card">
              <IonCardHeader>
                <div className="permission-icon">
                  <IonIcon icon={micOutline} />
                </div>
                <IonCardTitle>Microphone</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <p>Microphone access is needed for voice messages in your chats.</p>
                <IonButton expand="block" onClick={handleRequestPermissions}>
                  Grant Microphone Access
                </IonButton>
              </IonCardContent>
            </IonCard>
          )}
          
          {currentStep === 3 && (
            <IonCard className="permission-card">
              <IonCardHeader>
                <div className="permission-icon">
                  <IonIcon icon={notifications} />
                </div>
                <IonCardTitle>Notifications</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <p>Get notified about new messages and friend requests.</p>
                <IonButton expand="block" onClick={() => setCurrentStep(currentStep + 1)}>
                  Enable Notifications
                </IonButton>
              </IonCardContent>
            </IonCard>
          )}
          
          {currentStep === 4 && (
            <IonCard className="permission-card">
              <IonCardHeader>
                <div className="permission-icon">
                  <IonIcon icon={checkmarkCircle} />
                </div>
                <IonCardTitle>You're All Set!</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <p>Thank you for setting up GhostTalk. You can always change permissions later in your device settings.</p>
                <IonButton expand="block" onClick={handleFinish}>
                  Get Started
                  <IonIcon slot="end" icon={arrowForward} />
                </IonButton>
              </IonCardContent>
            </IonCard>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default PermissionsOnboarding;