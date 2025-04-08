import {
  IonContent,
  IonPage,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonIcon,
  IonButton,
  IonAccordion,
  IonAccordionGroup,
  IonItem,
  IonLabel,
  IonList,
  IonThumbnail,
  IonBadge
} from '@ionic/react';
import {
  chatbubbleOutline,
  peopleOutline,
  lockClosedOutline,
  cogOutline,
  notificationsOutline,
  personOutline,
  searchOutline,
  helpCircleOutline,
  caretDownOutline
} from 'ionicons/icons';
import './DocsPage.css';
import BackHeaderComponent from '../components/BackHeaderComponent';

const DocsPage: React.FC = () => {
  return (
    <IonPage className="ghost-appear">
      <BackHeaderComponent title="Documentation" />
      <IonContent fullscreen>
        <div className="docs-container">
          <div className="docs-header">
            <h1>GhostTalk Documentation</h1>
            <p className="docs-subtitle">Everything you need to know about using GhostTalk securely and effectively</p>
          </div>

          <div className="docs-toc">
            <IonCard className="ghost-shadow">
              <IonCardHeader>
                <IonCardTitle>Table of Contents</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonList lines="none">
                  <IonItem button detail href="#getting-started">
                    <IonIcon slot="start" icon={personOutline} color="primary" />
                    <IonLabel>Getting Started</IonLabel>
                  </IonItem>
                  <IonItem button detail href="#messaging">
                    <IonIcon slot="start" icon={chatbubbleOutline} color="primary" />
                    <IonLabel>Messaging</IonLabel>
                  </IonItem>
                  <IonItem button detail href="#chat-rooms">
                    <IonIcon slot="start" icon={peopleOutline} color="primary" />
                    <IonLabel>Chat Rooms</IonLabel>
                  </IonItem>
                  <IonItem button detail href="#privacy-security">
                    <IonIcon slot="start" icon={lockClosedOutline} color="primary" />
                    <IonLabel>Privacy & Security</IonLabel>
                  </IonItem>
                  <IonItem button detail href="#settings">
                    <IonIcon slot="start" icon={cogOutline} color="primary" />
                    <IonLabel>Settings & Preferences</IonLabel>
                  </IonItem>
                  <IonItem button detail href="#troubleshooting">
                    <IonIcon slot="start" icon={helpCircleOutline} color="primary" />
                    <IonLabel>Troubleshooting</IonLabel>
                  </IonItem>
                </IonList>
              </IonCardContent>
            </IonCard>
          </div>

          <section id="getting-started" className="docs-section">
            <IonCard className="ghost-shadow">
              <IonCardHeader>
                <div className="section-header">
                  <IonIcon icon={personOutline} color="primary" />
                  <IonCardTitle>Getting Started</IonCardTitle>
                </div>
              </IonCardHeader>
              <IonCardContent>
                <h3>Creating Your Account</h3>
                <p>
                  To start using GhostTalk, you'll need to create an account. We've designed the process to be quick while maintaining your privacy.
                </p>
                <ol>
                  <li>Download the GhostTalk app from your app store</li>
                  <li>Open the app and tap "Register"</li>
                  <li>Enter your email address (used only for account recovery)</li>
                  <li>Create a unique username and strong password</li>
                  <li>Accept the Terms & Conditions and Privacy Policy</li>
                  <li>Tap "Create Account"</li>
                </ol>

                <h3>Setting Up Your Profile</h3>
                <p>
                  Your profile is minimal by design, putting privacy first:
                </p>
                <ul>
                  <li>Add an optional display name</li>
                  <li>Choose a profile avatar or ghost icon</li>
                  <li>Set your visibility preferences</li>
                </ul>

                <div className="docs-tip">
                  <IonIcon icon={helpCircleOutline} />
                  <div>
                    <strong>Tip:</strong> Using a pseudonymous display name rather than your real name enhances your privacy on GhostTalk.
                  </div>
                </div>
              </IonCardContent>
            </IonCard>
          </section>

          <section id="messaging" className="docs-section">
            <IonCard className="ghost-shadow">
              <IonCardHeader>
                <div className="section-header">
                  <IonIcon icon={chatbubbleOutline} color="primary" />
                  <IonCardTitle>Messaging</IonCardTitle>
                </div>
              </IonCardHeader>
              <IonCardContent>
                <h3>Starting a Conversation</h3>
                <p>
                  GhostTalk offers secure, end-to-end encrypted messaging to keep your conversations private.
                </p>
                <ol>
                  <li>Navigate to the "Chats" tab in the app</li>
                  <li>Tap the "+" button to start a new conversation</li>
                  <li>Enter a username or select from your contacts</li>
                  <li>Begin typing your message</li>
                </ol>

                <h3>Message Features</h3>
                <div className="feature-grid">
                  <div className="feature-item">
                    <IonBadge color="success">Encryption</IonBadge>
                    <p>All messages are end-to-end encrypted</p>
                  </div>
                  <div className="feature-item">
                    <IonBadge color="warning">Disappearing</IonBadge>
                    <p>Set messages to auto-delete after reading</p>
                  </div>
                  <div className="feature-item">
                    <IonBadge color="tertiary">Media</IonBadge>
                    <p>Send images and files securely</p>
                  </div>
                </div>

                <h3>Message Controls</h3>
                <p>
                  Long-press on any message to access controls:
                </p>
                <ul>
                  <li>Reply to a specific message</li>
                  <li>Forward a message</li>
                  <li>Delete a message (for you or everyone)</li>
                  <li>Copy text content</li>
                </ul>

                <div className="docs-tip">
                  <IonIcon icon={helpCircleOutline} />
                  <div>
                    <strong>Tip:</strong> Use the "Ghost Mode" toggle to send messages that disappear after being read.
                  </div>
                </div>
              </IonCardContent>
            </IonCard>
          </section>

          <section id="chat-rooms" className="docs-section">
            <IonCard className="ghost-shadow">
              <IonCardHeader>
                <div className="section-header">
                  <IonIcon icon={peopleOutline} color="primary" />
                  <IonCardTitle>Chat Rooms</IonCardTitle>
                </div>
              </IonCardHeader>
              <IonCardContent>
                <h3>Creating a Chat Room</h3>
                <p>
                  Chat rooms allow multiple users to communicate in a secure shared space:
                </p>
                <ol>
                  <li>Navigate to the "Chat Rooms" tab</li>
                  <li>Tap the "+" button in the bottom right corner</li>
                  <li>Enter a room name and optional description</li>
                  <li>Set privacy options (public, private, or invite-only)</li>
                  <li>Tap "Create Room"</li>
                </ol>

                <h3>Managing Room Participants</h3>
                <p>
                  As a room creator or admin, you can:
                </p>
                <ul>
                  <li>Add users by username or invitation link</li>
                  <li>Remove participants</li>
                  <li>Assign admin roles to trusted members</li>
                  <li>Set participant permissions</li>
                </ul>

                <h3>Room Settings</h3>
                <p>
                  Customize your room experience:
                </p>
                <ul>
                  <li>Change room image or theme</li>
                  <li>Set message retention policies</li>
                  <li>Enable/disable features like media sharing</li>
                  <li>Configure notification preferences</li>
                </ul>

                <div className="docs-tip">
                  <IonIcon icon={helpCircleOutline} />
                  <div>
                    <strong>Tip:</strong> For maximum security in sensitive discussions, create temporary rooms with short message retention periods.
                  </div>
                </div>
              </IonCardContent>
            </IonCard>
          </section>

          <section id="privacy-security" className="docs-section">
            <IonCard className="ghost-shadow">
              <IonCardHeader>
                <div className="section-header">
                  <IonIcon icon={lockClosedOutline} color="primary" />
                  <IonCardTitle>Privacy & Security</IonCardTitle>
                </div>
              </IonCardHeader>
              <IonCardContent>
                <h3>End-to-End Encryption</h3>
                <p>
                  GhostTalk uses strong end-to-end encryption, meaning only you and your recipient can read your messages. 
                  Not even our server administrators can access your message content.
                </p>

                <h3>Security Features</h3>
                <div className="feature-grid">
                  <div className="feature-item">
                    <IonBadge color="danger">Authentication</IonBadge>
                    <p>Enable biometric authentication or PIN</p>
                  </div>
                  <div className="feature-item">
                    <IonBadge color="warning">Screen Security</IonBadge>
                    <p>Prevent screenshots in the app</p>
                  </div>
                  <div className="feature-item">
                    <IonBadge color="success">Session Control</IonBadge>
                    <p>Manage and revoke active sessions</p>
                  </div>
                </div>

                <h3>Privacy Controls</h3>
                <p>
                  GhostTalk gives you complete control over your privacy:
                </p>
                <ul>
                  <li>Control who can message you or add you to rooms</li>
                  <li>Adjust your online status visibility</li>
                  <li>Set automatic message deletion timeframes</li>
                  <li>Export or delete your account data</li>
                </ul>

                <div className="docs-note">
                  <strong>Note:</strong> We recommend reviewing our comprehensive <a href="/privacy">Privacy Policy</a> 
                  to understand how GhostTalk protects your information.
                </div>
              </IonCardContent>
            </IonCard>
          </section>

          <section id="settings" className="docs-section">
            <IonCard className="ghost-shadow">
              <IonCardHeader>
                <div className="section-header">
                  <IonIcon icon={cogOutline} color="primary" />
                  <IonCardTitle>Settings & Preferences</IonCardTitle>
                </div>
              </IonCardHeader>
              <IonCardContent>
                <p>
                  Customize GhostTalk to suit your needs through the Settings menu.
                </p>
                
                <IonAccordionGroup>
                  <IonAccordion value="appearance">
                    <IonItem slot="header">
                      <IonLabel>Appearance</IonLabel>
                    </IonItem>
                    <div className="ion-padding" slot="content">
                      <ul>
                        <li><strong>Dark Mode:</strong> Toggle between light and dark themes</li>
                        <li><strong>Chat Background:</strong> Customize your chat backgrounds</li>
                        <li><strong>Text Size:</strong> Adjust text size for better readability</li>
                        <li><strong>Theme Color:</strong> Choose from multiple accent colors</li>
                      </ul>
                    </div>
                  </IonAccordion>
                  
                  <IonAccordion value="notifications">
                    <IonItem slot="header">
                      <IonLabel>Notifications</IonLabel>
                    </IonItem>
                    <div className="ion-padding" slot="content">
                      <ul>
                        <li><strong>Sound:</strong> Choose notification sounds</li>
                        <li><strong>Vibration:</strong> Configure vibration patterns</li>
                        <li><strong>Preview:</strong> Show or hide message content in notifications</li>
                        <li><strong>Do Not Disturb:</strong> Set quiet hours</li>
                      </ul>
                    </div>
                  </IonAccordion>
                  
                  <IonAccordion value="privacy">
                    <IonItem slot="header">
                      <IonLabel>Privacy</IonLabel>
                    </IonItem>
                    <div className="ion-padding" slot="content">
                      <ul>
                        <li><strong>Read Receipts:</strong> Control when others see you've read messages</li>
                        <li><strong>Typing Indicators:</strong> Show or hide when you're typing</li>
                        <li><strong>Last Seen:</strong> Manage who can see when you were last online</li>
                        <li><strong>Profile Photo:</strong> Control who can see your profile photo</li>
                      </ul>
                    </div>
                  </IonAccordion>
                  
                  <IonAccordion value="data">
                    <IonItem slot="header">
                      <IonLabel>Data & Storage</IonLabel>
                    </IonItem>
                    <div className="ion-padding" slot="content">
                      <ul>
                        <li><strong>Auto-Download:</strong> Configure media auto-download settings</li>
                        <li><strong>Storage Usage:</strong> View and manage storage used by chats</li>
                        <li><strong>Data Backup:</strong> Set up encrypted backups</li>
                        <li><strong>Chat History:</strong> Manage message retention periods</li>
                      </ul>
                    </div>
                  </IonAccordion>
                </IonAccordionGroup>
              </IonCardContent>
            </IonCard>
          </section>

          <section id="troubleshooting" className="docs-section">
            <IonCard className="ghost-shadow">
              <IonCardHeader>
                <div className="section-header">
                  <IonIcon icon={helpCircleOutline} color="primary" />
                  <IonCardTitle>Troubleshooting</IonCardTitle>
                </div>
              </IonCardHeader>
              <IonCardContent>
                <h3>Common Issues</h3>
                
                <IonAccordionGroup>
                  <IonAccordion value="connection">
                    <IonItem slot="header">
                      <IonLabel>Connection Problems</IonLabel>
                    </IonItem>
                    <div className="ion-padding" slot="content">
                      <p>If you're experiencing connection issues:</p>
                      <ol>
                        <li>Check your internet connection</li>
                        <li>Verify that GhostTalk has permission to use cellular data</li>
                        <li>Try toggling airplane mode on and off</li>
                        <li>Restart the application</li>
                        <li>If problems persist, try restarting your device</li>
                      </ol>
                    </div>
                  </IonAccordion>
                  
                  <IonAccordion value="messages">
                    <IonItem slot="header">
                      <IonLabel>Message Delivery Issues</IonLabel>
                    </IonItem>
                    <div className="ion-padding" slot="content">
                      <p>If messages aren't sending or being received:</p>
                      <ol>
                        <li>Check for a stable internet connection</li>
                        <li>Verify that the recipient hasn't blocked you</li>
                        <li>Try sending the message again</li>
                        <li>Check if you need to update the app to the latest version</li>
                      </ol>
                    </div>
                  </IonAccordion>
                  
                  <IonAccordion value="notifications-issues">
                    <IonItem slot="header">
                      <IonLabel>Notification Problems</IonLabel>
                    </IonItem>
                    <div className="ion-padding" slot="content">
                      <p>If you're not receiving notifications:</p>
                      <ol>
                        <li>Check notification settings within GhostTalk</li>
                        <li>Verify system notification permissions for GhostTalk</li>
                        <li>Ensure Do Not Disturb mode is off</li>
                        <li>Check battery optimization settings that might restrict background processes</li>
                      </ol>
                    </div>
                  </IonAccordion>
                </IonAccordionGroup>

                <div className="contact-support">
                  <h3>Need More Help?</h3>
                  <p>
                    Our support team is ready to assist with any issues not covered in the documentation.
                  </p>
                  <IonButton expand="block" href="mailto:support@ghosttalk.com">
                    Contact Support
                  </IonButton>
                </div>
              </IonCardContent>
            </IonCard>
          </section>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default DocsPage;