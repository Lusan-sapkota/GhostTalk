import {
  IonContent,
  IonPage,
  IonCard,
  IonCardContent
} from '@ionic/react';
import './PrivacyPage.css';
import BackHeaderComponent from '../components/BackHeaderComponent';

const PrivacyPage: React.FC = () => {
  return (
    <IonPage className="ghost-appear">
      <BackHeaderComponent title="Privacy Policy" />
      
      <IonContent fullscreen>
        <div className="privacy-container">
          <IonCard className="privacy-card ghost-shadow">
            <IonCardContent>
              <h2>Privacy Policy for GhostTalk</h2>
              
              <p className="last-updated">Last Updated: {new Date().toLocaleDateString()}</p>
              
              <section className="privacy-section">
                <h3>1. Information We Collect</h3>
                <p>
                  GhostTalk collects minimal information necessary to provide our services. This may include:
                </p>
                <ul>
                  <li>Email address (for account creation)</li>
                  <li>Username and optional profile information</li>
                  <li>Chat messages and content you choose to send</li>
                  <li>Device information and app usage data</li>
                </ul>
              </section>
              
              <section className="privacy-section">
                <h3>2. How We Use Your Information</h3>
                <p>
                  We use the collected information to:
                </p>
                <ul>
                  <li>Provide and maintain our services</li>
                  <li>Improve and personalize user experience</li>
                  <li>Communicate with you about app updates</li>
                  <li>Ensure security and prevent misuse</li>
                </ul>
              </section>
              
              <section className="privacy-section">
                <h3>3. Data Security</h3>
                <p>
                  We implement appropriate security measures to protect your personal information. 
                  However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
                </p>
              </section>
              
              {/* Add more sections as needed */}
              
              <section className="privacy-section">
                <h3>8. Contact Us</h3>
                <p>
                  If you have questions about this Privacy Policy, please contact us at privacy@ghosttalk.com.
                </p>
              </section>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default PrivacyPage;