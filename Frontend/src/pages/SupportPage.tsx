import {
  IonContent,
  IonPage,
  IonCard,
  IonCardContent,
  IonItem,
  IonLabel,
  IonList,
  IonIcon,
  IonButton,
  IonAccordion,
  IonAccordionGroup
} from '@ionic/react';
import { 
  helpCircle, 
  chatbubble, 
  mail,
  documentText,
  arrowForward
} from 'ionicons/icons';
import './SupportPage.css';
import BackHeaderComponent from '../components/BackHeaderComponent';

const SupportPage: React.FC = () => {
  return (
    <IonPage className="ghost-appear">
      <BackHeaderComponent title="Help & Support" />
      
      <IonContent fullscreen>
        <div className="support-container">
          <h2 className="ghost-pulse">How can we help you?</h2>

          <section className="support-options">
            <IonCard className="support-card ghost-shadow">
              <IonCardContent>
                <div className="support-icon ghost-float">
                  <IonIcon icon={mail} />
                </div>
                <h3>Contact Support</h3>
                <p>
                  Reach out to our support team for personalized assistance with any issues you're experiencing.
                </p>
                <IonButton expand="block" href="/contact">
                  Contact us 
                  <IonIcon slot="end" icon={arrowForward} />
                </IonButton>
              </IonCardContent>
            </IonCard>

            <IonCard className="support-card ghost-shadow">
              <IonCardContent>
                <div className="support-icon ghost-float">
                  <IonIcon icon={documentText} />
                </div>
                <h3>Documentation</h3>
                <p>
                  Browse our detailed documentation to learn more about GhostTalk's features and how to use them.
                </p>
                <IonButton expand="block" routerLink="/docs">
                  View Docs
                  <IonIcon slot="end" icon={arrowForward} />
                </IonButton>
              </IonCardContent>
            </IonCard>

            <IonCard className="support-card ghost-shadow">
              <IonCardContent>
                <div className="support-icon ghost-float">
                  <IonIcon icon={chatbubble} />
                </div>
                <h3>Community</h3>
                <p>
                  Join our community forums to discuss with other users and get advice.
                </p>
                <IonButton expand="block" routerLink="/community">
                  Join Community
                  <IonIcon slot="end" icon={arrowForward} />
                </IonButton>
              </IonCardContent>
            </IonCard>
          </section>

          <h3 className="faq-title">Frequently Asked Questions</h3>

          <IonAccordionGroup className="faq-section ghost-shadow">
            <IonAccordion value="first">
              <IonItem slot="header" color="light">
                <IonIcon icon={helpCircle} slot="start" />
                <IonLabel>How do I start a random chat?</IonLabel>
              </IonItem>
              <div className="ion-padding" slot="content">
                <p>
                  To start a random chat, navigate to the "Random Chat" tab and tap the "Start Random Chat" button. 
                  You'll be connected with a random user from around the world instantly.
                </p>
              </div>
            </IonAccordion>

            <IonAccordion value="second">
              <IonItem slot="header" color="light">
                <IonIcon icon={helpCircle} slot="start" />
                <IonLabel>How do I create a chat room?</IonLabel>
              </IonItem>
              <div className="ion-padding" slot="content">
                <p>
                  Go to the "Chat Rooms" tab and tap the "+" button in the bottom right corner. 
                  Fill out the room details form and tap "Create Room".
                </p>
              </div>
            </IonAccordion>

            <IonAccordion value="third">
              <IonItem slot="header" color="light">
                <IonIcon icon={helpCircle} slot="start" />
                <IonLabel>Is my data private?</IonLabel>
              </IonItem>
              <div className="ion-padding" slot="content">
                <p>
                  Yes, GhostTalk takes your privacy seriously. Your chats are encrypted and we collect minimal information.
                  See our <a href="/privacy">Privacy Policy</a> for more details.
                </p>
              </div>
            </IonAccordion>

            <IonAccordion value="fourth">
              <IonItem slot="header" color="light">
                <IonIcon icon={helpCircle} slot="start" />
                <IonLabel>How do I report inappropriate behavior?</IonLabel>
              </IonItem>
              <div className="ion-padding" slot="content">
                <p>
                  If you encounter inappropriate behavior, tap the "More" button in the chat and select "Report User".
                  Our moderation team will review your report promptly.
                </p>
              </div>
            </IonAccordion>
          </IonAccordionGroup>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default SupportPage;