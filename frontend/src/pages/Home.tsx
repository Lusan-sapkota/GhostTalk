import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonButton,
  IonGrid,
  IonRow,
  IonCol,
  IonButtons,
  IonMenuButton,
  IonIcon,
  IonFooter,
  IonBadge,
  IonImg
} from '@ionic/react';
import { 
  chatbubbles, 
  people, 
  person, 
  star, 
  lockClosed, 
  rocket, 
  flash, 
  globe,
  logoGooglePlaystore,
  moon,
  sunny,
  logoTwitter,
  logoFacebook,
  logoInstagram,
  logoGithub
} from 'ionicons/icons';
import './Home.css';
import { useState } from 'react';
import { themeService } from '../services/ThemeService';

const Home: React.FC = () => {
  const [darkMode, setDarkMode] = useState(themeService.getDarkMode());

  const handleToggleTheme = () => {
    const isDark = themeService.toggleTheme();
    setDarkMode(isDark);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>GhostTalk</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleToggleTheme}>
              <IonIcon slot="icon-only" icon={darkMode ? sunny : moon} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      
      <IonContent fullscreen>
        {/* Hero Section */}
        <div className="hero-section">
          <div className="hero-content">
            <h1>Connect Anonymously,<br />Chat Freely</h1>
            <p>
              GhostTalk lets you chat with people around the world 
              without revealing your identity. Safe, secure, and completely free.
            </p>
            <IonButton routerLink="/random-chat" size="large" className="get-started-btn">
              <IonIcon slot="start" icon={flash} />
              Let's Start Chatting
            </IonButton>
          </div>
        </div>

        {/* Features Section */}
        <div className="section features-section">
          <div className="section-header">
            <h2>Key Features</h2>
            <p>Discover what makes GhostTalk special</p>
          </div>
          
          <IonGrid>
            <IonRow>
              <IonCol size="12" sizeMd="4">
                <IonCard className="feature-card">
                  <IonCardHeader>
                    <div className="feature-icon">
                      <IonIcon icon={chatbubbles} />
                    </div>
                    <IonCardTitle>Random Chat</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    Meet new people randomly from around the world. Every conversation 
                    is a new adventure with complete anonymity.
                    <div className="feature-action">
                      <IonButton fill="clear" routerLink="/random-chat">Try It</IonButton>
                    </div>
                  </IonCardContent>
                </IonCard>
              </IonCol>
              
              <IonCol size="12" sizeMd="4">
                <IonCard className="feature-card">
                  <IonCardHeader>
                    <div className="feature-icon">
                      <IonIcon icon={people} />
                    </div>
                    <IonCardTitle>Chat Rooms</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    Join topic-based chat rooms and discuss your interests with like-minded 
                    people in a group setting.
                    <div className="feature-action">
                      <IonButton fill="clear" routerLink="/chat-room">Explore Rooms</IonButton>
                    </div>
                  </IonCardContent>
                </IonCard>
              </IonCol>
              
              <IonCol size="12" sizeMd="4">
                <IonCard className="feature-card">
                  <IonCardHeader>
                    <div className="feature-icon">
                      <IonIcon icon={lockClosed} />
                    </div>
                    <IonCardTitle>Private Chat</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    Have one-on-one conversations with secure IDs. Share your ID only with
                    people you trust.
                    <div className="feature-action">
                      <IonButton fill="clear" routerLink="/chat-individual">Start Private Chat</IonButton>
                    </div>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            </IonRow>
          </IonGrid>
        </div>

        {/* Pro Section - Enhanced */}
        <div className="section pro-section">
          <IonCard className="premium-card">
            <div className="pro-header">
              <div className="pro-badge">
                <IonIcon icon={star} />
                <span>PRO</span>
              </div>
              <h2>Upgrade to GhostTalk Pro</h2>
              <p>Unlock premium features and enhance your chatting experience</p>
            </div>
            
            <IonCardContent>
              <IonGrid>
                <IonRow>
                  <IonCol size="12" sizeMd="6">
                    <div className="pro-features">
                      <div className="pro-feature-item">
                        <div className="feature-icon-container">
                          <IonIcon icon={rocket} />
                        </div>
                        <div className="feature-text">
                          <h3>24hr Chat Retention</h3>
                          <p>Keep your chat history for 24 hours instead of standard 1 hour</p>
                        </div>
                      </div>
                      
                      <div className="pro-feature-item">
                        <div className="feature-icon-container">
                          <IonIcon icon={flash} />
                        </div>
                        <div className="feature-text">
                          <h3>Unlimited Chat Sessions</h3>
                          <p>No limits on the number of chat sessions you can have</p>
                        </div>
                      </div>
                      
                      <div className="pro-feature-item">
                        <div className="feature-icon-container">
                          <IonIcon icon={star} />
                        </div>
                        <div className="feature-text">
                          <h3>Pro Badge</h3>
                          <p>Show off your Pro status with a unique badge in chats</p>
                        </div>
                      </div>
                      
                      <div className="pro-feature-item">
                        <div className="feature-icon-container">
                          <IonIcon icon={person} />
                        </div>
                        <div className="feature-text">
                          <h3>Premium Avatars</h3>
                          <p>Access to exclusive premium avatar collection</p>
                        </div>
                      </div>
                    </div>
                  </IonCol>
                  
                  <IonCol size="12" sizeMd="6" className="pro-pricing">
                    <div className="pricing-container">
                      <div className="pricing-option">
                        <div>
                          <div className="pricing-header">Monthly</div>
                          <div className="price">$4.99<span>/month</span></div>
                        </div>
                        <IonButton fill="outline" expand="block">Choose Plan</IonButton>
                      </div>
                      
                      <div className="pricing-option best-value">
                        <IonBadge color="success" className="best-value-badge">Best Value</IonBadge>
                        <div>
                          <div className="pricing-header">Yearly</div>
                          <div className="price">$39.99<span>/year</span></div>
                          <p className="save-text">Save over 30%</p>
                        </div>
                        <IonButton expand="block">Choose Plan</IonButton>
                      </div>
                      
                      <div className="pricing-note-container">
                        <p className="pricing-note">All plans include all premium features</p>
                      </div>
                    </div>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </IonCardContent>
          </IonCard>
        </div>
        
        {/* App Download Section */}
        <div className="section app-download-section">
          <div className="section-header">
            <h2>Get Our App</h2>
            <p>Download GhostTalk for a better mobile experience</p>
          </div>
          
          <div className="app-download-container">
            <div className="app-info">
              <h3>Enhanced Mobile Experience</h3>
              <ul className="app-features-list">
                <li><IonIcon icon={flash} /> Faster performance</li>
                <li><IonIcon icon={lockClosed} /> Enhanced security</li>
                <li><IonIcon icon={chatbubbles} /> Push notifications</li>
                <li><IonIcon icon={people} /> More chat features</li>
              </ul>
              <div className="store-buttons">
                <IonButton className="playstore-btn" href="https://play.google.com/store" target="_blank">
                  <IonIcon slot="start" icon={logoGooglePlaystore} />
                  Get it on Google Play
                </IonButton>
              </div>
            </div>
            
            <div className="app-image">
              <img src="assets/app-preview.png" alt="GhostTalk App Preview" />
            </div>
          </div>
        </div>
        {/* Footer Section */}
        <IonFooter className="home-footer">
            <div className="footer-content">
              <div className="footer-section">
                <h3>GhostTalk</h3>
                <p>Connect anonymously, chat freely, be yourself.</p>
              </div>
              
              <div className="footer-section">
                <h3>Links</h3>
                <ul>
                  <li><a href="/about">About Us</a></li>
                  <li><a href="/privacy">Privacy Policy</a></li>
                  <li><a href="/terms">Terms of Service</a></li>
                  <li><a href="/contact">Contact</a></li>
                </ul>
              </div>
              
              <div className="footer-section">
                <h3>Connect With Us</h3>
                <div className="social-icons">
                  <a href="#"><IonIcon icon={logoTwitter} /></a>
                  <a href="#"><IonIcon icon={logoFacebook} /></a>
                  <a href="#"><IonIcon icon={logoInstagram} /></a>
                  <a href="#"><IonIcon icon={logoGithub} /></a>
                </div>
              </div>
            </div>
            
            <div className="copyright">
              <p>© {new Date().getFullYear()} GhostTalk. All rights reserved.</p>
            </div>
        </IonFooter>
      </IonContent>
    </IonPage>
  );
};

export default Home;
