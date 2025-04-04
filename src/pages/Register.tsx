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
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonIcon,
  IonToast,
  IonCheckbox
} from '@ionic/react';
import { personAdd } from 'ionicons/icons';
import { useState } from 'react';
import './Register.css';

const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !email || !password || !confirmPassword) {
      setToastMessage('Please fill in all fields');
      setShowToast(true);
      return;
    }
    
    if (password !== confirmPassword) {
      setToastMessage('Passwords do not match');
      setShowToast(true);
      return;
    }
    
    if (!agreeTerms) {
      setToastMessage('Please agree to terms and conditions');
      setShowToast(true);
      return;
    }

    // In a real app, you would make an API call to register
    setToastMessage('Registration successful!');
    setShowToast(true);
    // In a real app, you would redirect to login or home page
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/login" />
          </IonButtons>
          <IonTitle>Register</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div className="register-container">
          <IonCard>
            <IonCardHeader>
              <div className="register-icon-container">
                <IonIcon icon={personAdd} color="primary" />
              </div>
              <IonCardTitle>Create Account</IonCardTitle>
            </IonCardHeader>
            
            <IonCardContent>
              <form onSubmit={handleRegister}>
                <IonItem>
                  <IonLabel position="floating">Username</IonLabel>
                  <IonInput 
                    value={username} 
                    onIonChange={e => setUsername(e.detail.value!)} 
                    required
                  />
                </IonItem>
                
                <IonItem>
                  <IonLabel position="floating">Email</IonLabel>
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
                
                <IonItem>
                  <IonLabel position="floating">Confirm Password</IonLabel>
                  <IonInput 
                    type="password" 
                    value={confirmPassword} 
                    onIonChange={e => setConfirmPassword(e.detail.value!)} 
                    required
                  />
                </IonItem>
                
                <IonItem lines="none">
                  <IonCheckbox 
                    slot="start"
                    checked={agreeTerms}
                    onIonChange={e => setAgreeTerms(e.detail.checked)}
                  />
                  <IonLabel>I agree to the terms and conditions</IonLabel>
                </IonItem>
                
                <IonButton 
                  expand="block" 
                  type="submit"
                  className="register-button"
                >
                  <IonIcon icon={personAdd} slot="start" />
                  Register
                </IonButton>
              </form>
              
              <div className="login-link">
                <p>Already have an account? <a href="/login">Login here</a></p>
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

export default Register;