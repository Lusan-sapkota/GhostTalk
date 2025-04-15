import {
  IonContent,
  IonPage,
  IonCard,
  IonCardContent,
  IonIcon,
  IonButton,
  IonGrid,
  IonRow,
  IonCol,
  IonChip,
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
    <IonPage className="about-ghost-appear">
      <BackHeaderComponent title="About GhostTalk" />
      
      <IonContent fullscreen id="about-content">
        {/* Hero Section */}
        <div className="about-hero">
          <div className="about-ghost-container">
            <div className="about-ghost-icon">
              <img src="assets/icon-only.png" alt="GhostTalk Logo" />
              <div className="about-ghost-shadow-effect"></div>
            </div>
          </div>
          <h1>GhostTalk</h1>
          
          {/* Updated badges section */}
          <div className="about-hero-badges">
            <div className="about-badge version-badge">
              <IonIcon icon={sparklesOutline} />
              <span>Version 1.0.0</span>
            </div>
            <div className="about-badge secure-badge">
              <IonIcon icon={shieldCheckmarkOutline} />
              <span>End-to-End Encrypted</span>
            </div>
          </div>
          
          <p className="about-hero-tagline">Privacy-focused, anonymous communication for the modern world</p>
          <div className="about-hero-actions">
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
            className={`about-section about-mission ${isVisible.mission ? 'visible' : ''}`}
            ref={setRef('mission')}
          >
            <div className="about-section-header">
              <div className="about-section-icon">
                <IonIcon icon={informationCircle} />
              </div>
              <h2>Our Mission</h2>
            </div>
            <IonCard className="about-ghost-shadow">
              <IonCardContent>
                <p className="about-mission-text">
                  In a world where digital privacy is increasingly at risk, GhostTalk was created with a simple mission: 
                  to provide secure, anonymous communication channels that respect your privacy.
                </p>
                <p className="about-mission-text">
                  We believe that everyone deserves the freedom to express themselves without constant surveillance. 
                  GhostTalk combines cutting-edge encryption technology with a user-friendly interface to create 
                  a space where conversations can flow freely and securely.
                </p>
              </IonCardContent>
            </IonCard>
          </section>
          
          {/* Features Section */}
          <section 
            className={`about-section about-features ${isVisible.features ? 'visible' : ''}`}
            ref={setRef('features')}
          >
            <div className="about-section-header">
              <div className="about-section-icon">
                <IonIcon icon={flashOutline} />
              </div>
              <h2>Key Features</h2>
            </div>
            
            <IonGrid>
              <IonRow>
                <IonCol size="12" sizeMd="6">
                  <div className="about-feature-card">
                    <div className="about-feature-icon">
                      <IonIcon icon={globe} />
                    </div>
                    <h3>Anonymous Chats</h3>
                    <p>Connect with strangers worldwide anonymously and safely</p>
                  </div>
                </IonCol>
                
                <IonCol size="12" sizeMd="6">
                  <div className="about-feature-card">
                    <div className="about-feature-icon">
                      <IonIcon icon={bookmarks} />
                    </div>
                    <h3>Topic-Based Rooms</h3>
                    <p>Join conversations on topics that interest you most</p>
                  </div>
                </IonCol>
                
                <IonCol size="12" sizeMd="6">
                  <div className="about-feature-card">
                    <div className="about-feature-icon">
                      <IonIcon icon={lockClosed} />
                    </div>
                    <h3>Secure Messaging</h3>
                    <p>End-to-end encryption keeps your conversations private</p>
                  </div>
                </IonCol>
                
                <IonCol size="12" sizeMd="6">
                  <div className="about-feature-card">
                    <div className="about-feature-icon">
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
            className={`about-section about-privacy ${isVisible.privacy ? 'visible' : ''}`}
            ref={setRef('privacy')}
          >
            <div className="about-section-header">
              <div className="about-section-icon">
                <IonIcon icon={shieldCheckmarkOutline} />
              </div>
              <h2>Privacy Commitment</h2>
            </div>
            
            <IonCard className="about-ghost-shadow about-privacy-card">
              <IonCardContent>
                <div className="about-privacy-content">
                  <div className="about-privacy-text">
                    <p>
                      Your privacy is our top priority. GhostTalk is designed with privacy at its core:
                    </p>
                    <ul className="about-privacy-list">
                      <li><strong>No phone number</strong> or personal information required</li>
                      <li><strong>No message logging</strong> on our servers</li>
                      <li><strong>End-to-end encryption</strong> for all communications</li>
                      <li><strong>Minimal data collection</strong> - we only store what's necessary</li>
                    </ul>
                    
                    <IonButton expand="block" fill="solid" routerLink="/privacy" className="about-privacy-button">
                      Read Our Privacy Policy
                      <IonIcon slot="end" icon={arrowForward} />
                    </IonButton>
                  </div>
                  
                  <div className="about-privacy-graphic">
                    <div className="about-shield-icon">
                      <IonIcon icon={shieldCheckmarkOutline} />
                    </div>
                  </div>
                </div>
              </IonCardContent>
            </IonCard>
          </section>
          
          {/* GitHub Section */}
          <section 
            className={`about-section about-github ${isVisible.github ? 'visible' : ''}`}
            ref={setRef('github')}
          >
            <div className="about-section-header">
              <div className="about-section-icon">
                <IonIcon icon={logoGithub} />
              </div>
              <h2>Open Source</h2>
            </div>
            
            <IonCard className="about-ghost-shadow about-github-card">
              <IonCardContent className="about-github-content">
                <div className="about-github-text">
                  <h3>We believe in transparency</h3>
                  <p>GhostTalk is open source. You can check out our code, contribute to the project, or report issues on GitHub.</p>
                  <IonButton 
                    className="about-github-button" 
                    expand="block" 
                    href="https://github.com/Lusan-sapkota/GhostTalk" 
                    target="_blank"
                  >
                    <IonIcon slot="start" icon={logoGithub} />
                    Visit Our GitHub Repository
                  </IonButton>
                </div>
                <div className="about-github-graphic">
                  <div className="about-github-icon-container">
                    <IonIcon icon={logoGithub} className="about-github-icon" />
                  </div>
                </div>
                </IonCardContent>
              </IonCard>
            </section>
            
            {/* Contact Section */}
            <section 
              className={`about-section about-contact ${isVisible.contact ? 'visible' : ''}`}
              ref={setRef('contact')}
            >
              <div className="about-section-header">
                <div className="about-section-icon">
                  <IonIcon icon={mail} />
                </div>
                <h2>Get in Touch</h2>
              </div>
              
              <div className="about-contact-options">
                <IonCard className="about-contact-card about-ghost-shadow">
                  <IonCardContent>
                    <IonIcon icon={mail} className="about-contact-big-icon" />
                    <h3>Email Us</h3>
                    <p>Have questions or suggestions? We'd love to hear from you!</p>
                    <IonButton expand="block" fill="outline" href="mailto:support@ghosttalk.me">
                      support@ghosttalk.me
                    </IonButton>
                  </IonCardContent>
                </IonCard>
                
                <IonCard className="about-contact-card about-ghost-shadow">
                  <IonCardContent>
                    <IonIcon icon={helpCircleOutline} className="about-contact-big-icon" />
                    <h3>Support</h3>
                    <p>Need help with GhostTalk? Our support team is ready to assist.</p>
                    <IonButton expand="block" fill="outline" routerLink="/support">
                      Visit Help Center
                    </IonButton>
                  </IonCardContent>
                </IonCard>
              </div>
              
              <div className="about-social-links">
                <h3>Connect With Us</h3>
                <div className="about-social-buttons">
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
            <div className="about-footer-logo">
              <span>GhostTalk</span>
            </div>
            <div className="about-footer-links">
              <IonButton fill="clear" size="small" routerLink="/privacy">Privacy Policy</IonButton>
              <IonButton fill="clear" size="small" routerLink="/terms">Terms of Service</IonButton>
              <IonButton fill="clear" size="small" routerLink="/faq">FAQ</IonButton>
            </div>
            <div className="about-footer-copyright">
              <p>© {new Date().getFullYear()} GhostTalk. All rights reserved.</p>
              <p className="about-made-with">
                Made with <IonIcon icon={heart} color="danger" /> by the GhostTalk Team
              </p>
            </div>
          </footer>
        </IonContent>
      </IonPage>
    );
  };
  
  export default About;
  