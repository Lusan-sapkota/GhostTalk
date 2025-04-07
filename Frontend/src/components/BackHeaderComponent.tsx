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
import { ellipsisVertical } from 'ionicons/icons';
import './BackHeaderComponent.css';

interface BackHeaderComponentProps {
  title: string;
  defaultHref?: string;
  showOptions?: boolean;
  onOptionsClick?: () => void;
}

const BackHeaderComponent: React.FC<BackHeaderComponentProps> = ({
  title,
  defaultHref = '/home',
  showOptions = false,
  onOptionsClick
}) => {
  return (
    <IonHeader className="back-header ion-no-border">
      <IonToolbar color="primary" className="ghost-shadow">
        <IonButtons slot="start">
          <IonBackButton defaultHref={defaultHref} className="back-button ghost-fade-in" />
        </IonButtons>
        <IonTitle className="header-title">{title}</IonTitle>
        {showOptions && (
          <IonButtons slot="end">
            <IonButton onClick={onOptionsClick} className="ghost-wiggle">
              <IonIcon slot="icon-only" icon={ellipsisVertical} />
            </IonButton>
          </IonButtons>
        )}
      </IonToolbar>
    </IonHeader>
  );
};

export default BackHeaderComponent;