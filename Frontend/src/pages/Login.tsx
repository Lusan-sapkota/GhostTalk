import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonCheckbox,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonIcon,
  IonToast,
  IonLoading
} from '@ionic/react';
import { logIn, person } from 'ionicons/icons';
import { useState } from 'react';
import './Login.css';
import { useAuth } from '../contexts/AuthContext';
import { useHistory, useLocation } from 'react-router-dom';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const history = useHistory();
  const location = useLocation();
  
  // Get redirect URL if available
  const { from } = location.state as { from: { pathname: string } } || { from: { pathname: '/home' } };
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setToastMessage('Please fill in all fields');
      setShowToast(true);
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await login(email, password);
      
      if (response.success) {
        setToastMessage('Login successful!');
        setShowToast(true);
        
        // Redirect after a short delay to show success message
        setTimeout(() => {
          history.replace(from);
        }, 1000);
      } else {
        setToastMessage(response.message || 'Login failed');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Login error:', error);
      setToastMessage('An error occurred during login');
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <IonPage className="ghost-appear">
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>Login</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div className="login-container">
          <IonCard className="login-card ghost-shadow">
            <IonCardHeader>
              <div className="login-icon-container ghost-float">
                <IonIcon icon={person} color="primary" />
              </div>
              <IonCardTitle className="ghost-pulse">Login</IonCardTitle>
            </IonCardHeader>
            
            <IonCardContent>
              <form onSubmit={handleLogin}>
                <IonItem className="staggered-item">
                  <IonLabel position="floating">Email address</IonLabel>
                  <IonInput 
                    type="email" 
                    value={email} 
                    onIonChange={e => setEmail(e.detail.value!)} 
                    required
                  />
                </IonItem>
                
                <IonItem className="staggered-item">
                  <IonLabel position="floating">Password</IonLabel>
                  <IonInput 
                    type="password" 
                    value={password} 
                    onIonChange={e => setPassword(e.detail.value!)} 
                    required
                  />
                </IonItem>
                
                <IonItem lines="none" className="remember-me staggered-item">
                  <IonCheckbox 
                    checked={remember} 
                    onIonChange={e => setRemember(e.detail.checked)} 
                  />
                  <IonLabel>Remember me</IonLabel>
                </IonItem>
                
                <div className="login-buttons staggered-item">
                  <IonButton 
                    expand="block" 
                    type="submit" 
                    className="login-button ghost-shadow">
                    <IonIcon slot="start" icon={logIn} />
                    Login
                  </IonButton>
                  
                  <div className="auth-links">
                    <IonButton routerLink="/register" fill="clear" size="small">
                      Create Account
                    </IonButton>
                    <IonButton routerLink="/forgot-password" fill="clear" size="small">
                      Forgot Password?
                    </IonButton>
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