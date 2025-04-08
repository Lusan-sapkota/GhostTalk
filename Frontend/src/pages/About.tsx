import {
  IonContent,
  IonPage,
  IonCard,
  IonCardContent,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonBadge,
  IonIcon,
  IonButton,
  IonGrid,
  IonRow,
  IonCol,
  IonChip,
  IonAvatar,
  IonText
} from '@ionic/react';
import { 
  informationCircle, 
  lockClosed, 
  heart, 
  globe, 
  bookmarks,
  mail,
  logoGithub,
  logoTwitter,
  chatbubblesOutline,
  shieldCheckmarkOutline,
  flashOutline,
  peopleOutline,
  personOutline,
  codeSlashOutline,
  desktopOutline,
  arrowForward,
  helpCircleOutline,
  sparklesOutline
} from 'ionicons/icons';
import './About.css';
import BackHeaderComponent from '../components/BackHeaderComponent';
import { useEffect, useRef, useState } from 'react';

const About: React.FC = () => {
  const [isVisible, setIsVisible] = useState<{[key: string]: boolean}>({});
  const observerRefs = useRef<{[key: string]: HTMLElement | null}>({});
  
  // Set up intersection observer to trigger animations when elements come into view
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    
    Object.keys(observerRefs.current).forEach(key => {
      const element = observerRefs.current[key];
      if (element) {
        const observer = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              setIsVisible(prev => ({ ...prev, [key]: true }));
              observer.unobserve(element);
            }
          },
          { threshold: 0.2 }
        );
        
        observer.observe(element);
        observers.push(observer);
      }
    });
    
    return () => {
      observers.forEach(observer => observer.disconnect());
    };
  }, []);
  
  const setRef = (key: string) => (el: HTMLElement | null) => {
    observerRefs.current[key] = el;
  };

  return (
    <IonPage className="ghost-appear">
      <BackHeaderComponent title="About GhostTalk" />
      
      <IonContent fullscreen id="about-content">
        {/* Hero Section */}
        <div className="about-hero">
          <div className="ghost-container">
            <div className="ghost-icon">
              <img src="assets/icon/icon.png" alt="GhostTalk Logo" />
              <div className="ghost-shadow-effect"></div>
            </div>
          </div>
          <h1>GhostTalk</h1>
          <div className="hero-badges">
            <IonChip color="primary" className="version-badge">
              <IonIcon icon={sparklesOutline} />
              Version 1.0.0
            </IonChip>
            <IonChip color="success" className="secure-badge">
              <IonIcon icon={shieldCheckmarkOutline} />
              End-to-End Encrypted
            </IonChip>
          </div>
          <p className="hero-tagline">Privacy-focused, anonymous communication for the modern world</p>
          <div className="hero-actions">
            <IonButton color="primary" shape="round" size="large" routerLink="/chat">
              Start Chatting
              <IonIcon slot="end" icon={arrowForward} />
            </IonButton>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="about-content">
          {/* Mission Section */}
          <section 
            className={`about-section mission ${isVisible.mission ? 'visible' : ''}`}
            ref={setRef('mission')}
          >
            <div className="section-header">
              <div className="section-icon">
                <IonIcon icon={informationCircle} />
              </div>
              <h2>Our Mission</h2>
            </div>
            <IonCard className="ghost-shadow">
              <IonCardContent>
                <p className="mission-text">
                  In a world where digital privacy is increasingly at risk, GhostTalk was created with a simple mission: 
                  to provide secure, anonymous communication channels that respect your privacy.
                </p>
                <p className="mission-text">
                  We believe that everyone deserves the freedom to express themselves without constant surveillance. 
                  GhostTalk combines cutting-edge encryption technology with a user-friendly interface to create 
                  a space where conversations can flow freely and securely.
                </p>
              </IonCardContent>
            </IonCard>
          </section>
          
          {/* Features Section */}
          <section 
            className={`about-section features ${isVisible.features ? 'visible' : ''}`}
            ref={setRef('features')}
          >
            <div className="section-header">
              <div className="section-icon">
                <IonIcon icon={flashOutline} />
              </div>
              <h2>Key Features</h2>
            </div>
            
            <IonGrid>
              <IonRow>
                <IonCol size="12" size-md="6">
                  <div className="feature-card">
                    <div className="feature-icon">
                      <IonIcon icon={globe} />
                    </div>
                    <h3>Anonymous Chats</h3>
                    <p>Connect with strangers worldwide anonymously and safely</p>
                  </div>
                </IonCol>
                
                <IonCol size="12" size-md="6">
                  <div className="feature-card">
                    <div className="feature-icon">
                      <IonIcon icon={bookmarks} />
                    </div>
                    <h3>Topic-Based Rooms</h3>
                    <p>Join conversations on topics that interest you most</p>
                  </div>
                </IonCol>
                
                <IonCol size="12" size-md="6">
                  <div className="feature-card">
                    <div className="feature-icon">
                      <IonIcon icon={lockClosed} />
                    </div>
                    <h3>Secure Messaging</h3>
                    <p>End-to-end encryption keeps your conversations private</p>
                  </div>
                </IonCol>
                
                <IonCol size="12" size-md="6">
                  <div className="feature-card">
                    <div className="feature-icon">
                      <IonIcon icon={chatbubblesOutline} />
                    </div>
                    <h3>Self-Destructing Messages</h3>
                    <p>Set messages to disappear after they've been read</p>
                  </div>
                </IonCol>
              </IonRow>
            </IonGrid>
          </section>
          
          {/* Privacy Section */}
          <section 
            className={`about-section privacy ${isVisible.privacy ? 'visible' : ''}`}
            ref={setRef('privacy')}
          >
            <div className="section-header">
              <div className="section-icon">
                <IonIcon icon={shieldCheckmarkOutline} />
              </div>
              <h2>Privacy Commitment</h2>
            </div>
            
            <IonCard className="ghost-shadow privacy-card">
              <IonCardContent>
                <div className="privacy-content">
                  <div className="privacy-text">
                    <p>
                      Your privacy is our top priority. GhostTalk is designed with privacy at its core:
                    </p>
                    <ul className="privacy-list">
                      <li><strong>No phone number</strong> or personal information required</li>
                      <li><strong>No message logging</strong> on our servers</li>
                      <li><strong>End-to-end encryption</strong> for all communications</li>
                      <li><strong>Minimal data collection</strong> - we only store what's necessary</li>
                    </ul>
                    
                    <IonButton expand="block" fill="solid" routerLink="/privacy" className="privacy-button">
                      Read Our Privacy Policy
                      <IonIcon slot="end" icon={arrowForward} />
                    </IonButton>
                  </div>
                  
                  <div className="privacy-graphic">
                    <div className="shield-icon">
                      <IonIcon icon={shieldCheckmarkOutline} />
                    </div>
                  </div>
                </div>
              </IonCardContent>
            </IonCard>
          </section>
          
          {/* Technology Section */}
          <section 
            className={`about-section technology ${isVisible.technology ? 'visible' : ''}`}
            ref={setRef('technology')}
          >
            <div className="section-header">
              <div className="section-icon">
                <IonIcon icon={codeSlashOutline} />
              </div>
              <h2>Built With</h2>
            </div>
            
            <div className="tech-grid">
              <div className="tech-item">
                <div className="tech-icon">
                  <img src="assets/images/tech/react.svg" alt="React" />
                </div>
                <p>React</p>
              </div>
              
              <div className="tech-item">
                <div className="tech-icon">
                  <img src="assets/images/tech/ionic.svg" alt="Ionic" />
                </div>
                <p>Ionic</p>
              </div>
              
              <div className="tech-item">
                <div className="tech-icon">
                  <img src="assets/images/tech/nodejs.svg" alt="Node.js" />
                </div>
                <p>Node.js</p>
              </div>
              
              <div className="tech-item">
                <div className="tech-icon">
                  <img src="assets/images/tech/typescript.svg" alt="TypeScript" />
                </div>
                <p>TypeScript</p>
              </div>
              
              <div className="tech-item">
                <div className="tech-icon">
                  <img src="assets/images/tech/websocket.svg" alt="WebSocket" />
                </div>
                <p>WebSockets</p>
              </div>
            </div>
          </section>
          
          {/* Team Section */}
          <section 
            className={`about-section team ${isVisible.team ? 'visible' : ''}`}
            ref={setRef('team')}
          >
            <div className="section-header">
              <div className="section-icon">
                <IonIcon icon={peopleOutline} />
              </div>
              <h2>Our Team</h2>
            </div>
            
            <IonGrid>
              <IonRow>
                <IonCol size="12" size-md="4">
                  <div className="team-member">
                    <div className="member-avatar">
                      <IonAvatar>
                        <div className="member-ghost">
                          <IonIcon icon={personOutline} />
                        </div>
                      </IonAvatar>
                    </div>
                    <h3>John Doe</h3>
                    <IonText color="medium">Lead Developer</IonText>
                    <p>Passionate about privacy and secure communication systems</p>
                  </div>
                </IonCol>
                
                <IonCol size="12" size-md="4">
                  <div className="team-member">
                    <div className="member-avatar">
                      <IonAvatar>
                        <div className="member-ghost">
                          <IonIcon icon={personOutline} />
                        </div>
                      </IonAvatar>
                    </div>
                    <h3>Jane Smith</h3>
                    <IonText color="medium">UX Designer</IonText>
                    <p>Creating intuitive experiences that respect user privacy</p>
                  </div>
                </IonCol>
                
                <IonCol size="12" size-md="4">
                  <div className="team-member">
                    <div className="member-avatar">
                      <IonAvatar>
                        <div className="member-ghost">
                          <IonIcon icon={personOutline} />
                        </div>
                      </IonAvatar>
                    </div>
                    <h3>Alex Chen</h3>
                    <IonText color="medium">Security Specialist</IonText>
                    <p>Expert in encryption and secure communication protocols</p>
                  </div>
                </IonCol>
              </IonRow>
            </IonGrid>
          </section>
          
          {/* Contact Section */}
          <section 
            className={`about-section contact ${isVisible.contact ? 'visible' : ''}`}
            ref={setRef('contact')}
          >
            <div className="section-header">
              <div className="section-icon">
                <IonIcon icon={mail} />
              </div>
              <h2>Get in Touch</h2>
            </div>
            
            <div className="contact-options">
              <IonCard className="contact-card ghost-shadow">
                <IonCardContent>
                  <IonIcon icon={mail} className="contact-big-icon" />
                  <h3>Email Us</h3>
                  <p>Have questions or suggestions? We'd love to hear from you!</p>
                  <IonButton expand="block" fill="outline" href="mailto:support@ghosttalk.me">
                    support@ghosttalk.me
                  </IonButton>
                </IonCardContent>
              </IonCard>
              
              <IonCard className="contact-card ghost-shadow">
                <IonCardContent>
                  <IonIcon icon={helpCircleOutline} className="contact-big-icon" />
                  <h3>Support</h3>
                  <p>Need help with GhostTalk? Our support team is ready to assist.</p>
                  <IonButton expand="block" fill="outline" routerLink="/support">
                    Visit Help Center
                  </IonButton>
                </IonCardContent>
              </IonCard>
            </div>
            
            <div className="social-links">
              <h3>Connect With Us</h3>
              <div className="social-buttons">
                <IonButton fill="clear" href="https://github.com/ghosttalk" target="_blank">
                  <IonIcon icon={logoGithub} slot="icon-only" />
                </IonButton>
                <IonButton fill="clear" href="https://twitter.com/ghosttalk" target="_blank">
                  <IonIcon icon={logoTwitter} slot="icon-only" />
                </IonButton>
              </div>
            </div>
          </section>
        </div>
        
        {/* Footer */}
        <footer className="about-footer">
          <div className="footer-logo">
            <img src="assets/icon/icon.png" alt="GhostTalk Logo" className="footer-logo-img" />
            <span>GhostTalk</span>
          </div>
          <div className="footer-links">
            <IonButton fill="clear" size="small" routerLink="/privacy">Privacy Policy</IonButton>
            <IonButton fill="clear" size="small" routerLink="/terms">Terms of Service</IonButton>
            <IonButton fill="clear" size="small" routerLink="/faq">FAQ</IonButton>
          </div>
          <div className="footer-copyright">
            <p>© {new Date().getFullYear()} GhostTalk. All rights reserved.</p>
            <p className="made-with">
              Made with <IonIcon icon={heart} color="danger" /> by the GhostTalk Team
            </p>
          </div>
        </footer>
      </IonContent>
    </IonPage>
  );
};

export default About;