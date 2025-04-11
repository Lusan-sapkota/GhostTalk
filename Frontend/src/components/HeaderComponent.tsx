import React, { useState } from 'react';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonMenuButton,
  IonSearchbar,
  IonBadge
} from '@ionic/react';
import { search, notifications, notificationsOutline, bookmarkOutline } from 'ionicons/icons';
import { useAuth } from '../contexts/AuthContext';
import './HeaderComponent.css';

interface HeaderComponentProps {
  title: string;
  showSearch?: boolean;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
}

const HeaderComponent: React.FC<HeaderComponentProps> = ({ 
  title, 
  showSearch = true, 
  onSearchChange,
  searchPlaceholder = "Search..."
}) => {
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const { isAuthenticated } = useAuth();
  const [hasNotifications] = useState(false); // This would be connected to a notification service in a real app

  const toggleSearch = () => {
    setIsSearchVisible(!isSearchVisible);
    if (isSearchVisible && searchText) {
      setSearchText('');
      if (onSearchChange) {
        onSearchChange('');
      }
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchText(value);
    if (onSearchChange) {
      onSearchChange(value);
    }
  };

  return (
    <IonHeader className="ghost-header">
      <IonToolbar color="primary">
        {isSearchVisible ? (
          <IonSearchbar
            value={searchText}
            onIonChange={(e) => handleSearchChange(e.detail.value || '')}
            placeholder={searchPlaceholder}
            showCancelButton="always"
            onIonCancel={toggleSearch}
            animated
            className="header-searchbar"
            debounce={300}
          />
        ) : (
          <>
            <IonButtons slot="start">
              <IonMenuButton />
            </IonButtons>
            <IonTitle className="header-title">{title}</IonTitle>
            <IonButtons slot="end">
              {showSearch && (
                <IonButton onClick={toggleSearch}>
                  <IonIcon slot="icon-only" icon={search} />
                </IonButton>
              )}
              {isAuthenticated && (
                <>
                  <IonButton className="favorite-button" routerLink="/favorites">
                    <IonIcon slot="icon-only" icon={bookmarkOutline} />
                  </IonButton>
                  <IonButton className="notification-button" routerLink="/notifications">
                    <IonIcon slot="icon-only" icon={hasNotifications ? notifications : notificationsOutline} />
                    {hasNotifications && <IonBadge className="notification-badge">3</IonBadge>}
                  </IonButton>
                </>
              )}
            </IonButtons>
          </>
        )}
      </IonToolbar>
    </IonHeader>
  );
};

export default HeaderComponent;