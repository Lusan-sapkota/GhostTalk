import React, { useState } from 'react';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonBackButton,
  IonSearchbar
} from '@ionic/react';
import { search, arrowBack } from 'ionicons/icons';
import { useAuth } from '../contexts/AuthContext';
import './BackHeaderComponent.css';

interface BackHeaderComponentProps {
  title: string;
  isModal?: boolean;
  onBack?: () => void;
  showSearch?: boolean;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  defaultHref?: string;
}

const BackHeaderComponent: React.FC<BackHeaderComponentProps> = ({ 
  title, 
  isModal = false,
  onBack,
  showSearch = false,
  searchPlaceholder = "Search...",
  onSearchChange,
  defaultHref = "/"
}) => {
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const { isAuthenticated } = useAuth();

  const toggleSearch = () => {
    setIsSearchVisible(!isSearchVisible);
    if (isSearchVisible && searchText) {
      setSearchText('');
      if (onSearchChange) onSearchChange('');
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchText(value);
    if (onSearchChange) onSearchChange(value);
  };

  const handleBack = () => {
    // If custom back handler is provided, use it
    if (onBack) {
      onBack();
    } else {
      // Otherwise use default back behavior
      window.history.back();
    }
  };

  return (
    <IonHeader className="back-header">
      <IonToolbar color="primary">
        {isSearchVisible ? (
          <IonSearchbar
            value={searchText}
            onIonChange={(e) => handleSearchChange(e.detail.value || '')}
            placeholder={searchPlaceholder}
            showCancelButton="always"
            onIonCancel={toggleSearch}
            animated
            className="back-header-searchbar"
            debounce={300}
          />
        ) : (
          <>
            <IonButtons slot="start">
              {isModal ? (
                <IonButton onClick={handleBack} className="back-button">
                  <IonIcon icon={arrowBack} slot="icon-only" />
                </IonButton>
              ) : (
                <IonBackButton defaultHref={defaultHref} />
              )}
            </IonButtons>
            <IonTitle className="back-header-title">{title}</IonTitle>
            <IonButtons slot="end">
              {showSearch && (
                <IonButton onClick={toggleSearch} className="search-button">
                  <IonIcon slot="icon-only" icon={search} />
                </IonButton>
              )}
            </IonButtons>
          </>
        )}
      </IonToolbar>
    </IonHeader>
  );
};

export default BackHeaderComponent;