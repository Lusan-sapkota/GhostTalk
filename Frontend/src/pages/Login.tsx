import {
  IonContent,
  IonPage,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonCheckbox,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonIcon,
  IonToast,
  IonLoading,
  IonSegment,
  IonSegmentButton
} from '@ionic/react';
import { logIn, person, eye, eyeOff, mail } from 'ionicons/icons';
import { useState } from 'react';
import './Login.css';
import { useAuth } from '../contexts/AuthContext';
import { useHistory, useLocation } from 'react-router-dom';
import BackHeaderComponent from '../components/BackHeaderComponent';
import { apiService } from '../services/api.service';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'password' | 'magic'>('password');
  
  const { login } = useAuth();
  const history = useHistory();
  const location = useLocation();
  
  // Get redirect URL if available
  const { from } = location.state as { from: { pathname: string } } || { from: { pathname: '/home' } };
  
  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation for both methods
    if (!email) {
      setToastMessage('Please enter your email address');
      setShowToast(true);
      return;
    }
    
    // Only validate password for password login method
    if (loginMethod === 'password' && !password) {
      setToastMessage('Please enter your password');
      setShowToast(true);
      return;
    }
    
    try {
      setIsLoading(true);
      
      if (loginMethod === 'magic') {
        // Magic link logic
        const response = await apiService.sendMagicLink(email);
        
        if (response.success) {
          setToastMessage('Magic link sent to your email');
          setShowToast(true);
          
          // Check if the user needs verification
          if (response.needsVerification) {
            // Handle unverified users similarly to password login
            setTimeout(() => {
              history.push('/verification-needed', { email });
            }, 2000);
          } else {
            // Redirect to magic link sent confirmation page
            history.push('/magic-link-sent', { email });
          }
        } else {
          setToastMessage(response.message || 'Failed to send magic link');
          setShowToast(true);
        }
      } else {
        // Regular password login
        const response = await login(email, password, remember);
        
        if (response.success) {
          setToastMessage('Login successful!');
          setShowToast(true);
          history.replace(from);
        } else if (response.needsVerification) {
          // Handle unverified users
          setToastMessage('Please verify your email first');
          setShowToast(true);
          
          // Option to redirect to verification resend screen
          setTimeout(() => {
            history.push('/verification-needed', { email: response.email });
          }, 2000);
        } else {
          setToastMessage(response.message || 'Login failed');
          setShowToast(true);
        }
      }
    } catch (error) {
      console.error('Login error details:', error);
      setToastMessage('An error occurred during login');
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setToastMessage('Please enter your email to reset password');
      setShowToast(true);
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await apiService.forgotPassword(email);
      
      if (response.success) {
        setToastMessage('Password reset link sent to your email');
        setShowToast(true);
        history.push('/password-reset-sent', { email });
      } else {
        setToastMessage(response.message || 'Failed to send reset link');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Password reset error:', error);
      setToastMessage('An error occurred when trying to reset password');
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <IonPage className="ghost-appear">
      <BackHeaderComponent title="Login" />
      
      <IonContent fullscreen>
        <div className="login-container">
          <IonCard className="login-card ghost-shadow">
            <IonCardHeader>
              <div className="login-icon-container ghost-float">
                <IonIcon icon={person} color="primary" />
              </div>
              <IonCardTitle className="ghost-pulse">Login</IonCardTitle>
              
              <IonSegment 
                value={loginMethod} 
                onIonChange={e => setLoginMethod(e.detail.value as 'password' | 'magic')}
                className="login-method-segment staggered-item"
              >
                <IonSegmentButton value="password">
                  <IonLabel>Password</IonLabel>
                </IonSegmentButton>
                <IonSegmentButton value="magic">
                  <IonLabel>Magic Link</IonLabel>
                </IonSegmentButton>
              </IonSegment>
            </IonCardHeader>
            
            <IonCardContent>
              <form onSubmit={handleLogin}>
                <IonItem className="login-form-item staggered-item">
                  <IonLabel className="login-form-label">Email address</IonLabel>
                  <IonInput 
                    className="login-input"
                    type="email" 
                    value={email} 
                    onIonChange={e => setEmail(e.detail.value!)} 
                    required
                  />
                </IonItem>
                
                {loginMethod === 'password' && (
                  <IonItem className="login-form-item staggered-item login-password-item">
                    <IonLabel className="login-form-label">Password</IonLabel>
                    <IonInput 
                      className="login-input"
                      type={showPassword ? "text" : "password"}
                      value={password} 
                      onIonChange={e => setPassword(e.detail.value!)} 
                      required
                    />
                    <IonButton 
                      fill="clear" 
                      slot="end" 
                      onClick={handleTogglePassword}
                      className="login-password-toggle-btn"
                    >
                      <IonIcon slot="icon-only" icon={showPassword ? eye : eyeOff} />
                    </IonButton>
                  </IonItem>
                )}
                
                {loginMethod === 'password' && (
                  <div className="login-remember-item">
                    <IonCheckbox 
                      className="login-checkbox"
                      checked={remember} 
                      onIonChange={e => setRemember(e.detail.checked)} 
                    />
                    <span>Remember me</span>
                  </div>
                )}
                
                <div className="login-buttons staggered-item">
                  <IonButton 
                    expand="block" 
                    type="submit" 
                    className="login-button ghost-shadow"
                  >
                    <IonIcon slot="start" icon={loginMethod === 'password' ? logIn : mail} />
                    {loginMethod === 'password' ? 'Login' : 'Send Magic Link'}
                  </IonButton>
                  
                  <div className="auth-links">
                    <IonButton routerLink="/register" fill="clear" size="small">
                      Create Account
                    </IonButton>
                    {loginMethod === 'password' && (
                      <IonButton onClick={handleForgotPassword} fill="clear" size="small">
                        Forgot Password?
                      </IonButton>
                    )}
                  </div>
                </div>
              </form>
            </IonCardContent>
          </IonCard>
        </div>
        
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          position="bottom"
        />
        
        <IonLoading
          isOpen={isLoading}
          message={'Please wait...'}
        />
      </IonContent>
    </IonPage>
  );
};

export default Login;