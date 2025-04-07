import {
  IonContent,
  IonPage,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonIcon,
  IonToast,
  IonCheckbox,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonLoading,
  IonToggle,
  IonList
} from '@ionic/react';
import { personAdd, eye, eyeOff, checkmarkCircle, closeCircle, alertCircle } from 'ionicons/icons';
import { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import './Register.css';
import BackHeaderComponent from '../components/BackHeaderComponent';
import { apiService } from '../services/api.service';
import { useAuth } from '../contexts/AuthContext';

const Register: React.FC = () => {
  const history = useHistory();
  const { register } = useAuth();
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [gender, setGender] = useState('');
  const [bio, setBio] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  
  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatingUsername, setGeneratingUsername] = useState(false);
  const [generatedUsername, setGeneratedUsername] = useState('');

  // Password validation states
  const [hasMinLength, setHasMinLength] = useState(false);
  const [hasUppercase, setHasUppercase] = useState(false);
  const [hasLowercase, setHasLowercase] = useState(false);
  const [hasNumber, setHasNumber] = useState(false);
  const [hasSpecialChar, setHasSpecialChar] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(false);

  // Step in the registration flow
  const [registrationStep, setRegistrationStep] = useState(1);

  // Function to generate a username from the backend
  const generateUsername = async () => {
    try {
      setGeneratingUsername(true);
      const response = await apiService.makeRequest('/auth/generate-username', 'GET');
      if (response && response.success) {
        setGeneratedUsername(response.username);
      } else {
        console.error('Username generation failed:', response);
        setToastMessage(response?.message || 'Failed to generate username');
        setShowToast(true);
        // Generate a fallback username if the API fails
        setGeneratedUsername(`User${Math.floor(Math.random() * 9000) + 1000}`);
      }
    } catch (error) {
      console.error('Network error when generating username:', error);
      setToastMessage('Network error when generating username. Using fallback name.');
      setShowToast(true);
      // Generate a fallback username if the API fails
      setGeneratedUsername(`User${Math.floor(Math.random() * 9000) + 1000}`);
    } finally {
      setGeneratingUsername(false);
    }
  };

  // Call username generation on component mount
  useEffect(() => {
    generateUsername();
  }, []);

  // Check password requirements
  useEffect(() => {
    // Immediately check password requirements
    const checkPasswordRequirements = () => {
      setHasMinLength(password.length >= 8);
      setHasUppercase(/[A-Z]/.test(password));
      setHasLowercase(/[a-z]/.test(password));
      setHasNumber(/[0-9]/.test(password));
      setHasSpecialChar(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password));
      setPasswordsMatch(password === confirmPassword && password !== '');
    };
    
    checkPasswordRequirements();
    
    // No delay needed, validation is immediate
  }, [password, confirmPassword]);

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleToggleConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const isPasswordValid = () => {
    return hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar && passwordsMatch;
  };

  const validateForm = () => {
    if (!email || !password || !confirmPassword || !gender) {
      setToastMessage('Please fill in all required fields');
      setShowToast(true);
      return false;
    }
    
    if (!isPasswordValid()) {
      setToastMessage('Please meet all password requirements');
      setShowToast(true);
      return false;
    }
    
    if (!agreeTerms) {
      setToastMessage('Please agree to terms and conditions');
      setShowToast(true);
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setToastMessage('Please enter a valid email address');
      setShowToast(true);
      return false;
    }

    return true;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setIsLoading(true);
      const response = await register(email, password, {
        name: generatedUsername,
        gender,
        bio
      });
      
      if (response.success) {
        setRegistrationStep(2); // Show verification screen
      } else {
        setToastMessage(response.message || 'Registration failed');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Registration error:', error);
      setToastMessage('An error occurred during registration');
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  const renderPasswordRequirements = () => (
    <ul className="password-requirements">
      <li className={password.length > 0 ? (hasMinLength ? 'requirement-met' : 'requirement-not-met') : 'requirement-not-met'}>
        <IonIcon icon={password.length > 0 ? (hasMinLength ? checkmarkCircle : alertCircle) : closeCircle} />
        At least 8 characters
      </li>
      <li className={password.length > 0 ? (hasUppercase ? 'requirement-met' : 'requirement-not-met') : 'requirement-not-met'}>
        <IonIcon icon={password.length > 0 ? (hasUppercase ? checkmarkCircle : alertCircle) : closeCircle} />
        At least one uppercase letter
      </li>
      <li className={password.length > 0 ? (hasLowercase ? 'requirement-met' : 'requirement-not-met') : 'requirement-not-met'}>
        <IonIcon icon={password.length > 0 ? (hasLowercase ? checkmarkCircle : alertCircle) : closeCircle} />
        At least one lowercase letter
      </li>
      <li className={password.length > 0 ? (hasNumber ? 'requirement-met' : 'requirement-not-met') : 'requirement-not-met'}>
        <IonIcon icon={password.length > 0 ? (hasNumber ? checkmarkCircle : alertCircle) : closeCircle} />
        At least one number
      </li>
      <li className={password.length > 0 ? (hasSpecialChar ? 'requirement-met' : 'requirement-not-met') : 'requirement-not-met'}>
        <IonIcon icon={password.length > 0 ? (hasSpecialChar ? checkmarkCircle : alertCircle) : closeCircle} />
        At least one special character
      </li>
      <li className={confirmPassword.length > 0 ? (passwordsMatch ? 'requirement-met' : 'requirement-not-met') : 'requirement-not-met'}>
        <IonIcon icon={confirmPassword.length > 0 ? (passwordsMatch ? checkmarkCircle : alertCircle) : closeCircle} />
        Passwords match
      </li>
    </ul>
  );

  const renderRegistrationForm = () => (
    <IonCard className="register-card ghost-shadow">
      <IonCardHeader className="register-card-header">
        <div className="register-icon-container ghost-float">
          <IonIcon icon={personAdd} color="primary" />
        </div>
        <IonCardTitle className="register-card-title ghost-pulse">Create Account</IonCardTitle>
      </IonCardHeader>
      
      <IonCardContent>
        <form onSubmit={handleRegister}>
          <IonItem className="register-form-item staggered-item">
            <IonLabel className="register-form-label">Email*</IonLabel>
            <IonInput 
              className="register-input"
              type="email" 
              value={email} 
              onIonChange={e => setEmail(e.detail.value!)} 
              required
            />
          </IonItem>
          
          <IonItem className="register-form-item staggered-item password-item">
            <IonLabel className="register-form-label">Password*</IonLabel>
            <IonInput 
              className="register-input"
              type={showPassword ? "text" : "password"}
              value={password} 
              onIonChange={e => setPassword(e.detail.value!)} 
              onIonInput={e => setPassword((e.target as HTMLIonInputElement).value as string)}
              required
            />
            <IonButton 
              fill="clear" 
              slot="end" 
              onClick={handleTogglePassword}
              className="password-toggle-btn"
            >
              <IonIcon slot="icon-only" icon={showPassword ? eye : eyeOff} />
            </IonButton>
          </IonItem>
          
          {renderPasswordRequirements()}
          
          <IonItem className="register-form-item staggered-item password-item">
            <IonLabel className="register-form-label">Confirm Password*</IonLabel>
            <IonInput 
              className="register-input"
              type={showConfirmPassword ? "text" : "password"} 
              value={confirmPassword} 
              onIonChange={e => setConfirmPassword(e.detail.value!)}
              onIonInput={e => setConfirmPassword((e.target as HTMLIonInputElement).value as string)} 
              required
            />
            <IonButton 
              fill="clear" 
              slot="end" 
              onClick={handleToggleConfirmPassword}
              className="password-toggle-btn"
            >
              <IonIcon slot="icon-only" icon={showConfirmPassword ? eye : eyeOff} />
            </IonButton>
          </IonItem>
          
          <IonItem className="register-form-item staggered-item">
            <IonLabel className="register-form-label">Gender*</IonLabel>
            <IonSelect 
              className="register-select" 
              value={gender} 
              onIonChange={e => setGender(e.detail.value)} 
              placeholder='Choose One'
            >
              <IonSelectOption className="register-select-option" value="male">Male</IonSelectOption>
              <IonSelectOption className="register-select-option" value="female">Female</IonSelectOption>
              <IonSelectOption className="register-select-option" value="other">Other</IonSelectOption>
              <IonSelectOption className="register-select-option" value="prefer_not_to_say">Prefer not to say</IonSelectOption>
            </IonSelect>
          </IonItem>
          
          <IonItem className="register-form-item staggered-item">
            <IonLabel className="register-form-label">Bio (optional)</IonLabel>
            <IonTextarea
              className="register-textarea"
              value={bio}
              onIonChange={e => setBio(e.detail.value!)}
              rows={2}
              placeholder="Tell us a little about yourself (500 characters max)"
              maxlength={500}
            />
          </IonItem>
          
          <div className="terms-item">
            <IonCheckbox 
              className="register-checkbox"
              slot="start"
              checked={agreeTerms}
              onIonChange={e => setAgreeTerms(e.detail.checked)}
            />
            <span>
              I agree to the <a href="/terms">terms and conditions</a>
            </span>
          </div>

          <IonButton 
            expand="block" 
            type="submit"
            className="register-button ghost-shadow staggered-item"
            disabled={!isPasswordValid() || !email || !gender || !agreeTerms}
          >
            <IonIcon slot="start" icon={personAdd} />
            Register
          </IonButton>
        </form>
        
        <div className="login-link staggered-item">
          <p>Already have an account? <a href="/login">Login here</a></p>
        </div>
      </IonCardContent>
    </IonCard>
  );

  const renderVerificationScreen = () => (
    <IonCard className="verification-card ghost-shadow">
      <IonCardHeader>
        <IonCardTitle>Verify Your Email</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <div className="verification-icon ghost-float">
          <IonIcon icon="mail" color="primary" />
        </div>
        <p className="verification-message">
          We've sent a verification email to <strong>{email}</strong>.
          Please check your inbox and click the verification link.
        </p>
        <div className="verification-actions">
          <IonButton expand="block" onClick={() => history.push('/login')}>
            Go to Login
          </IonButton>
          <IonButton expand="block" fill="outline" onClick={() => setRegistrationStep(1)}>
            Wrong Email?
          </IonButton>
          <IonButton expand="block" fill="clear" onClick={() => {
            // Implement resend verification logic
            apiService.makeRequest('/auth/resend-verification', 'POST', { email });
            setToastMessage('Verification email resent!');
            setShowToast(true);
          }}>
            Resend Email
          </IonButton>
        </div>
      </IonCardContent>
    </IonCard>
  );

  return (
    <IonPage className="ghost-appear">
      <BackHeaderComponent title="Register" defaultHref="/login" />
      
      <IonContent fullscreen>
        <div className="register-container">
          {registrationStep === 1 ? renderRegistrationForm() : renderVerificationScreen()}
        </div>
        
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
          position="bottom"
        />
        
        <IonLoading
          isOpen={isLoading}
          message={'Creating your account...'}
        />
      </IonContent>
    </IonPage>
  );
};

export default Register;