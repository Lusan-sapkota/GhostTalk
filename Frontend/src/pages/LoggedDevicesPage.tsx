import React, { useState, useEffect } from 'react';
import {
  IonPage, IonContent, IonList, IonItem, IonLabel, IonButton,
  IonIcon, IonAlert, IonBadge, IonSkeletonText
} from '@ionic/react';
import { 
  phonePortraitOutline, laptopOutline, desktopOutline, tabletPortraitOutline,
  closeCircleOutline, locationOutline, timeOutline, globeOutline
} from 'ionicons/icons';
import BackHeaderComponent from '../components/BackHeaderComponent';
import { apiService } from '../services/api.service';
import './LoggedDevices.css';

interface Device {
  id: string;
  name: string;
  type: string;
  ip: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
  browser: string;
  os: string;
}

const LoggedDevicesPage: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAlert, setShowAlert] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getLoggedDevices();
      if (response.success) {
        setDevices(response.devices);
      }
    } catch (error) {
      console.error('Error loading devices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoutDevice = async (deviceId: string) => {
    try {
      const response = await apiService.logoutDevice(deviceId);
      if (response.success) {
        setDevices(prevDevices => prevDevices.filter(d => d.id !== deviceId));
      }
    } catch (error) {
      console.error('Error logging out device:', error);
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'mobile': return phonePortraitOutline;
      case 'tablet': return tabletPortraitOutline;
      case 'laptop': return laptopOutline;
      default: return desktopOutline;
    }
  };

  return (
    <IonPage>
      <BackHeaderComponent title="Logged In Devices" />
      
      <IonContent className="ion-padding">
        <h4 className="gt-device-section-title">Active Sessions</h4>
        <p className="gt-device-section-description">
          These are the devices where your account is currently logged in.
        </p>
        
        {isLoading ? (
          <div className="gt-device-skeleton-container">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="gt-device-skeleton-item">
                <div className="gt-device-skeleton-icon"></div>
                <div className="gt-device-skeleton-content">
                  <IonSkeletonText animated style={{ width: '60%', height: '16px' }}></IonSkeletonText>
                  <IonSkeletonText animated style={{ width: '80%', height: '14px' }}></IonSkeletonText>
                  <IonSkeletonText animated style={{ width: '40%', height: '14px' }}></IonSkeletonText>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <IonList className="gt-device-list">
            {devices.map(device => (
              <IonItem key={device.id} className="gt-device-item" lines="none">
                <div className="gt-device-icon-container">
                  <IonIcon icon={getDeviceIcon(device.type)} />
                </div>
                <IonLabel>
                  <div className="gt-device-header">
                    <h2>{device.name}</h2>
                    {device.isCurrent && (
                      <IonBadge color="success" className="gt-device-current-badge">Current</IonBadge>
                    )}
                  </div>
                  <p className="gt-device-detail">
                    <IonIcon icon={globeOutline} />
                    {device.browser} • {device.os}
                  </p>
                  <p className="gt-device-detail">
                    <IonIcon icon={locationOutline} />
                    {device.location}
                  </p>
                  <p className="gt-device-detail">
                    <IonIcon icon={timeOutline} />
                    Last active: {device.lastActive}
                  </p>
                </IonLabel>
                {!device.isCurrent && (
                  <IonButton 
                    fill="clear" 
                    color="danger"
                    onClick={() => {
                      setSelectedDevice(device);
                      setShowAlert(true);
                    }}
                  >
                    <IonIcon slot="icon-only" icon={closeCircleOutline} />
                  </IonButton>
                )}
              </IonItem>
            ))}
          </IonList>
        )}
        
        {devices.length === 0 && !isLoading && (
          <div className="gt-device-empty-state">
            <IonIcon icon={phonePortraitOutline} />
            <h4>No other devices</h4>
            <p>Your account is only logged in on this device.</p>
          </div>
        )}
        
        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header="Logout Device"
          message={`Are you sure you want to log out from ${selectedDevice?.name}?`}
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel'
            },
            {
              text: 'Logout',
              handler: () => {
                if (selectedDevice) {
                  handleLogoutDevice(selectedDevice.id);
                }
              }
            }
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default LoggedDevicesPage;