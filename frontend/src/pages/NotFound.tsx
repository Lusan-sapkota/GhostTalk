import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton
} from '@ionic/react';
import { useHistory } from 'react-router';

const NotFound: React.FC = () => {
  const history = useHistory();
  
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Page Not Found</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="ion-text-center">
          <h2>404</h2>
          <p>The page you're looking for doesn't exist.</p>
          <IonButton onClick={() => history.push('/home')}>
            Go to Home
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default NotFound;