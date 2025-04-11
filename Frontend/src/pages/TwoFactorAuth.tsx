import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonPage,
  IonInput,
  IonButton,
  IonSpinner,
  IonIcon,
  IonToast,
  IonText,
  IonCard,
  IonCardContent,
  IonLabel
} from '@ionic/react';
import { useHistory, useParams } from 'react-router-dom';
import { lockClosed, mail, arrowForward } from 'ionicons/icons';
import { apiService } from '../services/api.service';
import { useAuth } from '../contexts/AuthContext';
import './TwoFactorAuth.css';

interface TwoFactorAuthParams {
  userId: string;
}

const TwoFactorAuth: React.FC = () => {
  const { userId } = useParams<TwoFactorAuthParams>();
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const history = useHistory();
  const { login } = useAuth();

  // Format the code as it's entered (e.g., add spaces)
  const formatCode = (input: string) => {
    // Remove any non-digit characters
    const digitsOnly = input.replace(/\D/g, '');
    // Limit to 6 digits
    const truncated = digitsOnly.substring(0, 6);
    setCode(truncated);
  };

  const handleVerify = async () => {
    if (code.length !== 6) {
      setToastMessage('Please enter a 6-digit code');
      setShowToast(true);
      return;
    }

    try {
      setIsLoading(true);
      const response = await apiService.verify2FA(userId, code);
      
      if (response.success) {
        // Login successful with 2FA
        login(response.token, response.user);
        history.replace('/home');
      } else {
        setToastMessage(response.message || 'Verification failed');
        setShowToast(true);
      }
    } catch (error) {
      console.error('2FA verification failed:', error);
      setToastMessage('An error occurred during verification');
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.resend2FACode(userId);
      
      if (response.success) {
        setToastMessage('Verification code resent');
        setShowToast(true);
      } else {
        setToastMessage(response.message || 'Failed to resend code');
        setShowToast(true);
      }
    } catch (error) {
      setToastMessage('An error occurred when resending the code');
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Fetch masked email for display
    const getEmailInfo = async () => {
      try {
        const response = await apiService.getUserInfo(userId);
        if (response.success) {
          setEmail(response.email);
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    };
    
    if (userId) {
      getEmailInfo();
    }
  }, [userId]);

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <div className="two-factor-container">
          <IonCard className="ghost-shadow">
            <IonCardContent>
              <div className="verification-icon ghost-float">
                <IonIcon icon={lockClosed} color="primary" style={{ fontSize: '64px' }} />
              </div>

              <h1 className="ion-text-center">Two-Factor Authentication</h1>
              
              {email && (
                <p className="ion-text-center">
                  We've sent a verification code to {email}
                </p>
              )}

              <div className="code-input-container">
                <IonLabel position="stacked">Enter 6-digit code</IonLabel>
                <IonInput
                  type="tel"
                  value={code}
                  onIonChange={e => formatCode(e.detail.value || '')}
                  maxlength={6}
                  className="code-input"
                  inputmode="numeric"
                  placeholder="000000"
                />
              </div>

              <IonButton 
                expand="block"
                onClick={handleVerify}
                disabled={isLoading || code.length !== 6}
                className="ghost-shadow"
              >
                {isLoading ? (
                  <IonSpinner name="dots" />
                ) : (
                  <>
                    <IonIcon slot="start" icon={arrowForward} />
                    Verify Code
                  </>
                )}
              </IonButton>

              <div className="resend-link">
                <IonButton 
                  fill="clear" 
                  size="small"
                  onClick={handleResendCode}
                  disabled={isLoading}
                >
                  <IonIcon slot="start" icon={mail} />
                  Resend Code
                </IonButton>
              </div>
            </IonCardContent>
          </IonCard>
        </div>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          position="bottom"
          color="dark"
        />
      </IonContent>
    </IonPage>
  );
};

export default TwoFactorAuth;