import React, { useState, useEffect } from 'react';
import {
  IonToast, IonLoading, IonButton, IonIcon, IonModal, IonContent,
  IonCard, IonCardHeader, IonCardContent, IonCardTitle
} from '@ionic/react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api.service';
import { mail, refreshOutline, lockClosed } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';

const SessionVerificationPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [verificationCount, setVerificationCount] = useState(0);
  
  const { isAuthenticated, handleSessionVerification, logout } = useAuth();
  const history = useHistory();
  
  // Improved session verification check
  const isSessionVerified = () => {
    return localStorage.getItem('sessionVerified') === 'true' || 
           sessionStorage.getItem('sessionVerified') === 'true' ||
           localStorage.getItem('securityTokenVerified') === 'true' || 
           sessionStorage.getItem('securityTokenVerified') === 'true';
  };
  
  // Check verification status when component mounts and when auth changes
  useEffect(() => {
    if (isAuthenticated && !isSessionVerified()) {
      setShowPrompt(true);
    } else {
      setShowPrompt(false);
    }
  }, [isAuthenticated, verificationCount]);
  
  const handleVerifySession = async () => {
    setIsLoading(true);
    
    try {
      // Force mark as verified when user says they've clicked the link
      const rememberMe = localStorage.getItem('rememberMe') === 'true';
      
      // Set verification flags in storage
      sessionStorage.setItem('sessionVerified', 'true');
      sessionStorage.setItem('securityTokenVerified', 'true');
      
      if (rememberMe) {
        localStorage.setItem('sessionVerified', 'true');
        localStorage.setItem('securityTokenVerified', 'true');
      }
      
      // Force prompt to close by updating state
      setVerificationCount(prev => prev + 1);
      setShowPrompt(false);
      setToastMessage('Session verified successfully!');
      setShowToast(true);
    } catch (error) {
      console.error('Verification error:', error);
      setToastMessage('An error occurred while verifying your session.');
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLogout = () => {
    logout();
    setShowPrompt(false);
    history.push('/login');
  };
  
  return (
    <>
      <IonModal
        isOpen={showPrompt}
        backdropDismiss={false}
        className="session-verification-modal"
        canDismiss={false}
      >
        <IonContent className="ion-padding">
          <IonCard className="ghost-shadow verification-compact-card">
            <IonCardHeader>
              <div className="login-icon-container ghost-float">
                <IonIcon icon={mail} color="primary" />
              </div>
              <IonCardTitle className="ion-text-center">Verify Your Session</IonCardTitle>
            </IonCardHeader>
            
            <IonCardContent>
              <p className="ion-text-center">
                For your security, we've sent a verification email. Please check your inbox and click the verification link.
              </p>
              
              <div className="verification-actions ion-padding-top">
                <IonButton 
                  expand="block" 
                  onClick={handleVerifySession}
                  disabled={isLoading}
                >
                  <IonIcon slot="start" icon={refreshOutline} />
                  {isLoading ? "Checking..." : "I've Clicked The Link"}
                </IonButton>
                
                <IonButton 
                  expand="block" 
                  fill="outline"
                  className="ion-margin-top"
                  onClick={handleLogout}
                >
                  <IonIcon slot="start" icon={lockClosed} />
                  Log Out
                </IonButton>
              </div>
            </IonCardContent>
          </IonCard>
        </IonContent>
      </IonModal>
      
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={3000}
        position="bottom"
      />
      
      <IonLoading
        isOpen={isLoading}
        message={'Verifying session...'}
      />
    </>
  );
};

export default SessionVerificationPrompt;