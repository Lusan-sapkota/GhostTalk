import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonPage,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonIcon,
  IonToast,
  IonLoading,
  IonList
} from '@ionic/react';
import { key, eye, eyeOff, checkmarkCircle, alertCircle, closeCircle } from 'ionicons/icons';
import { useParams, useHistory } from 'react-router-dom';
import { apiService } from '../services/api.service';
import BackHeaderComponent from '../components/BackHeaderComponent';

interface ResetPasswordParams {
  token: string;
}

const ResetPassword: React.FC = () => {
  const { token } = useParams<ResetPasswordParams>();
  const history = useHistory();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  
  // Password validation states
  const [hasMinLength, setHasMinLength] = useState(false);
  const [hasUppercase, setHasUppercase] = useState(false);
  const [hasLowercase, setHasLowercase] = useState(false);
  const [hasNumber, setHasNumber] = useState(false);
  const [hasSpecialChar, setHasSpecialChar] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(false);

  // Validate password on change
  useEffect(() => {
    setHasMinLength(password.length >= 8);
    setHasUppercase(/[A-Z]/.test(password));
    setHasLowercase(/[a-z]/.test(password));
    setHasNumber(/[0-9]/.test(password));
    setHasSpecialChar(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password));
    setPasswordsMatch(password === confirmPassword && password !== '');
  }, [password, confirmPassword]);
  
  const isPasswordValid = () => {
    return hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar && passwordsMatch;
  };

  const handleResetPassword = async () => {
    if (!isPasswordValid()) {
      setMessage('Please meet all password requirements.');
      setIsError(true);
      return;
    }
    
    setIsLoading(true);
    try {
      // Token will be verified by our backend with JWT validation
      const response = await apiService.resetPassword(token, password);
      
      if (response.success) {
        setMessage('Password reset successful! You can now login with your new password.');
        setIsError(false);
        
        // Redirect to login after showing message
        setTimeout(() => {
          history.push('/login');
        }, 3000);
      } else {
        setMessage(response.message || 'Failed to reset password. The link might be expired.');
        setIsError(true);
      }
    } catch (error) {
      console.error('Password reset error:', error);
      setMessage('An error occurred. Please try again or request a new reset link.');
      setIsError(true);
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
  
  return (
    <IonPage>
      <BackHeaderComponent title="Reset Password" defaultHref="/login" />
      
      <IonContent className="ion-padding">
        <IonLoading isOpen={isLoading} message="Resetting password..." />
        
        <IonCard className="ghost-shadow">
          <IonCardHeader className="ion-text-center">
            <div className="login-icon-container ghost-float">
              <IonIcon icon={key} color="primary" />
            </div>
            <IonCardTitle>Create New Password</IonCardTitle>
          </IonCardHeader>
          
          <IonCardContent>
            <IonList>
              <IonItem className="register-form-item password-item">
                <IonLabel className="register-form-label">New Password</IonLabel>
                <IonInput 
                  className="register-input"
                  type={showPassword ? "text" : "password"}
                  value={password} 
                  onIonChange={e => setPassword(e.detail.value!)}
                  required
                />
                <IonButton 
                  fill="clear" 
                  slot="end" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle-btn"
                >
                  <IonIcon slot="icon-only" icon={showPassword ? eye : eyeOff} />
                </IonButton>
              </IonItem>
              
              {renderPasswordRequirements()}
              
              <IonItem className="register-form-item password-item">
                <IonLabel className="register-form-label">Confirm New Password</IonLabel>
                <IonInput 
                  className="register-input"
                  type={showConfirmPassword ? "text" : "password"} 
                  value={confirmPassword} 
                  onIonChange={e => setConfirmPassword(e.detail.value!)}
                  required
                />
                <IonButton 
                  fill="clear" 
                  slot="end" 
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="password-toggle-btn"
                >
                  <IonIcon slot="icon-only" icon={showConfirmPassword ? eye : eyeOff} />
                </IonButton>
              </IonItem>
              
              <div className="ion-padding-top">
                <IonButton 
                  expand="block" 
                  onClick={handleResetPassword}
                  disabled={!isPasswordValid()}
                  className="register-button ghost-shadow"
                >
                  Reset Password
                </IonButton>
              </div>
            </IonList>
          </IonCardContent>
        </IonCard>
        
        <IonToast
          isOpen={!!message}
          onDidDismiss={() => setMessage('')}
          message={message}
          duration={5000}
          color={isError ? 'danger' : 'success'}
          position="bottom"
        />
      </IonContent>
    </IonPage>
  );
};

export default ResetPassword;