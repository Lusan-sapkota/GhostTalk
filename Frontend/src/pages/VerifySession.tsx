import { useParams, useHistory } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  IonContent, IonPage, IonCard, IonCardHeader, IonCardTitle,
  IonCardContent, IonIcon, IonButton, IonLoading
} from '@ionic/react';
import { checkmarkCircleOutline, alertCircleOutline, homeOutline, logInOutline } from 'ionicons/icons';
import { apiService } from '../services/api.service';
import { useAuth } from '../contexts/AuthContext';

interface VerifySessionParams {
  token: string;
}

const VerifySession: React.FC = () => {
  const { token } = useParams<VerifySessionParams>();
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const history = useHistory();
  const { handleSessionVerification, isAuthenticated } = useAuth();

  useEffect(() => {
    const verifySessionToken = async () => {
      if (!token) {
        setError('No verification token provided');
        setVerifying(false);
        return;
      }

      try {
        // Send the token to backend for verification
        const response = await apiService.makeRequest('/auth/verify-session', 'POST', { token });
        
        if (response.success) {
          // Store session verification status and details
          localStorage.setItem('sessionVerified', 'true');
          sessionStorage.setItem('sessionVerified', 'true');
          
          // Also mark the security token as verified for the prompt component
          localStorage.setItem('securityTokenVerified', 'true');
          sessionStorage.setItem('securityTokenVerified', 'true');
          
          // Store session details if available (this is critical)
          if (response.sessionDetails) {
            console.log('Storing session details:', response.sessionDetails);
            const sessionDetailsStr = JSON.stringify(response.sessionDetails);
            localStorage.setItem('sessionDetails', sessionDetailsStr);
            sessionStorage.setItem('sessionDetails', sessionDetailsStr);
          }
          
          // Call the handler in AuthContext
          handleSessionVerification(response);
          
          setSuccess(true);
        } else {
          setError(response.message || 'Invalid or expired token. Please check your inbox for a new verification link.');
        }
      } catch (error) {
        console.error('Verification error:', error);
        setError('Invalid or expired token. Please check your inbox for a new verification link.');
      } finally {
        setVerifying(false);
      }
    };

    verifySessionToken();
  }, [token, handleSessionVerification]);

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <IonLoading isOpen={verifying} message="Verifying your session..." />
        
        {!verifying && (
          <IonCard className="verification-card ghost-shadow">
            <IonCardHeader>
              <IonCardTitle className="ion-text-center">
                {success ? 'Session Verified!' : 'Verification Failed'}
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
                  <p>Your session has been successfully verified.</p>
                  
                  <IonButton 
                    expand="block" 
                    className="ghost-shadow"
                    onClick={() => history.push(isAuthenticated ? '/home' : '/login')}
                  >
                    <IonIcon slot="start" icon={isAuthenticated ? homeOutline : logInOutline} />
                    {isAuthenticated ? 'Continue to Home' : 'Continue to Login'}
                  </IonButton>
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
                  
                  <IonButton 
                    expand="block"
                    onClick={() => history.push('/login')}
                    className="ghost-shadow"
                  >
                    <IonIcon slot="start" icon={logInOutline} />
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

export default VerifySession;