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
  IonCheckbox,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonLoading
} from '@ionic/react';
import { personAdd, refresh } from 'ionicons/icons';
import { useState, useEffect } from 'react';
import './Register.css';

const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [gender, setGender] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isGeneratingUsername, setIsGeneratingUsername] = useState(false);
  const [showLoading, setShowLoading] = useState(false);

  // Backend URL from environment variable or default
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  // Generate a username when the component loads
  useEffect(() => {
    generateUsername();
  }, []);

  const generateUsername = async () => {
    setIsGeneratingUsername(true);
    try {
      const response = await fetch(`${backendUrl}/generate-username`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsername(data.username);
      } else {
        console.error('Failed to generate username, status:', response.status);
        const errorText = await response.text();
        console.error('Error details:', errorText);
        setToastMessage(`Failed to generate username (${response.status})`);
        setShowToast(true);
      }
    } catch (error) {
      console.error('Error generating username:', error);
      setToastMessage('Error connecting to server. Please try again.');
      setShowToast(true);
    } finally {
      setIsGeneratingUsername(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !email || !password || !confirmPassword || !gender) {
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

    try {
      const response = await fetch(`${backendUrl}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username,
          email,
          password,
          gender,
          rememberMe
        })
      });
      
      if (response.ok) {
        setToastMessage('Registration successful!');
        setShowToast(true);
        // In a real app, you would redirect to login or home page
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        const errorData = await response.json();
        setToastMessage(errorData.error || 'Registration failed');
        setShowToast(true);
      }
    } catch (error) {
      setToastMessage('Error during registration');
      setShowToast(true);
    }
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
                    readonly
                  />
                  <IonButton 
                    fill="clear" 
                    slot="end" 
                    onClick={generateUsername}
                    disabled={isGeneratingUsername}
                  >
                    {isGeneratingUsername ? <IonSpinner name="dots" /> : <IonIcon icon={refresh} />}
                  </IonButton>
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
                  <IonLabel position="floating">Gender</IonLabel>
                  <IonSelect 
                    value={gender} 
                    onIonChange={e => setGender(e.detail.value)}
                    interface="popover"
                    placeholder="Select One"
                    required
                  >
                    <IonSelectOption value="male">Male</IonSelectOption>
                    <IonSelectOption value="female">Female</IonSelectOption>
                    <IonSelectOption value="other">Other</IonSelectOption>
                    <IonSelectOption value="prefer-not-to-say">Prefer not to say</IonSelectOption>
                  </IonSelect>
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

                <IonItem lines="none">
                  <IonCheckbox 
                    slot="start"
                    checked={rememberMe}
                    onIonChange={e => setRememberMe(e.detail.checked)}
                  />
                  <IonLabel>Remember me</IonLabel>
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