import React, { useEffect } from 'react';
import {
  IonContent,
  IonPage,
  IonButton,
  IonIcon,
  IonText,
  IonRouterLink,
  isPlatform
} from '@ionic/react';
import { home, arrowBack, searchOutline, helpCircleOutline, mailOutline } from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router';
import './NotFound.css';

const NotFound: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  
  // Add subtle parallax effect on mouse move, but only on desktop
  useEffect(() => {
    // Only add mousemove effect on non-touch devices
    if (!isPlatform('mobile') && !isPlatform('tablet')) {
      const handleMouseMove = (e: MouseEvent) => {
        const ghost = document.querySelector('.ghost-404') as HTMLElement;
        const container = document.querySelector('.not-found-container') as HTMLElement;
        
        if (ghost && container) {
          const containerRect = container.getBoundingClientRect();
          const centerX = containerRect.left + containerRect.width / 2;
          const centerY = containerRect.top + containerRect.height / 2;
          
          const moveX = (e.clientX - centerX) / 30;
          const moveY = (e.clientY - centerY) / 30;
          
          ghost.style.transform = `translate(${moveX}px, ${moveY}px)`;
        }
      };
      
      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }
  }, []);

  // Add this inside your component, after other useEffects
  useEffect(() => {
    // Log when NotFound component is rendered and why
    console.log('NotFound component rendered for path:', location.pathname);
    
    // Inspect stack trace in development to see what triggered the route
    if (process.env.NODE_ENV === 'development') {
      console.trace('NotFound render trace:');
    }
  }, [location.pathname]);
  
  return (
    <IonPage>
      <IonContent fullscreen>
        <div className="not-found-container">
          <div className="ghost-container-404">
            <div className="ghost-404">
              <div className="ghost-body-notfound">
                <div className="ghost-eyes-notfound">
                  <div className="eyes-notfound left"></div>
                  <div className="eyes-notfound right"></div>
                </div>
                <div className="ghost-mouth"></div>
              </div>
              <div className="ghost-tail">
                <div className="ghost-tail-segment"></div>
                <div className="ghost-tail-segment"></div>
                <div className="ghost-tail-segment"></div>
              </div>
            </div>
            <div className="ghost-shadow-notfound"></div>
          </div>
          
          <h1 className="not-found-title">404</h1>
          <IonText color="medium" className="not-found-message">
            <p>Oops! The page "{location.pathname}" doesn't exist or has vanished.</p>
            {process.env.NODE_ENV === 'development' && (
              <p className="debug-info">
                <small>Debug info: rendered at {new Date().toISOString()}</small>
              </p>
            )}
          </IonText>
          
          <div className="not-found-actions">
            <IonButton 
              fill="solid" 
              color="primary" 
              className="home-button"
              onClick={() => history.push('/')}
            >
              <IonIcon slot="start" icon={home} />
              Return Home
            </IonButton>
            
            <IonButton 
              fill="outline" 
              color="medium" 
              className="back-button"
              onClick={() => history.goBack()}
            >
              <IonIcon slot="start" icon={arrowBack} />
              Go Back
            </IonButton>
          </div>
          
          <div className="not-found-help">
            <div className="help-options">
              <IonRouterLink routerLink="/contact" className="help-option">
                <IonIcon icon={mailOutline} />
                <span>Contact</span>
              </IonRouterLink>
              
              <IonRouterLink routerLink="/support" className="help-option">
                <IonIcon icon={helpCircleOutline} />
                <span>Help & Support</span>
              </IonRouterLink>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default NotFound;