import React, { useEffect, useState } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import {
  IonContent,
  IonPage,
  IonButton,
  IonLoading,
  IonIcon,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonSpinner,
  IonToast,
} from '@ionic/react';
import { checkmarkCircleOutline, alertCircleOutline, refreshOutline, arrowBack, logIn, home } from 'ionicons/icons';
import { apiService } from '../services/api.service';
import { useAuth } from '../contexts/AuthContext';
import { useRateLimit } from '../hooks/useRateLimit';
import './VerifyEmail.css'; // You may need to create this CSS file

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
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const history = useHistory();
  const { login } = useAuth();
  const { canPerformAction, triggerAction, countdown } = useRateLimit(60);

  useEffect(() => {
    if (token) {
      verifyEmail();
    } else {
      setVerifying(false);
      setError('No verification token provided');
    }
  }, [token]);

  const verifyEmail = async () => {
    setVerifying(true);
    try {
      const response = await apiService.makeRequest('/auth/verify-email', 'POST', { token });
      
      if (response.success) {
        setSuccess(true);
        setEmail(response.email || '');
      } else {
        setError(response.message || 'Verification failed. Please try again.');
        // Check if token might be expired
        if (response.message && response.message.includes('expire')) {
          setToastMessage('Your verification link has expired. Please request a new one.');
          setShowToast(true);
        }
      }
    } catch (err: unknown) {
      console.error('Verification error:', err);
      const errorMessage = err && typeof err === 'object' && 'response' in err && 
        err.response && typeof err.response === 'object' && 'data' in err.response && 
        err.response.data && typeof err.response.data === 'object' && 'message' in err.response.data ?
        String(err.response.data.message) : 
        'An error occurred during verification. The token might be invalid or expired.';
      setError(errorMessage);
    } finally {
      setVerifying(false);
    }
  };

  const handleResendEmail = async () => {
    if (!email) return;
    
    if (!canPerformAction()) {
      setToastMessage(`Please wait ${countdown} seconds before requesting another email`);
      setShowToast(true);
      return;
    }
    
    setResendLoading(true);
    try {
      const response = await apiService.makeRequest('/auth/resend-verification', 'POST', { email });
      if (response.success) {
        triggerAction(); // Start the cooldown
        setToastMessage('Verification email sent successfully!');
      }
    } catch (err: unknown) {
      setToastMessage('An error occurred when trying to resend the verification email.');
    } finally {
      setResendLoading(false);
      setShowToast(true);
    }
  };

  const handleAlreadyVerified = () => {
    history.push('/login');
  };

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <IonLoading isOpen={verifying} message="Verifying your email..." />
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          position="bottom"
        />
        
        {!verifying && (
          <IonCard className="verification-card ghost-shadow">
            <IonCardHeader>
              <IonCardTitle className="ion-text-center">
                {success ? 'Email Verified!' : 'Verification Status'}
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent className="ion-text-center">
              {success ? (
                <>
                  <div className="verification-icon ghost-float">
                    <IonIcon 
                      icon={checkmarkCircleOutline} 
                      color="success" 
                      style={{ fontSize: '64px' }} 
                    />
                  </div>
                  <p>Your email has been successfully verified.</p>
                  
                  <div className="verification-actions">
                    <IonButton 
                      expand="block" 
                      className="ghost-shadow"
                      onClick={() => history.push('/login')}
                    >
                      <IonIcon slot="start" icon={logIn} />
                      Continue to Login
                    </IonButton>
                    
                    <IonButton 
                      expand="block"
                      fill="outline"
                      className="ghost-shadow"
                      onClick={() => history.push('/home')}
                    >
                      <IonIcon slot="start" icon={home} />
                      Go to Home
                    </IonButton>
                  </div>
                </>
              ) : (
                <>
                  <div className="verification-icon">
                    <IonIcon 
                      icon={alertCircleOutline} 
                      color="danger" 
                      style={{ fontSize: '64px' }} 
                    />
                  </div>
                  <p>{error}</p>
                  
                  {email ? (
                    <IonButton 
                      expand="block" 
                      onClick={handleResendEmail}
                      disabled={resendLoading || !canPerformAction()}
                      className="ghost-shadow"
                    >
                      {resendLoading ? (
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
                  ) : (
                    <IonButton 
                      expand="block"
                      onClick={() => history.push('/register')}
                      className="ghost-shadow"
                    >
                      <IonIcon slot="start" icon={arrowBack} />
                      Go Back to Registration
                    </IonButton>
                  )}
                  
                  <IonButton 
                    expand="block"
                    fill="outline"
                    onClick={() => {
                      // Check verification status before redirecting to login
                      if (email) {
                        setResendLoading(true);
                        apiService.makeRequest('/auth/check-verification', 'POST', { email })
                          .then(response => {
                            if (response.success && response.isVerified) {
                              history.push('/login');
                            } else {
                              setToastMessage('Your email is not yet verified. Please check your inbox or request a new verification email.');
                              setShowToast(true);
                            }
                          })
                          .catch(() => {
                            setToastMessage('Could not verify your status. Please try again later.');
                            setShowToast(true);
                          })
                          .finally(() => {
                            setResendLoading(false);
                          });
                      } else {
                        history.push('/login');
                      }
                    }}
                    className="ion-margin-top ghost-shadow"
                  >
                    Go to Login
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
