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
  const [verifying, setVerifying] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    verifyMagicLink();
  }, [token]);

  const verifyMagicLink = async () => {
    setVerifying(true);
    try {
      console.log("Verifying magic link token...");
      
      // Send token to backend for JWT validation
      const response = await apiService.verifyMagicLink(token);
      
      if (response.success) {
        console.log("Magic link verification successful!");
        // Store token and user info
        apiService.setToken(response.token);
        setCurrentUser(response.user);
        
        setSuccess(true);
        
        // Redirect to intended destination or home
        setTimeout(() => {
          const destination = (history.location.state as any)?.from?.pathname || '/home';
          history.replace(destination);
        }, 1500);
      } else {
        console.error("Magic link verification failed:", response.message);
        setError(response.message || 'Login failed. Please try again.');
        
        if (response.message && response.message.includes('expired')) {
          setToastMessage('Your magic link has expired. Please request a new one.');
          setShowToast(true);
        }
      }
    } catch (err) {
      console.error('Magic link verification error:', err);
      setError('An error occurred during login. The link might be invalid or expired.');
    } finally {
      setVerifying(false);
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