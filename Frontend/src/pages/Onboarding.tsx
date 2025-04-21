import React, { useState, useRef, useEffect } from 'react';
import { IonContent, IonPage, IonButton, IonIcon, IonProgressBar } from '@ionic/react';
import { arrowForward, chatbubbles, lockClosed, peopleOutline, personCircleOutline, checkmarkDone } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Swiper as SwiperClass } from 'swiper';
import { Capacitor } from '@capacitor/core';
import FirstLaunch from '../plugins/firstLaunch';
import 'swiper/css';
import './Onboarding.css';
import { isAndroidApp } from '../services/permissionService';

const Onboarding: React.FC = () => {
  const history = useHistory();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const swiperRef = useRef<SwiperClass | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    console.log('Onboarding component mounted');
    
    const checkOnboardingStatus = async () => {
      // First check if we're in a browser (not Android)
      const isAndroidApp = localStorage.getItem('isAndroidApp') === 'true';
      
      console.log('Checking onboarding status:', { 
        isAndroidApp, 
        forceOnboarding: localStorage.getItem('forceOnboarding'),
        hasSeenOnboarding: localStorage.getItem('hasSeenOnboarding')
      });
      
      if (!isAndroidApp && !Capacitor.isNativePlatform()) {
        console.log('Web browser detected, skipping onboarding');
        history.replace('/home');
        return;
      }
      
      // First check for the forced onboarding flag (from native code)
      const forceOnboarding = localStorage.getItem('forceOnboarding');
      
      if (forceOnboarding === 'true') {
        console.log('Force onboarding flag found - showing onboarding');
        // Force UI update
        document.body.style.backgroundColor = 'white';
        document.body.style.visibility = 'visible';
        setShowOnboarding(true);
        setIsLoading(false);
        return;
      }
      
      // Check if user has already seen onboarding
      const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
      if (hasSeenOnboarding === 'true') {
        console.log('User has already seen onboarding');
        history.replace('/home');
        return;
      }
      
      // Default to showing onboarding for Android
      if (isAndroidApp) {
        setShowOnboarding(true);
        setIsLoading(false);
      } else {
        // Skip for regular web
        history.replace('/home');
      }
    };
    
    // Immediate check with backup timeout
    checkOnboardingStatus();
    const timeoutId = setTimeout(checkOnboardingStatus, 1500);
    
    return () => clearTimeout(timeoutId);
  }, [history]);
  
  // Handle slide change
  const handleSlideChange = (swiper: SwiperClass) => {
    setActiveIndex(swiper.activeIndex);
  };
  
  // Finish onboarding
  const finishOnboarding = () => {
    // Save that user has seen onboarding
    localStorage.setItem('hasSeenOnboarding', 'true');
    
    // Clear the force flag when onboarding is complete
    localStorage.removeItem('forceOnboarding');
    
    // Check if we're running in an Android app
    const isAndroidApp = localStorage.getItem('isAndroidApp') === 'true';
    
    if (isAndroidApp) {
      // On Android, navigate to permissions page instead of home
      history.replace('/permissions');
    } else {
      // On web, go directly to home
      history.replace('/home');
    }
  };
  
  return (
    <IonPage className="onboarding-page">
      {isLoading && (
        <div className="onboarding-loading">
          <IonIcon icon={chatbubbles} className="loading-icon pulse" />
          <p>Loading GhostTalk...</p>
        </div>
      )}
      
      {showOnboarding && !isLoading && (
        <IonContent fullscreen scrollY={false}>
          <Swiper
            onSwiper={(swiper) => (swiperRef.current = swiper)}
            onSlideChange={handleSlideChange}
            className="onboarding-slides"
          >
            {/* Your existing slides */}
            <SwiperSlide>
              <div className="onboarding-slide">
                <div className="slide-icon ghost-float">
                  <div className="ghost-icon-large">
                    <div className="ghost-eyes"></div>
                  </div>
                </div>
                <div className="slide-content ghost-appear">
                  <h1>Welcome to GhostTalk</h1>
                  <p>Connect anonymously, chat freely, be yourself.</p>
                  <IonButton 
                    className="next-button" 
                    onClick={() => swiperRef.current?.slideNext()}
                  >
                    Get Started
                    <IonIcon slot="end" icon={arrowForward} />
                  </IonButton>
                </div>
              </div>
            </SwiperSlide>
            
            {/* More slides... */}
            
            <SwiperSlide>
              <div className="onboarding-slide">
                <div className="slide-icon ghost-float">
                  <IonIcon icon={checkmarkDone} />
                </div>
                <div className="slide-content ghost-appear">
                  <h2>You're All Set!</h2>
                  <p>Start chatting and connecting with others anonymously.</p>
                  <IonButton 
                    className="finish-button" 
                    onClick={finishOnboarding}
                  >
                    Let's Go!
                    <IonIcon slot="end" icon={arrowForward} />
                  </IonButton>
                </div>
              </div>
            </SwiperSlide>
          </Swiper>
          
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
      )}
    </IonPage>
  );
};

export default Onboarding;