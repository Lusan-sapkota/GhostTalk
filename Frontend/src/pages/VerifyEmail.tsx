import React, { useEffect, useState } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonLoading,
  IonIcon,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
} from '@ionic/react';
import { checkmarkCircleOutline, alertCircleOutline, refreshOutline, arrowBack } from 'ionicons/icons';
import { apiService } from '../services/api.service';
import { useAuth } from '../contexts/AuthContext';

interface VerifyEmailParams {
  token: string;
}

const VerifyEmail: React.FC = () => {
  const { token } = useParams<VerifyEmailParams>();
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const history = useHistory();
  const { login } = useAuth();

  useEffect(() => {
    verifyEmail();
  }, [token]);

  const verifyEmail = async () => {
    setVerifying(true);
    try {
      // Call your Flask backend to verify the JWT token
      const response = await apiService.makeRequest('/auth/verify-email', 'POST', { token });
      
      if (response.success) {
        setSuccess(true);
        setEmail(response.email || '');
        
        // If the verification was successful and includes user credentials, 
        if (response.email && response.password) {
          await login(response.email, response.password);
        }
      } else {
        setError(response.message || 'Verification failed. Please try again.');
      }
    } catch (err) {
      setError('An error occurred during verification. The token might be expired.');
    } finally {
      setVerifying(false);
    }
  };

  const handleResendEmail = async () => {
    if (!email) return;
    
    setResendLoading(true);
    try {
      const response = await apiService.makeRequest('/auth/resend-verification', 'POST', { email });
      if (response.success) {
        setError('');
        // Show a temporary success message
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(response.message || 'Failed to resend verification email.');
      }
    } catch (err) {
      setError('An error occurred when trying to resend the verification email.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Email Verification</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonLoading isOpen={verifying} message="Verifying your email..." />
        
        {!verifying && (
          <IonCard className="ion-text-center">
            <IonCardHeader>
              <IonCardTitle>
                {success ? 'Email Verified!' : 'Verification Failed'}
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              {success ? (
                <>
                  <IonIcon 
                    icon={checkmarkCircleOutline} 
                    color="success" 
                    style={{ fontSize: '64px' }} 
                  />
                  <p>Your email has been successfully verified.</p>
                  <IonButton 
                    expand="block" 
                    onClick={() => history.push('/home')}
                  >
                    Continue to GhostTalk
                  </IonButton>
                </>
              ) : (
                <>
                  <IonIcon 
                    icon={alertCircleOutline} 
                    color="danger" 
                    style={{ fontSize: '64px' }} 
                  />
                  <p>{error}</p>
                  <IonButton 
                    expand="block" 
                    onClick={handleResendEmail}
                    disabled={resendLoading || !email}
                  >
                    <IonIcon slot="start" icon={refreshOutline} />
                    Resend Verification Email
                  </IonButton>
                  <IonButton 
                    expand="block" 
                    fill="outline" 
                    onClick={() => history.push('/register')}
                    className="ion-margin-top"
                  >
                    <IonIcon slot="start" icon={arrowBack} />
                    Back to Registration
                  </IonButton>
                </>
              )}
            </IonCardContent>
          </IonCard>
        )}
      </IonContent>
    </IonPage>
  );
};

export default VerifyEmail;
