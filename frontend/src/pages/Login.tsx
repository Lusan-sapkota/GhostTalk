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
  IonToast
} from '@ionic/react';
import { logIn, person } from 'ionicons/icons';
import { useState } from 'react';
import './Login.css';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would make an API call to authenticate
    if (email && password) {
      // Simulate login success
      setToastMessage('Login successful!');
      setShowToast(true);
      // In a real app, you would store the token, redirect, etc.
    } else {
      setToastMessage('Please fill in all fields');
      setShowToast(true);
    }
  };

  return (
    <IonPage>
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
          <IonCard>
            <IonCardHeader>
              <div className="login-icon-container">
                <IonIcon icon={person} color="primary" />
              </div>
              <IonCardTitle>Login</IonCardTitle>
            </IonCardHeader>
            
            <IonCardContent>
              <form onSubmit={handleLogin}>
                <IonItem>
                  <IonLabel position="floating">Email address</IonLabel>
                  <IonInput 
                    type="email" 
                    value={email} 
                    onIonChange={e => setEmail(e.detail.value!)} 
                    required
                  />
                </IonItem>
                
                <IonItem>
                  <IonLabel position="floating">Password</IonLabel>
                  <IonInput 
                    type="password" 
                    value={password} 
                    onIonChange={e => setPassword(e.detail.value!)} 
                    required
                  />
                </IonItem>
                
                <IonItem lines="none">
                  <IonCheckbox 
                    slot="start"
                    checked={remember}
                    onIonChange={e => setRemember(e.detail.checked)}
                  />
                  <IonLabel>Stay logged in for 30 days</IonLabel>
                </IonItem>
                
                <IonButton 
                  expand="block" 
                  type="submit"
                  className="login-button"
                >
                  <IonIcon icon={logIn} slot="start" />
                  Login
                </IonButton>
              </form>
              
              <div className="register-link">
                <p>Don't have an account? <a href="/register">Register here</a></p>
              </div>
            </IonCardContent>
          </IonCard>
        </div>
        
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
          position="bottom"
        />
      </IonContent>
    </IonPage>
  );
};

export default Login;