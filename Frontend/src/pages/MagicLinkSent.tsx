import React from 'react';
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
import { useState } from 'react';
import { apiService } from '../services/api.service';
import BackHeaderComponent from '../components/BackHeaderComponent';

const MagicLinkSent: React.FC = () => {
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
      await apiService.sendMagicLink(email);
      // No need for success message, just wait
      setTimeout(() => setIsResending(false), 2000);
    } catch (error) {
      console.error('Failed to resend magic link:', error);
      setIsResending(false);
    }
  };
  
  return (
    <IonPage>
      <BackHeaderComponent title="Magic Link Sent" defaultHref="/login" />
      
      <IonContent className="ion-padding">
        <IonLoading isOpen={isResending} message="Sending magic link..." />
        
        <IonCard className="ghost-shadow">
          <IonCardHeader className="ion-text-center">
            <div className="login-icon-container ghost-float">
              <IonIcon icon={mail} color="primary" />
            </div>
            <IonCardTitle>Check Your Email</IonCardTitle>
          </IonCardHeader>
          
          <IonCardContent className="ion-text-center">
            <p>
              We've sent a magic login link to <strong>{email}</strong>.
              Please check your inbox and click the link to sign in.
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
                Resend Magic Link
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

export default MagicLinkSent;