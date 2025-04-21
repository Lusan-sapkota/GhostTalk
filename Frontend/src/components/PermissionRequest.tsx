import React, { useState, useEffect } from 'react';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonButton,
  IonIcon,
  IonText,
  IonSpinner
} from '@ionic/react';
import { 
  cameraOutline, 
  micOutline, 
  notificationsOutline, 
  documentOutline,
  checkmarkCircleOutline,
  closeCircleOutline
} from 'ionicons/icons';
import { AppPermission, permissionService } from '../services/permissionService';
import './PermissionRequest.css';

interface PermissionRequestProps {
  permission: AppPermission;
  onResult?: (granted: boolean) => void;
  showSkip?: boolean;
}

const PermissionRequest: React.FC<PermissionRequestProps> = ({ 
  permission, 
  onResult, 
  showSkip = true 
}) => {
  const [isGranted, setIsGranted] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    // Check current status on mount
    const checkStatus = async () => {
      const status = await permissionService.checkPermission(permission);
      setIsGranted(status);
    };
    
    checkStatus();
  }, [permission]);
  
  const getPermissionIcon = () => {
    switch (permission) {
      case 'camera': return cameraOutline;
      case 'microphone': return micOutline;
      case 'notifications': return notificationsOutline;
      case 'storage': return documentOutline;
      default: return undefined;
    }
  };
  
  const handleRequestPermission = async () => {
    setIsLoading(true);
    const granted = await permissionService.requestPermission(permission);
    setIsGranted(granted);
    if (onResult) onResult(granted);
    setIsLoading(false);
  };
  
  const handleSkip = () => {
    if (onResult) onResult(false);
  };
  
  return (
    <IonCard className="permission-request-card">
      <IonCardHeader>
        <div className="permission-header">
          <div className="permission-icon">
            <IonIcon icon={getPermissionIcon()} />
          </div>
          <IonCardTitle>
            {permission.charAt(0).toUpperCase() + permission.slice(1)} Access
          </IonCardTitle>
        </div>
      </IonCardHeader>
      
      <IonCardContent>
        <p className="permission-description">
          {permissionService.getPermissionDescription(permission)}
        </p>
        
        {isGranted !== null && (
          <div className="permission-status">
            <IonIcon 
              icon={isGranted ? checkmarkCircleOutline : closeCircleOutline} 
              color={isGranted ? "success" : "danger"} 
            />
            <IonText color={isGranted ? "success" : "danger"}>
              {isGranted ? "Permission granted" : "Permission not granted"}
            </IonText>
          </div>
        )}
        
        <div className="permission-actions">
          {!isGranted && (
            <IonButton
              expand="block"
              onClick={handleRequestPermission}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <IonSpinner name="dots" />
                  <span className="ion-padding-start">Requesting...</span>
                </>
              ) : (
                'Allow Access'
              )}
            </IonButton>
          )}
          
          {!isGranted && showSkip && (
            <IonButton
              expand="block"
              fill="clear"
              onClick={handleSkip}
              disabled={isLoading}
            >
              Skip for now
            </IonButton>
          )}
        </div>
      </IonCardContent>
    </IonCard>
  );
};

export default PermissionRequest;