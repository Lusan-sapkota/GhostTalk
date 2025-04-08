import React from 'react';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonBackButton
} from '@ionic/react';
import { arrowBack, ellipsisVertical } from 'ionicons/icons';
import './BackHeaderComponent.css';

interface BackHeaderComponentProps {
  title: string;
  defaultHref?: string;
  showOptions?: boolean;
  onOptionsClick?: () => void;
  onBack?: () => void; // Added for modal support
  isModal?: boolean; // Flag to identify if it's being used in a modal
  children?: React.ReactNode; // Added to support children components
}

const BackHeaderComponent: React.FC<BackHeaderComponentProps> = ({
  title,
  defaultHref = '/home',
  showOptions = false,
  onOptionsClick,
  onBack,
  isModal = false,
  children
}) => {
  return (
    <IonHeader className="back-header ion-no-border">
      <IonToolbar color="primary" className="ghost-shadow">
        <IonButtons slot="start">
          {isModal ? (
            // Use a regular button for modals with custom back action
            <IonButton onClick={onBack} className="modal-back-button ghost-fade-in">
              <IonIcon icon={arrowBack} slot="icon-only" />
            </IonButton>
          ) : (
            // Use IonBackButton for regular navigation
            <IonBackButton defaultHref={defaultHref} className="back-button ghost-fade-in" />
          )}
        </IonButtons>
        <IonTitle className="header-title">{title}</IonTitle>
        {showOptions && (
          <IonButtons slot="end">
            <IonButton onClick={onOptionsClick} className="ghost-wiggle">
              <IonIcon slot="icon-only" icon={ellipsisVertical} />
            </IonButton>
          </IonButtons>
        )}
        {children && (
          <IonButtons slot="end">
            {children}
          </IonButtons>
        )}
      </IonToolbar>
    </IonHeader>
  );
};

export default BackHeaderComponent;