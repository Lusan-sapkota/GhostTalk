import React, { useState } from 'react';
import { IonContent, IonPage, IonCard, IonCardHeader, IonCardTitle, IonCardContent, 
         IonButton, IonIcon, IonToast, IonSpinner } from '@ionic/react';
import { mailOutline, refreshOutline, arrowBack } from 'ionicons/icons';
import { apiService } from '../services/api.service';
import BackHeaderComponent from '../components/BackHeaderComponent';
import { useRateLimit } from '../hooks/useRateLimit';

interface VerificationNeededProps {
  email?: string;
}

const VerificationNeeded: React.FC<VerificationNeededProps> = ({ email = '' }) => {
  const [isResending, setIsResending] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const { canPerformAction, triggerAction, countdown } = useRateLimit(60);
  
  const handleResendEmail = async () => {
    if (!email) {
      setToastMessage('No email address provided');
      setShowToast(true);
      return;
    }
    
    // Add rate limiting
    if (!canPerformAction()) {
      setToastMessage(`Please wait ${countdown} seconds before requesting another email`);
      setShowToast(true);
      return;
    }
    
    setIsResending(true);
    try {
      const response = await apiService.resendVerification(email);
      
      if (response.success) {
        triggerAction(); // Start the cooldown
        setToastMessage('Verification email sent successfully!');
      } else {
        setToastMessage(response.message || 'Failed to send verification email');
      }
    } catch (error) {
      console.error('Failed to resend verification:', error);
      setToastMessage('An error occurred when sending verification email');
    } finally {
      setIsResending(false);
      setShowToast(true);
    }
  };

  return (
    <IonPage>
      <BackHeaderComponent title="Email Verification Required" defaultHref="/login" />
      
      <IonContent className="ion-padding">
        <IonCard className="ghost-shadow">
          <IonCardHeader className="ion-text-center">
            <div className="verification-icon ghost-float">
              <IonIcon icon={mailOutline} color="warning" style={{ fontSize: '64px' }} />
            </div>
            <IonCardTitle>Verification Required</IonCardTitle>
          </IonCardHeader>
          <IonCardContent className="ion-text-center">
            <p>
              You need to verify your email address before logging in.
              {email && <><br/><strong>{email}</strong></>}
            </p>
            
            <div className="ion-margin-top">
              <IonButton 
                expand="block"
                onClick={handleResendEmail}
                disabled={isResending || !canPerformAction()}
                className="ghost-shadow"
              >
                {isResending ? (
                  <IonSpinner name="dots" />
                ) : !canPerformAction() ? (
                  `Resend Email (${countdown}s)`
                ) : (
                  <>
                    <IonIcon slot="start" icon={refreshOutline} />
                    Resend Verification Email
                  </>
                )}
              </IonButton>
              
              <IonButton
                expand="block"
                fill="outline"
                routerLink="/login"
                className="ion-margin-top"
              >
                <IonIcon slot="start" icon={arrowBack} />
                Back to Login
              </IonButton>
            </div>
          </IonCardContent>
        </IonCard>
        
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          position="bottom"
        />
      </IonContent>
    </IonPage>
  );
};

export default VerificationNeeded;