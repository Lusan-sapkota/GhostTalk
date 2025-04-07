import React, { useState, useRef, useEffect } from 'react';
import {
  IonContent,
  IonPage,
  IonButton,
  IonIcon,
  IonText,
  IonImg,
  IonProgressBar,
  isPlatform
} from '@ionic/react';
import {
  arrowForward,
  chatbubbles,
  lockClosed,
  peopleOutline,
  personCircleOutline,
  checkmarkDone
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Swiper as SwiperClass } from 'swiper';
import 'swiper/css';
import './Onboarding.css';
import FirstLaunch from '../plugins/firstLaunch';
import { Capacitor } from '@capacitor/core';

// At the top of your component
console.log('Onboarding component loaded, pathname:', window.location.pathname, 'hash:', window.location.hash);

const Onboarding: React.FC = () => {
  const history = useHistory();
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const swiperRef = useRef<SwiperClass | null>(null);
  
  const swiperParams = {
    initialSlide: 0,
    speed: 400,
    loop: false,
    pagination: false
  };
  
  useEffect(() => {
    console.log('Onboarding component mounted');
    console.log('Window location:', window.location.href);
    console.log('Local storage hasSeenOnboarding:', localStorage.getItem('hasSeenOnboarding'));
    
    // Force repaint after a delay to ensure rendering
    setTimeout(() => {
      const element = document.querySelector('.onboarding-page');
      if (element) {
        console.log('Found onboarding element, forcing redraw');
        (element as HTMLElement).style.display = 'none';
        setTimeout(() => {
          (element as HTMLElement).style.display = 'block';
        }, 10);
      } else {
        console.warn('Onboarding element not found!');
      }
    }, 100);
  }, []);
  
  useEffect(() => {
    console.log('Onboarding component mounted');
    
    // Check if Onboarding is visible
    const element = document.querySelector('.onboarding-page');
    console.log('Onboarding element found:', !!element);
    
    // Force repaint
    setTimeout(() => {
      if (element) {
        console.log('Forcing refresh of onboarding');
        (element as HTMLElement).style.opacity = '0.99';
        setTimeout(() => {
          (element as HTMLElement).style.opacity = '1';
        }, 50);
      }
    }, 100);
  }, []);
  
  useEffect(() => {
    // Check if we should show onboarding (only on Android)
    const checkOnboardingStatus = async () => {
      try {
        // If not in localStorage, check with native plugin first
        if (isPlatform('android')) {
          try {
            const { isFirstLaunch } = await FirstLaunch.checkFirstLaunch();
            
            // If not first launch according to native code, then finish onboarding
            if (!isFirstLaunch) {
              const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
              if (hasSeenOnboarding === 'true') {
                finishOnboarding();
              }
            }
          } catch (error) {
            console.error('Error checking first launch status:', error);
            // Fall back to localStorage check
            const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
            if (hasSeenOnboarding === 'true') {
              finishOnboarding();
            }
          }
        } else {
          // Not on Android
          finishOnboarding();
        }
      } catch (error) {
        console.error('Error in onboarding check:', error);
      }
    };
    
    checkOnboardingStatus();
  }, []);
  
  useEffect(() => {
    console.log('Onboarding component mounted');
    
    // Android-specific handling for assets
    if (isPlatform('android')) {
      // Force all image assets to use relative paths
      document.querySelectorAll('img').forEach(img => {
        const src = img.getAttribute('src');
        if (src && src.startsWith('/')) {
          // Convert absolute paths to relative
          img.setAttribute('src', src.substring(1));
        }
      });
      
      // For stylesheets that might be loading from absolute paths
      document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('/')) {
          // Convert absolute paths to relative
          link.setAttribute('href', href.substring(1));
        }
      });
    }
  }, []);
  
  useEffect(() => {
    console.log('[ONBOARDING] Component mounted, checking forced display');
    
    // Check if we should force onboarding display (set by native code)
    const forceOnboarding = localStorage.getItem('forceOnboarding');
    if (forceOnboarding === 'true') {
      console.log('[ONBOARDING] Force display detected');
      setShowOnboarding(true);
      localStorage.removeItem('forceOnboarding'); // Clear the flag
    }
  }, []);

  useEffect(() => {
    console.log('[ONBOARDING] Running visibility check');
    
    // Add a visibility detection
    const observer = new MutationObserver((mutations) => {
      const onboardingPage = document.querySelector('.onboarding-page');
      if (onboardingPage) {
        console.log('[ONBOARDING] Page element found');
        // Force styles to ensure visibility
        (onboardingPage as HTMLElement).style.display = 'flex';
        (onboardingPage as HTMLElement).style.visibility = 'visible';
        (onboardingPage as HTMLElement).style.opacity = '1';
        observer.disconnect(); // Stop observing once found
      }
    });
    
    // Start observing
    observer.observe(document.body, { 
      childList: true, 
      subtree: true 
    });
    
    return () => observer.disconnect();
  }, []);
  
  const handleSlideChange = (swiper: SwiperClass) => {
    setActiveIndex(swiper.activeIndex);
  };
  
  const nextSlide = () => {
    swiperRef.current?.slideNext();
  };
  
  const finishOnboarding = () => {
    // Mark onboarding as completed
    localStorage.setItem('hasSeenOnboarding', 'true');
    setShowOnboarding(false);
    // Navigate to home page
    history.replace('/home');
  };
  
  if (!showOnboarding) {
    return null;
  }
  
  return (
    <IonPage className="onboarding-page">
      <IonContent fullscreen scrollY={false}>
        <Swiper
          onSwiper={(swiper) => (swiperRef.current = swiper)}
          onSlideChange={handleSlideChange}
          className="onboarding-slides"
        >
          {/* Welcome Slide */}
          <SwiperSlide className="onboarding-slide">
            <div className="slide-content ghost-appear">
              <div className="slide-icon ghost-float">
                <div className="ghost-icon-large">
                  <div className="ghost-eyes"></div>
                </div>
              </div>
              <h1>Welcome to GhostTalk</h1>
              <p>Connect anonymously, chat freely, be yourself.</p>
              <IonButton 
                className="next-button ghost-shadow" 
                onClick={nextSlide}
              >
                Get Started
                <IonIcon slot="end" icon={arrowForward} />
              </IonButton>
            </div>
          </SwiperSlide>
          
          {/* Anonymous Chat */}
          <SwiperSlide className="onboarding-slide">
            <div className="slide-content ghost-appear">
              <div className="slide-icon ghost-float">
                <IonIcon icon={chatbubbles} color="primary" />
              </div>
              <h2>Anonymous Chat</h2>
              <p>Chat with strangers without revealing your identity. Our random chat feature connects you with people around the world.</p>
            </div>
          </SwiperSlide>
          
          {/* Private Messaging */}
          <SwiperSlide className="onboarding-slide">
            <div className="slide-content ghost-appear">
              <div className="slide-icon ghost-float">
                <IonIcon icon={lockClosed} color="primary" />
              </div>
              <h2>Private & Secure</h2>
              <p>Your conversations are secure and private. Share your unique ID to let others chat directly with you.</p>
            </div>
          </SwiperSlide>
          
          {/* Chat Rooms */}
          <SwiperSlide className="onboarding-slide">
            <div className="slide-content ghost-appear">
              <div className="slide-icon ghost-float">
                <IonIcon icon={peopleOutline} color="primary" />
              </div>
              <h2>Topic-Based Rooms</h2>
              <p>Join or create chat rooms based on your interests. Connect with like-minded people in group discussions.</p>
            </div>
          </SwiperSlide>
          
          {/* Customize Profile */}
          <SwiperSlide className="onboarding-slide">
            <div className="slide-content ghost-appear">
              <div className="slide-icon ghost-float">
                <IonIcon icon={personCircleOutline} color="primary" />
              </div>
              <h2>Customizable Profile</h2>
              <p>Create your unique ghost identity. Customize your avatar and profile details while maintaining anonymity.</p>
              <IonButton 
                className="finish-button ghost-shadow" 
                onClick={finishOnboarding}
              >
                Start Ghosting
                <IonIcon slot="end" icon={checkmarkDone} />
              </IonButton>
            </div>
          </SwiperSlide>
        </Swiper>
        
        {/* Progress indicator */}
        <div className="slide-progress-container">
          <IonProgressBar 
            value={(activeIndex + 1) / 5} 
            className="slide-progress"
            color="primary"
          ></IonProgressBar>
          <div className="slide-indicators">
            {[0, 1, 2, 3, 4].map((index) => (
              <div 
                key={index} 
                className={`slide-indicator ${activeIndex === index ? 'active' : ''}`}
                onClick={() => swiperRef.current?.slideTo(index)}
              ></div>
            ))}
          </div>
          {activeIndex < 4 && (
            <IonButton 
              fill="clear"
              className="skip-button" 
              onClick={finishOnboarding}
            >
              Skip
            </IonButton>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Onboarding;