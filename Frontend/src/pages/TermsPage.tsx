import {
  IonContent,
  IonPage,
  IonCard,
  IonCardContent
} from '@ionic/react';
import './TermsPage.css';
import BackHeaderComponent from '../components/BackHeaderComponent';

const TermsPage: React.FC = () => {
  return (
    <IonPage className="ghost-appear">
      <BackHeaderComponent title="Terms & Conditions" />
      
      <IonContent fullscreen>
        <div className="terms-container">
          <IonCard className="terms-card ghost-shadow">
            <IonCardContent>
              <h2>Terms and Conditions for GhostTalk</h2>
              
              <p className="last-updated">Last Updated: {new Date().toLocaleDateString()}</p>
              
              <section className="terms-section">
                <h3>1. Acceptance of Terms</h3>
                <p>
                  By accessing or using the GhostTalk application ("App"), you agree to comply with and be bound by these Terms and Conditions. 
                  If you do not agree to these Terms, please do not use our App.
                </p>
              </section>
              
              <section className="terms-section">
                <h3>2. Changes to Terms</h3>
                <p>
                  GhostTalk reserves the right to modify these Terms at any time. We will provide notice of any material changes through the App or by other means. 
                  Your continued use of GhostTalk after such modifications will constitute your acknowledgment and agreement to the modified terms.
                </p>
              </section>
              
              <section className="terms-section">
                <h3>3. User Conduct</h3>
                <p>
                  You agree not to use the App to:
                </p>
                <ul>
                  <li>Harass, abuse, or harm another person</li>
                  <li>Impersonate another user or person</li>
                  <li>Post or transmit any content that is illegal, harmful, threatening, abusive, or otherwise objectionable</li>
                  <li>Interfere with or disrupt the App or servers</li>
                  <li>Attempt to gain unauthorized access to any part of the App</li>
                </ul>
              </section>
              
              {/* Add more sections as needed */}
              
              <section className="terms-section">
                <h3>10. Contact Information</h3>
                <p>
                  If you have any questions about these Terms, please contact us at support@ghosttalk.com.
                </p>
              </section>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default TermsPage;