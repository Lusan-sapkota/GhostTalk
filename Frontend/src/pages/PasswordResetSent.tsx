import React, { useState } from 'react';
import {
  IonContent,
  IonPage,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon,
  IonButton,
  IonLoading
} from '@ionic/react';
import { mail, arrowBack, refreshOutline } from 'ionicons/icons';
import { useLocation, useHistory } from 'react-router-dom';
import { apiService } from '../services/api.service';
import BackHeaderComponent from '../components/BackHeaderComponent';

const PasswordResetSent: React.FC = () => {
  const location = useLocation<{ email: string }>();
  const email = location.state?.email || '';
  const history = useHistory();
  const [isResending, setIsResending] = useState(false);
  
  if (!email) {
    // Redirect back to login if accessed directly
    history.replace('/login');
    return null;
  }
  
  const handleResend = async () => {
    setIsResending(true);
    try {
      await apiService.forgotPassword(email);
      // No need for success message, just wait
      setTimeout(() => setIsResending(false), 2000);
    } catch (error) {
      console.error('Failed to resend password reset link:', error);
      setIsResending(false);
    }
  };
  
  return (
    <IonPage>
      <BackHeaderComponent title="Password Reset Email Sent" defaultHref="/login" />
      
      <IonContent className="ion-padding">
        <IonLoading isOpen={isResending} message="Sending password reset link..." />
        
        <IonCard className="ghost-shadow">
          <IonCardHeader className="ion-text-center">
            <div className="login-icon-container ghost-float">
              <IonIcon icon={mail} color="primary" />
            </div>
            <IonCardTitle>Check Your Email</IonCardTitle>
          </IonCardHeader>
          
          <IonCardContent className="ion-text-center">
            <p>
              We've sent a password reset link to <strong>{email}</strong>.
              Please check your inbox and click the link to reset your password.
            </p>
            <p className="ion-padding-top">
              The link will expire in 10 minutes for security reasons.
            </p>
            
            <div className="ion-padding-top">
              <IonButton 
                expand="block" 
                onClick={handleResend}
                disabled={isResending}
              >
                <IonIcon slot="start" icon={refreshOutline} />
                Resend Reset Link
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
      </IonContent>
    </IonPage>
  );
};

export default PasswordResetSent;