import React from 'react';
import { IonRefresher, IonRefresherContent, isPlatform } from '@ionic/react';
import { RefresherEventDetail } from '@ionic/core';
import './PullToRefresh.css';
import { refreshOutline } from 'ionicons/icons';
import { Capacitor } from '@capacitor/core';

interface PullToRefreshProps {
  onRefresh?: (event: CustomEvent<RefresherEventDetail>) => void;
  pullingText?: string;
  refreshingSpinner?: 'bubbles' | 'circles' | 'circular' | 'crescent' | 'dots' | 'lines' | 'lines-small' | null;
  refreshingText?: string;
  fullPageRefresh?: boolean;
}

const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  pullingText = 'Pull to refresh',
  refreshingSpinner = 'dots',
  refreshingText = 'Refreshing...',
  fullPageRefresh = true
}) => {
  // Only show on Android native app
  const isNativeAndroid = isPlatform('android') && Capacitor.isNativePlatform();
  if (!isNativeAndroid) {
    return null;
  }
  
  const handleRefresh = (event: CustomEvent<RefresherEventDetail>) => {
    if (fullPageRefresh) {
      // Show refreshing state for a brief moment
      setTimeout(() => {
        try {
          // Try to use window.location.reload() first
          window.location.reload();
        } catch (e) {
          console.error('Reload failed, using fallback path', e);
          // Fall back to direct path loading if reload doesn't work
          window.location.href = 'file:///android_asset/public/index.html';
        }
      }, 500);
    } else if (onRefresh) {
      onRefresh(event);
    } else {
      event.detail.complete();
    }
  };

  return (
    <IonRefresher slot="fixed" onIonRefresh={handleRefresh} className="ghost-refresher">
      <IonRefresherContent
        pullingIcon={refreshOutline}
        pullingText={pullingText}
        refreshingSpinner={refreshingSpinner}
        refreshingText={refreshingText}>
      </IonRefresherContent>
    </IonRefresher>
  );
};

export default PullToRefresh;