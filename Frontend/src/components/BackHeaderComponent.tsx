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
import './BackHeaderComponent.css';

interface BackHeaderComponentProps {
  title: string;
  isModal?: boolean;
  onBack?: () => void;
  showSearch?: boolean;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
}

const BackHeaderComponent: React.FC<BackHeaderComponentProps> = ({ 
  title, 
  isModal = false,
  onBack,
  showSearch = false,
  searchPlaceholder = "Search...",
  onSearchChange
}) => {
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchText, setSearchText] = useState('');

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
                <IonButton onClick={onBack} className="back-button">
                  <IonIcon icon={arrowBack} slot="icon-only" />
                </IonButton>
              ) : (
                <IonBackButton defaultHref="/" />
              )}
            </IonButtons>
            <IonTitle className="back-header-title">{title}</IonTitle>
            {showSearch && (
              <IonButtons slot="end">
                <IonButton onClick={toggleSearch} className="search-button">
                  <IonIcon slot="icon-only" icon={search} />
                </IonButton>
              </IonButtons>
            )}
          </>
        )}
      </IonToolbar>
    </IonHeader>
  );
};

export default BackHeaderComponent;