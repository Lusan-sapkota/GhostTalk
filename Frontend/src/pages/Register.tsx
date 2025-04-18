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
  IonList,
  IonSpinner
} from '@ionic/react';
import { personAdd, eye, eyeOff, checkmarkCircle, closeCircle, alertCircle, refreshCircleOutline, mail } from 'ionicons/icons';
import { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import './Register.css';
import BackHeaderComponent from '../components/BackHeaderComponent';
import { apiService } from '../services/api.service';
import { useAuth } from '../contexts/AuthContext';
import { useRateLimit } from '../hooks/useRateLimit';
import { homeOutline, logOutOutline } from 'ionicons/icons';

const Register: React.FC = () => {
  const history = useHistory();
  const { register, isAuthenticated, logout } = useAuth();
  const [alreadyAuthenticated, setAlreadyAuthenticated] = useState(false);
  const [isResending, setIsResending] = useState(false);
  
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

  const { canPerformAction, triggerAction, countdown } = useRateLimit(60);

  // Improved username generation with better error handling
  const generateUsername = async () => {
    try {
      setGeneratingUsername(true);
      
      // Add timeout to prevent long waiting
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
      
      console.log("Requesting username from backend...");
      const response = await apiService.makeRequest(
        '/auth/generate-username', 
        'GET',
        undefined,
        { signal: controller.signal }
      );
      
      clearTimeout(timeoutId);
      
      console.log("Backend response:", response);
      
      if (response && response.success) {
        setGeneratedUsername(response.username);
        console.log("Username set successfully:", response.username);
      } else {
        console.error('Username generation failed:', response);
        setToastMessage('Could not generate username from server. Please try again.');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Network error when generating username:', error);
      
      setToastMessage('Network error. Please check your connection and try again.');
      setShowToast(true);
    } finally {
      setGeneratingUsername(false);
    }
  };

  // Call username generation on component mount with retry mechanism
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;
    
    const attemptGenerateUsername = async () => {
      try {
        await generateUsername();
      } catch (error) {
        console.error(`Username generation attempt ${retryCount + 1} failed:`, error);
        
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`Retrying username generation (${retryCount}/${maxRetries})...`);
          
          // Wait a bit before retrying (increasing delay with each retry)
          setTimeout(attemptGenerateUsername, 1000 * retryCount);
        } else {
          console.error(`Failed to generate username after ${maxRetries} attempts`);
          setToastMessage('Could not generate a username. Please try again later or contact support.');
          setShowToast(true);
        }
      }
    };
    
    attemptGenerateUsername();
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
        name: generatedUsername, // This will be used as username in the backend
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

  const handleResendVerification = async () => {
    if (!canPerformAction()) {
      setToastMessage(`Please wait ${countdown} seconds before requesting another email`);
      setShowToast(true);
      return;
    }
    
    try {
      setIsResending(true);
      console.log("Requesting verification email resend for:", email);
      
      const response = await apiService.resendVerification(email);
      console.log("Resend verification response:", response);
      
      if (response.success) {
        triggerAction(); // Start cooldown
        setToastMessage('Verification email sent! Please check your inbox and spam folder.');
        
        // FOR DEVELOPMENT ONLY - will auto-open verification link if available
        // Remove this in production!
        if (response.verificationUrl) {
          console.log("Dev mode: Auto verification URL:", response.verificationUrl);
          // Extract the correct port from the current window location
          const currentPort = window.location.port;
          // Update URL to use the current port rather than the one from backend
          const fixedUrl = response.verificationUrl.replace(/:\d+\//, `:${currentPort}/`);
          console.log("Using corrected URL with current port:", fixedUrl);
          // Uncomment to auto-open the link for testing:
          window.open(fixedUrl, '_blank');
        }
      } else {
        setToastMessage(response.message || 'Failed to resend verification email');
      }
    } catch (error) {
      console.error('Error resending verification email:', error);
      setToastMessage('Network error. Please try again later.');
    } finally {
      setIsResending(false);
      setShowToast(true);
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
            <IonLabel className="register-form-label">Username*</IonLabel>
            <IonInput 
              className="register-input"
              type="text" 
              value={generatedUsername} 
              disabled={true}  // Always disabled - users can't edit
              placeholder={generatingUsername ? "Generating..." : ""}
              required
            />
            <div slot="end">
              <IonButton 
                fill="clear"
                onClick={generateUsername}
                disabled={generatingUsername}
                className="refresh-username-btn"
              >
                <span>Refresh Username</span>
                <IonIcon slot="icon-only" icon={refreshCircleOutline} />
                {generatingUsername ? 
                  <IonSpinner name="dots" className="refresh-spinner" /> : 
                  <IonIcon slot="icon-only" icon={refreshCircleOutline} />
                }
              </IonButton>
            </div>
          </IonItem>

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

  const checkVerificationStatus = async () => {
    setIsLoading(true);
    try {
      console.log("Checking verification status for:", email);
      const response = await apiService.makeRequest('/auth/check-verification', 'POST', { email });
      console.log("Verification status response:", response);
      
      if (response.success) {
        if (response.isVerified) {
          setToastMessage('Email verified! You can now login.');
          setShowToast(true);
          setTimeout(() => {
            history.push('/login');
          }, 1500);
        } else {
          // For development only - auto-open verification URL if available
          if (response._devUrl) {
            console.log("Development verification URL:", response._devUrl);
            // Uncomment to auto-open the link for testing:
            // window.open(response._devUrl, '_blank');
          }
          
          setToastMessage('Your email is not yet verified. Please check your inbox or request a new verification email.');
          setShowToast(true);
        }
      } else {
        setToastMessage('Could not verify your status. Please try again later.');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
      setToastMessage('Network error when checking verification status.');
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  const renderVerificationScreen = () => (
    <IonCard className="verification-card ghost-shadow">
      <IonCardHeader>
        <IonCardTitle>Verify Your Email</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <div className="verification-icon ghost-float">
          <IonIcon icon={mail} color="primary" />
        </div>
        <p className="verification-message">
          We've sent a verification email to <strong>{email}</strong>.
          Please check your inbox and click the verification link.
        </p>
        <div className="verification-actions">
          <IonButton expand="block" onClick={checkVerificationStatus}>
            Go to Login
          </IonButton>
          <IonButton expand="block" fill="outline" onClick={() => setRegistrationStep(1)}>
            Wrong Email?
          </IonButton>
          <IonButton 
            expand="block" 
            fill="clear" 
            disabled={isResending || !canPerformAction()}
            onClick={handleResendVerification}
          >
            {isResending ? (
              <IonSpinner name="dots" />
            ) : !canPerformAction() ? (
              `Resend Email (${countdown}s)`
            ) : (
              'Resend Email'
            )}
          </IonButton>
        </div>
      </IonCardContent>
    </IonCard>
  );

  // Check if already logged in on component mount
  useEffect(() => {
    if (isAuthenticated) {
      setAlreadyAuthenticated(true);
    }
  }, [isAuthenticated]);

  // Component to display when already logged in
  const AlreadyLoggedInMessage = () => (
    <div className="already-logged-in-container">
      <IonCard className="already-logged-in-card ghost-shadow">
        <IonCardHeader>
          <IonCardTitle className="ghost-pulse">Already Logged In</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <p>You are already logged in to your account. You need to log out first to register a new account.</p>
          <div className="already-logged-in-buttons">
            <IonButton 
              expand="block" 
              onClick={() => history.push('/home')}
              className="ghost-shadow"
            >
              <IonIcon slot="start" icon={homeOutline} />
              Go to Home
            </IonButton>
            <IonButton 
              expand="block" 
              color="medium"
              onClick={() => {
                logout();
                setAlreadyAuthenticated(false);
              }}
            >
              <IonIcon slot="start" icon={logOutOutline} />
              Logout
            </IonButton>
          </div>
        </IonCardContent>
      </IonCard>
    </div>
  );

  return (
    <IonPage className="ghost-appear">
      <BackHeaderComponent title="Register" defaultHref="/login" />
      
      <IonContent fullscreen>
        {alreadyAuthenticated ? (
          <AlreadyLoggedInMessage />
        ) : (
          <div className="register-container">
            {registrationStep === 1 ? renderRegistrationForm() : renderVerificationScreen()}
          </div>
        )}
        
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

