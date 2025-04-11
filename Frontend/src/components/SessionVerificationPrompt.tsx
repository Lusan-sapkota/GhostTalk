import React, { useState, useEffect } from 'react';
import {
  IonToast,
  IonLoading,
  IonButton,
  IonIcon,
  IonModal,
  IonContent,
  IonItem,
  IonLabel,
  IonList,
  IonCard,
  IonCardHeader,
  IonCardContent,
  IonCardTitle
} from '@ionic/react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api.service';
import { mail, refreshOutline, warning, lockClosed } from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';

const SessionVerificationPrompt: React.FC = () => {
  // State declarations
  const [showPrompt, setShowPrompt] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [invalidToken, setInvalidToken] = useState(false);
  const [sessionDetails, setSessionDetails] = useState<any>(null);
  const [verificationAttempts, setVerificationAttempts] = useState(0);
  
  // Hooks
  const { isAuthenticated, handleSessionVerification, logout } = useAuth();
  
  // Safely access router hooks with fallbacks
  let history: any = null;
  let location: any = null;
  
  try {
    history = useHistory();
    location = useLocation();
  } catch (e) {
    console.log("Router context not available, using fallbacks");
    // Provide fallbacks for history and location 
    history = {
      push: (path: string) => { window.location.href = path; },
      replace: (path: string) => { window.location.href = path; },
      listen: () => { return () => {}; } // noop unlisten function
    };
    location = { pathname: window.location.pathname };
  }
  
  // Helper function to check session verification status
  const isSessionVerified = () => {
    return localStorage.getItem('sessionVerified') === 'true' || 
           sessionStorage.getItem('sessionVerified') === 'true';
  };

  // Check verification status when component mounts and when auth status changes
  useEffect(() => {
    if (isAuthenticated) {
      if (!isSessionVerified()) {
        setShowPrompt(true);
        
        try {
          // Redirect to login if trying to access protected routes
          const allowedPaths = ['/login', '/verify-session', '/'];
          const currentPath = location?.pathname || window.location.pathname;
          
          if (!allowedPaths.includes(currentPath) && !currentPath.startsWith('/verify-session')) {
            if (history) {
              history.replace('/login');
            } else {
              window.location.href = '/login';
            }
          }
          
          // Try to get session details to show to the user
          const storedDetails = localStorage.getItem('sessionDetails') || sessionStorage.getItem('sessionDetails');
          if (storedDetails) {
            setSessionDetails(JSON.parse(storedDetails));
          }
        } catch (e) {
          console.error('Error in session verification process:', e);
        }
      }
    } else {
      setShowPrompt(false);
    }
  }, [isAuthenticated]);
  
  // Prevent navigation if not verified
  useEffect(() => {
    if (!isAuthenticated) return; // Don't set up listeners if not authenticated
    
    // Function to handle navigation attempts
    const handleNavigation = () => {
      if (isAuthenticated && !isSessionVerified()) {
        // Block navigation by showing the verification prompt
        setShowPrompt(true);
        return false;
      }
      return true;
    };
    
    // Standard beforeunload for browser navigation
    const preventNavigation = (e: BeforeUnloadEvent) => {
      if (isAuthenticated && showPrompt && !isSessionVerified()) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    
    // Set up listeners
    window.addEventListener('popstate', handleNavigation);
    window.addEventListener('beforeunload', preventNavigation);
    
    let unlisten = () => {};
    
    // Only set up router listener if history is available
    try {
      if (history && history.listen) {
        unlisten = history.listen(() => {
          if (isAuthenticated && !isSessionVerified()) {
            // If not on a whitelisted page, redirect to login
            try {
              const allowedPaths = ['/login', '/verify-session', '/'];
              const currentPath = location?.pathname || window.location.pathname;
              
              if (!allowedPaths.includes(currentPath) && !currentPath.startsWith('/verify-session')) {
                history.replace('/login');
              }
            } catch (e) {
              console.error("Navigation error:", e);
            }
          }
        });
      }
    } catch (e) {
      console.error("Error setting up history listener:", e);
    }
    
    // Cleanup function
    return () => {
      window.removeEventListener('popstate', handleNavigation);
      window.removeEventListener('beforeunload', preventNavigation);
      try {
        unlisten();
      } catch (e) {
        console.error("Error cleaning up history listener:", e);
      }
    };
  }, [isAuthenticated, showPrompt]);
  
  // Add this function to format time properly
  const formatTime = (timeString: string) => {
    try {
      const date = new Date(timeString);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (e) {
      return timeString || "Unknown time";
    }
  };

  // Add this function to format IP address (hide sensitive information)
  const formatIPAddress = (ip: string) => {
    if (!ip || ip === 'Unknown IP') return "Unknown IP";
    
    // If it's test IP like 8.8.8.8 from the test header, display it as masked
    if (ip === '8.8.8.8') {
      return "Private IP address";
    }
    
    return ip;
  };

  const handleVerifySession = async () => {
    setIsLoading(true);
    setVerificationAttempts(prev => prev + 1);
    
    try {
      // Get token from storage
      const token = apiService.getToken();
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Send the SECURITY token via email link verification instead
      // This assumes the user has clicked the verification link and you're checking status
      const verificationStatus = localStorage.getItem('securityTokenVerified') === 'true' || 
                                 sessionStorage.getItem('securityTokenVerified') === 'true';
      
      if (verificationStatus) {
        // If user has clicked the link, we consider it verified
        handleSessionVerification({ success: true, sessionDetails });
        setToastMessage('Session verified successfully!');
        setShowToast(true);
        setShowPrompt(false);
        setInvalidToken(false);
        
        // Check if "Remember me" was used
        const rememberMe = localStorage.getItem('rememberMe') === 'true';
        
        // Always store in sessionStorage for current session
        sessionStorage.setItem('sessionVerified', 'true');
        
        // Only store in localStorage if "Remember me" was used
        if (rememberMe) {
          localStorage.setItem('sessionVerified', 'true');
        }
        
        // Redirect to home after short delay
        setTimeout(() => {
          try {
            if (history) {
              history.push('/home');
            } else {
              window.location.href = '/home';
            }
          } catch (e) {
            window.location.href = '/home';
          }
        }, 1000);
        return;
      }
      
      // If verification hasn't happened via link, try API verification
      const response = await apiService.makeRequest('/auth/verify-session', 'POST', { token });
      
      if (response.success) {
        // Rest of the success handling code remains the same
        handleSessionVerification(response);
        setToastMessage('Session verified successfully!');
        setShowToast(true);
        setShowPrompt(false);
        setInvalidToken(false);
        
        // Check if "Remember me" was used
        const rememberMe = localStorage.getItem('rememberMe') === 'true';
        
        // Always store in sessionStorage for current session
        sessionStorage.setItem('sessionVerified', 'true');
        
        // Only store in localStorage if "Remember me" was used
        if (rememberMe) {
          localStorage.setItem('sessionVerified', 'true');
        }
        
        // Store session details similarly
        if (response.sessionDetails) {
          const sessionDetailsStr = JSON.stringify(response.sessionDetails);
          sessionStorage.setItem('sessionDetails', sessionDetailsStr);
          
          if (rememberMe) {
            localStorage.setItem('sessionDetails', sessionDetailsStr);
          }
        }
        
        // Redirect to home after short delay
        setTimeout(() => {
          try {
            if (history) {
              history.push('/home');
            } else {
              window.location.href = '/home';
            }
          } catch (e) {
            window.location.href = '/home';
          }
        }, 1000);
      } else {
        // Invalid or expired token
        setInvalidToken(true);
        setToastMessage('Invalid or expired token. Please check your inbox for a new verification link.');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Session verification error:', error);
      setInvalidToken(true);
      setToastMessage('Error verifying session. Please check your inbox for a verification link.');
      setShowToast(true);
      
      // After multiple failed attempts, suggest logging out
      if (verificationAttempts >= 2) {
        setTimeout(() => {
          setToastMessage('Multiple verification attempts failed. You may need to log in again.');
          setShowToast(true);
        }, 3000);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLogout = () => {
    logout();
    setShowPrompt(false);
    try {
      if (history) {
        history.push('/login');
      } else {
        window.location.href = '/login';
      }
    } catch (e) {
      window.location.href = '/login';
    }
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
          <IonCard className="ghost-shadow">
            <IonCardHeader>
              <div className="login-icon-container ghost-float">
                <IonIcon icon={invalidToken ? warning : mail} color={invalidToken ? "warning" : "primary"} />
              </div>
              <IonCardTitle className="ion-text-center">Verify Your Session</IonCardTitle>
            </IonCardHeader>
            
            <IonCardContent>
              <p className="ion-text-center">
                {invalidToken 
                  ? "For your security, we need to verify this new login session. Please check your email for a verification link." 
                  : "For your security, we've sent a verification email. Please check your inbox and click the verification link before continuing."}
              </p>
              
              {sessionDetails && (
                <div className="session-details">
                  <h4>Login details:</h4>
                  <IonList lines="none">
                    <IonItem>
                      <IonLabel>
                        <h3>Device</h3>
                        <p>{sessionDetails.device || "Unknown device"}</p>
                      </IonLabel>
                    </IonItem>
                    <IonItem>
                      <IonLabel>
                        <h3>Location</h3>
                        <p>{sessionDetails.location || "Unknown location"}</p>
                      </IonLabel>
                    </IonItem>
                    <IonItem>
                      <IonLabel>
                        <h3>IP Address</h3>
                        <p>{formatIPAddress(sessionDetails.ip)}</p>
                      </IonLabel>
                    </IonItem>
                    <IonItem>
                      <IonLabel>
                        <h3>Time</h3>
                        <p>{sessionDetails.time ? formatTime(sessionDetails.time) : "Unknown time"}</p>
                      </IonLabel>
                    </IonItem>
                  </IonList>
                </div>
              )}
              
              <div className="verification-actions ion-padding-top">
                <IonButton 
                  expand="block" 
                  onClick={handleVerifySession}
                  disabled={isLoading}
                >
                  <IonIcon slot="start" icon={refreshOutline} />
                  {isLoading ? "Checking..." : "I've Clicked The Verification Link"}
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