import {
  IonContent,
  IonPage,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonIcon,
  IonButton,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonGrid,
  IonRow,
  IonCol
} from '@ionic/react';
import {
  lockClosedOutline,
  eyeOutline,
  serverOutline,
  shieldOutline,
  globeOutline,
  timeOutline,
  alertCircleOutline,
  mailOutline
} from 'ionicons/icons';
import './PrivacyPage.css';
import BackHeaderComponent from '../components/BackHeaderComponent';

const PrivacyPage: React.FC = () => {
  return (
    <IonPage className="ghost-appear">
      <BackHeaderComponent title="Privacy Policy" />
      <IonContent fullscreen>
        <div className="privacy-container">
          <div className="privacy-header ghost-shadow">
            <div className="privacy-icon">
              <IonIcon icon={shieldOutline} />
            </div>
            <h1>Privacy Policy</h1>
            <p className="last-updated">Effective Date: {new Date().toLocaleDateString()}</p>
          </div>
          
          <div className="privacy-intro">
            <IonCard className="ghost-shadow">
              <IonCardContent>
                <p>
                  At GhostTalk, we believe privacy is a fundamental human right. Our mission is to provide 
                  secure, private communication while being transparent about how we handle your information.
                </p>
                <p>
                  This Privacy Policy explains our practices regarding the collection, use, and disclosure of your information 
                  when you use the GhostTalk application ("the App").
                </p>
              </IonCardContent>
            </IonCard>
          </div>
          
          <section id="quick-summary" className="privacy-section">
            <IonCard className="ghost-shadow">
              <IonCardHeader>
                <IonCardTitle>
                  <span className="section-icon">📋</span> Privacy at a Glance
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonGrid>
                  <IonRow>
                    <IonCol size="12" size-md="6">
                      <div className="privacy-summary-item">
                        <div className="summary-icon green">
                          <IonIcon icon={eyeOutline} />
                        </div>
                        <div>
                          <h3>Minimal Collection</h3>
                          <p>We only collect what's necessary for the app to function</p>
                        </div>
                      </div>
                    </IonCol>
                    <IonCol size="12" size-md="6">
                      <div className="privacy-summary-item">
                        <div className="summary-icon blue">
                          <IonIcon icon={lockClosedOutline} />
                        </div>
                        <div>
                          <h3>End-to-End Encryption</h3>
                          <p>Your messages are encrypted and can't be read by us</p>
                        </div>
                      </div>
                    </IonCol>
                  </IonRow>
                  <IonRow>
                    <IonCol size="12" size-md="6">
                      <div className="privacy-summary-item">
                        <div className="summary-icon purple">
                          <IonIcon icon={serverOutline} />
                        </div>
                        <div>
                          <h3>No Message Storage</h3>
                          <p>Messages are delivered, not stored on our servers</p>
                        </div>
                      </div>
                    </IonCol>
                    <IonCol size="12" size-md="6">
                      <div className="privacy-summary-item">
                        <div className="summary-icon orange">
                          <IonIcon icon={globeOutline} />
                        </div>
                        <div>
                          <h3>User Control</h3>
                          <p>You control your data and how it's shared</p>
                        </div>
                      </div>
                    </IonCol>
                  </IonRow>
                </IonGrid>
              </IonCardContent>
            </IonCard>
          </section>
          
          <section id="information-collected" className="privacy-section">
            <IonCard className="ghost-shadow">
              <IonCardHeader>
                <IonCardTitle>
                  <span className="section-icon">📊</span> Information We Collect
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <h3>Account Information</h3>
                <p>
                  To create a GhostTalk account, we collect:
                </p>
                <ul>
                  <li><strong>Email address</strong> - For account recovery only; never displayed to other users</li>
                  <li><strong>Username</strong> - Your chosen display name</li>
                  <li><strong>Password</strong> - Stored securely using industry-standard hashing</li>
                </ul>
                
                <h3>Message Content</h3>
                <p>
                  <IonBadge color="success">End-to-End Encrypted</IonBadge>
                </p>
                <p>
                  Message content is end-to-end encrypted and not accessible to GhostTalk. We cannot read your messages,
                  and they are only delivered to their intended recipients. Our servers temporarily process encrypted messages
                  for delivery but do not store them after delivery is complete.
                </p>
                
                <h3>Usage Information</h3>
                <p>
                  We collect limited usage data to improve app performance and user experience:
                </p>
                <ul>
                  <li><strong>Device information</strong> - Device type, operating system, and app version</li>
                  <li><strong>Connection information</strong> - IP address (temporarily stored)</li>
                  <li><strong>App usage statistics</strong> - Anonymous data about feature usage</li>
                </ul>
                
                <h3>Optional Information</h3>
                <p>
                  You may choose to provide additional information:
                </p>
                <ul>
                  <li><strong>Profile picture</strong> - An image you choose to represent yourself</li>
                  <li><strong>Status message</strong> - A short message visible to your contacts</li>
                </ul>
                
                <div className="privacy-callout">
                  <IonIcon icon={alertCircleOutline} />
                  <p>
                    GhostTalk has no access to your device contacts, location data, or browsing history unless 
                    you explicitly grant permission for specific features.
                  </p>
                </div>
              </IonCardContent>
            </IonCard>
          </section>
          
          <section id="information-usage" className="privacy-section">
            <IonCard className="ghost-shadow">
              <IonCardHeader>
                <IonCardTitle>
                  <span className="section-icon">🔍</span> How We Use Your Information
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <p>
                  We use the collected information solely for the following purposes:
                </p>
                
                <div className="usage-purpose">
                  <h3>Providing and Improving the Service</h3>
                  <ul>
                    <li>Creating and managing your account</li>
                    <li>Delivering messages to intended recipients</li>
                    <li>Maintaining and improving app performance</li>
                    <li>Troubleshooting technical issues</li>
                  </ul>
                </div>
                
                <div className="usage-purpose">
                  <h3>Security and Protection</h3>
                  <ul>
                    <li>Verifying your identity</li>
                    <li>Preventing fraud and unauthorized access</li>
                    <li>Ensuring compliance with our Terms of Service</li>
                    <li>Addressing harmful or illegal activity</li>
                  </ul>
                </div>
                
                <div className="usage-purpose">
                  <h3>Communication</h3>
                  <ul>
                    <li>Responding to your inquiries</li>
                    <li>Sending critical service announcements</li>
                    <li>Providing customer support</li>
                  </ul>
                </div>
                
                <div className="privacy-callout">
                  <IonIcon icon={alertCircleOutline} />
                  <p>
                    <strong>We do not:</strong> Sell your data to third parties, show targeted ads, or track your activity across 
                    other websites or applications.
                  </p>
                </div>
              </IonCardContent>
            </IonCard>
          </section>
          
          <section id="data-security" className="privacy-section">
            <IonCard className="ghost-shadow">
              <IonCardHeader>
                <IonCardTitle>
                  <span className="section-icon">🛡️</span> Data Security & Retention
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <h3>Security Measures</h3>
                <p>
                  We implement industry-standard security measures to protect your information:
                </p>
                <ul>
                  <li><strong>End-to-end encryption</strong> for all message content</li>
                  <li><strong>TLS/SSL encryption</strong> for all data in transit</li>
                  <li><strong>Secure password hashing</strong> using bcrypt with salt</li>
                  <li><strong>Regular security audits</strong> and vulnerability testing</li>
                  <li><strong>Physical access controls</strong> for our server infrastructure</li>
                </ul>
                
                <h3>Data Retention</h3>
                <div className="retention-table">
                  <div className="retention-row">
                    <div><strong>Account Information</strong></div>
                    <div>Retained while your account is active</div>
                  </div>
                  <div className="retention-row">
                    <div><strong>Message Content</strong></div>
                    <div>Not stored on our servers after delivery</div>
                  </div>
                  <div className="retention-row">
                    <div><strong>Usage Information</strong></div>
                    <div>Retained for up to 90 days</div>
                  </div>
                  <div className="retention-row">
                    <div><strong>IP Addresses</strong></div>
                    <div>Retained for up to 7 days</div>
                  </div>
                </div>
                
                <h3>Data Deletion</h3>
                <p>
                  You can delete your account at any time from the app Settings menu. When you delete your account:
                </p>
                <ul>
                  <li>Your profile and account information are permanently removed</li>
                  <li>Your username becomes available for others to use</li>
                  <li>Your message history is deleted from your device (and other devices if you choose)</li>
                </ul>
                <p>
                  Note that messages you've sent to others will remain on their devices until they delete them.
                </p>
                
                <div className="privacy-callout">
                  <IonIcon icon={timeOutline} />
                  <p>
                    We retain certain anonymized analytical data even after account deletion for service improvement purposes,
                    but this cannot be linked back to your identity.
                  </p>
                </div>
              </IonCardContent>
            </IonCard>
          </section>
          
          <section id="third-parties" className="privacy-section">
            <IonCard className="ghost-shadow">
              <IonCardHeader>
                <IonCardTitle>
                  <span className="section-icon">🔄</span> Third Parties & Data Sharing
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <p>
                  We limit sharing your information with third parties to the following circumstances:
                </p>
                
                <h3>Service Providers</h3>
                <p>
                  We work with third-party service providers who perform services on our behalf, such as:
                </p>
                <ul>
                  <li>Cloud hosting and storage services</li>
                  <li>Analytics tools that help us improve the app</li>
                  <li>Customer support platforms</li>
                </ul>
                <p>
                  These service providers are contractually obligated to use your information solely for providing 
                  services to us and in accordance with our Privacy Policy.
                </p>
                
                <h3>Legal Requirements</h3>
                <p>
                  We may disclose information if required by law, regulation, legal process, or governmental request. 
                  However, due to our end-to-end encryption, we cannot access the content of your messages even if 
                  requested by authorities.
                </p>
                
                <h3>Business Transfers</h3>
                <p>
                  If GhostTalk is involved in a merger, acquisition, or sale of assets, your information may be 
                  transferred as part of that transaction. We will notify you via in-app notification and provide 
                  options regarding your information.
                </p>
                
                <div className="privacy-callout">
                  <IonIcon icon={alertCircleOutline} />
                  <p>
                    <strong>Important:</strong> We do not sell, rent, or trade your personal information to third parties 
                    for marketing purposes under any circumstances.
                  </p>
                </div>
              </IonCardContent>
            </IonCard>
          </section>
          
          <section id="your-rights" className="privacy-section">
            <IonCard className="ghost-shadow">
              <IonCardHeader>
                <IonCardTitle>
                  <span className="section-icon">⚖️</span> Your Rights & Choices
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <p>
                  You have several rights regarding your personal information:
                </p>
                
                <div className="rights-grid">
                  <div className="rights-item">
                    <h3>Access</h3>
                    <p>You can access your account information through the app's profile settings.</p>
                  </div>
                  <div className="rights-item">
                    <h3>Correction</h3>
                    <p>You can update your account information at any time.</p>
                  </div>
                  <div className="rights-item">
                    <h3>Deletion</h3>
                    <p>You can delete your account and associated data from the settings menu.</p>
                  </div>
                  <div className="rights-item">
                    <h3>Data Portability</h3>
                    <p>You can export your data in a machine-readable format.</p>
                  </div>
                </div>
                
                <h3>App Permissions</h3>
                <p>
                  GhostTalk requests only the permissions necessary for operation. You can modify these permissions
                  in your device settings:
                </p>
                <ul>
                  <li><strong>Camera</strong> - Required only for taking profile photos or sending images</li>
                  <li><strong>Microphone</strong> - Required only for voice messaging</li>
                  <li><strong>Storage</strong> - Required for saving media files</li>
                  <li><strong>Notifications</strong> - Required for receiving message alerts</li>
                </ul>
                
                <h3>Communication Preferences</h3>
                <p>
                  You can manage your notification preferences within the app settings.
                </p>
              </IonCardContent>
            </IonCard>
          </section>
          
          <section id="children" className="privacy-section">
            <IonCard className="ghost-shadow">
              <IonCardHeader>
                <IonCardTitle>
                  <span className="section-icon">👪</span> Children's Privacy
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <p>
                  GhostTalk is not intended for children under the age of 13. We do not knowingly collect 
                  personal information from children under 13. If we become aware that we have collected 
                  personal information from a child under 13, we will take steps to delete that information.
                </p>
                <p>
                  If you are a parent or guardian and believe your child has provided us with personal 
                  information without your consent, please contact us at privacy@ghosttalk.com.
                </p>
              </IonCardContent>
            </IonCard>
          </section>
          
          <section id="changes" className="privacy-section">
            <IonCard className="ghost-shadow">
              <IonCardHeader>
                <IonCardTitle>
                  <span className="section-icon">🔄</span> Changes to This Privacy Policy
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <p>
                  We may update this Privacy Policy from time to time. We will notify you of any changes 
                  by posting the new Privacy Policy on this page and updating the "Effective Date" at the top.
                </p>
                <p>
                  For significant changes, we will provide a more prominent notice, such as an in-app 
                  notification or email. We encourage you to review this Privacy Policy periodically 
                  for any changes.
                </p>
              </IonCardContent>
            </IonCard>
          </section>
          
          <section id="contact" className="privacy-section">
            <IonCard className="ghost-shadow">
              <IonCardHeader>
                <IonCardTitle>
                  <span className="section-icon">✉️</span> Contact Us
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <p>
                  If you have any questions or concerns about this Privacy Policy, please contact us:
                </p>
                <div className="contact-method">
                  <IonIcon icon={mailOutline} />
                  <div>
                    <strong>Email:</strong> privacy@ghosttalk.com
                  </div>
                </div>
                <IonButton expand="block" href="mailto:privacy@ghosttalk.com" className="contact-button">
                  <IonIcon icon={mailOutline} slot="start" />
                  Contact Privacy Team
                </IonButton>
              </IonCardContent>
            </IonCard>
          </section>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default PrivacyPage;