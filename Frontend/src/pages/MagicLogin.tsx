import React, { useEffect, useState } from 'react';
import {
  IonContent,
  IonPage,
  IonCard,
  IonCardContent,
  IonLoading,
  IonButton,
  IonIcon,
  IonText
} from '@ionic/react';
import { checkmarkCircle, alertCircle, arrowBack } from 'ionicons/icons';
import { useParams, useHistory } from 'react-router-dom';
import { apiService } from '../services/api.service';
import { useAuth } from '../contexts/AuthContext';

interface MagicLoginParams {
  token: string;
}

const MagicLogin: React.FC = () => {
  const { token } = useParams<MagicLoginParams>();
  const [isLoading, setIsLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const history = useHistory();
  const { setCurrentUser } = useAuth();

  useEffect(() => {
    verifyMagicLink();
  }, [token]);

  const verifyMagicLink = async () => {
    try {
      const response = await apiService.verifyMagicLink(token);
      
      if (response.success) {
        setSuccess(true);
        
        // Set the current user in auth context if user info was returned
        if (response.user) {
          setCurrentUser(response.user);
        }
        
        // Redirect to home or requested page after short delay
        setTimeout(() => {
          const redirectTo = sessionStorage.getItem('redirectAfterLogin') || '/home';
          sessionStorage.removeItem('redirectAfterLogin');
          history.replace(redirectTo);
        }, 1500);
      } else {
        setError(response.message || 'Invalid or expired magic link');
      }
    } catch (error) {
      console.error('Magic link verification error:', error);
      setError('An error occurred while verifying your magic link');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <IonLoading isOpen={isLoading} message="Verifying magic link..." />
        
        {!isLoading && (
          <IonCard className="ghost-shadow">
            <IonCardContent className="ion-text-center ion-padding">
              {success ? (
                <>
                  <div className="verification-icon ghost-float">
                    <IonIcon icon={checkmarkCircle} color="success" style={{ fontSize: '80px' }} />
                  </div>
                  <h2>Login Successful!</h2>
                  <p>You are being automatically redirected...</p>
                </>
              ) : (
                <>
                  <div className="verification-icon">
                    <IonIcon icon={alertCircle} color="danger" style={{ fontSize: '80px' }} />
                  </div>
                  <h2>Login Failed</h2>
                  <IonText color="medium">
                    <p>{error || 'Your magic link is invalid or has expired'}</p>
                    <p>Magic links are valid for 10 minutes for security reasons.</p>
                  </IonText>
                  <div className="ion-padding-top">
                    <IonButton expand="block" routerLink="/login">
                      <IonIcon slot="start" icon={arrowBack} />
                      Back to Login
                    </IonButton>
                  </div>
                </>
              )}
            </IonCardContent>
          </IonCard>
        )}
      </IonContent>
    </IonPage>
  );
};

export default MagicLogin;