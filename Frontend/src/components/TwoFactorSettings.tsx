import React, { useState, useEffect } from 'react';
import {
  IonItem,
  IonLabel,
  IonToggle,
  IonLoading,
  IonAlert,
  IonButton
} from '@ionic/react';
import { apiService } from '../services/api.service';

const TwoFactorSettings: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingState, setPendingState] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.makeRequest('/auth/settings/2fa/status', 'GET');
      
      if (response.success) {
        setIsEnabled(response.enabled);
      } else {
        setError('Failed to load 2FA settings');
      }
    } catch (error) {
      console.error('Error loading 2FA settings:', error);
      setError('Error loading settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleChange = (checked: boolean) => {
    setPendingState(checked);
    setShowConfirm(true);
  };

  const confirmChange = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.makeRequest('/auth/settings/2fa', 'POST', {
        enabled: pendingState
      });
      
      if (response.success) {
        setIsEnabled(pendingState);
      } else {
        setError(response.message || 'Failed to update 2FA settings');
      }
    } catch (error) {
      console.error('Error updating 2FA settings:', error);
      setError('Error updating settings');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <IonLoading isOpen={isLoading} message="Loading settings..." />
      
      <IonItem>
        <IonLabel>
          <h2>Two-Factor Authentication</h2>
          <p>Add an extra layer of security to your account</p>
        </IonLabel>
        <IonToggle 
          checked={isEnabled} 
          onIonChange={e => handleToggleChange(e.detail.checked)}
        />
      </IonItem>
      
      <IonAlert
        isOpen={showConfirm}
        onDidDismiss={() => setShowConfirm(false)}
        header={pendingState ? 'Enable 2FA' : 'Disable 2FA'}
        message={pendingState 
          ? 'When enabled, you will need to enter a verification code sent to your email each time you log in. Continue?' 
          : 'Are you sure you want to disable two-factor authentication? This will reduce the security of your account.'}
        buttons={[
          {
            text: 'Cancel',
            role: 'cancel'
          },
          {
            text: 'Confirm',
            handler: confirmChange
          }
        ]}
      />
      
      <IonAlert
        isOpen={!!error}
        onDidDismiss={() => setError('')}
        header="Error"
        message={error}
        buttons={['OK']}
      />
    </>
  );
};

export default TwoFactorSettings;