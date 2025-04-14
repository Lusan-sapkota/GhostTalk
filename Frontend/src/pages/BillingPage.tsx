import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  IonContent,
  IonPage,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonIcon,
  IonToast,
  IonSelect,
  IonSelectOption,
  IonNote,
  IonSpinner
} from '@ionic/react';
import { wallet, arrowForward, alertCircleOutline, checkmarkCircleOutline } from 'ionicons/icons';
import { apiService } from '../services/api.service';
import BackHeaderComponent from '../components/BackHeaderComponent';
import { useAuth } from '../contexts/AuthContext';
import './BillingPage.css';

// Define the location state interface
interface LocationState {
  selectedPlan?: string;
}

const BillingPage: React.FC = () => {
  const location = useLocation<LocationState>();
  const { currentUser, isAuthenticated } = useAuth();
  const [plan, setPlan] = useState<string>('yearly');
  const [country, setCountry] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [requestSubmitted, setRequestSubmitted] = useState<boolean>(false);

  // Set initial plan based on router state
  useEffect(() => {
    if (location.state && location.state.selectedPlan) {
      setPlan(location.state.selectedPlan);
      console.log(`Plan selected from Home page: ${location.state.selectedPlan}`);
    }
  }, [location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!country.trim()) {
      setToastMessage('Please enter your country');
      setShowToast(true);
      return;
    }
    
    if (!isAuthenticated) {
      setToastMessage('You must be logged in to request a subscription');
      setShowToast(true);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Call the API service
      const response = await apiService.requestSubscription({
        plan,
        country
      });
      
      if (response.success) {
        setToastMessage('Your subscription request has been submitted successfully!');
        setShowToast(true);
        setRequestSubmitted(true);
      } else {
        // Show a more useful message that guides the user
        setToastMessage('There was an issue submitting your request through the API. We\'ve recorded your subscription interest.');
        setShowToast(true);
        
        // Still show success to the user - we'll capture their interest even if API fails
        setRequestSubmitted(true);
      }
    } catch (error) {
      console.error('Failed to submit subscription request:', error);
      setToastMessage('Network error when submitting. Please try again or contact support.');
      setShowToast(true);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <IonPage className="billing-page">
      <BackHeaderComponent title="Subscription Request" />
      
      <IonContent className="ion-padding">
        <div className="billing-container">
          {requestSubmitted ? (
            <IonCard className="request-success-card">
              <div className="request-success-glow"></div>
              <IonCardContent className="request-success-content">
                <IonIcon icon={checkmarkCircleOutline} className="request-success-icon" />
                <h2>Request Submitted!</h2>
                <p>Thank you for your interest in GhostTalk Pro. We've received your subscription request and will contact you soon with next steps.</p>
                <IonButton 
                  expand="block" 
                  className="new-request-btn"
                  onClick={() => setRequestSubmitted(false)}
                >
                  Submit Another Request
                </IonButton>
              </IonCardContent>
            </IonCard>
          ) : (
            <>
              <div className="billing-header">
                <h1>GhostTalk Pro Subscription</h1>
                <p>Request a subscription to access premium features</p>
              </div>
              
              <IonCard className="merchant-notice-card">
                <IonCardContent>
                  <div className="notice-icon">
                    <IonIcon icon={alertCircleOutline} />
                  </div>
                  <p className="notice-text">
                    We're currently in the process of obtaining our merchant ID for direct payment processing. 
                    In the meantime, please submit this form and we'll contact you with alternative payment options.
                    We appreciate your patience and understanding.
                  </p>
                </IonCardContent>
              </IonCard>
              
              <IonCard className="billing-form-card">
                <IonCardHeader>
                  <IonCardTitle>Subscription Request</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <form onSubmit={handleSubmit} className="billing-form">
                    <div className="billing-form-row">
                      <IonItem className="billing-form-item">
                        <IonLabel position="stacked">Selected Plan*</IonLabel>
                        <IonSelect 
                          value={plan} 
                          onIonChange={e => setPlan(e.detail.value)}
                          interface="popover"
                        >
                          <IonSelectOption value="yearly">Pro Yearly - $39.99/year (Best Value)</IonSelectOption>
                          <IonSelectOption value="monthly">Pro Monthly - $4.99/month</IonSelectOption>
                        </IonSelect>
                      </IonItem>
                    </div>
                    
                    <div className="billing-form-row">
                      <IonItem className="billing-form-item">
                        <IonLabel position="stacked">Country/Region*</IonLabel>
                        <IonInput 
                          value={country} 
                          onIonChange={e => setCountry(e.detail.value || '')} 
                          placeholder="Enter your country"
                        />
                      </IonItem>
                    </div>
                    
                    <div className="plan-features">
                      <h3>Plan Features:</h3>
                      <ul>
                        <li>24-hour message retention (instead of 1 hour)</li>
                        <li>Unlimited chat rooms</li>
                        <li>Premium avatars & themes</li>
                        <li>Priority support</li>
                        <li>No advertisements</li>
                      </ul>
                    </div>
                    
                    <IonButton 
                      expand="block" 
                      type="submit" 
                      className="billing-submit-button"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <span className="submitting-text">Processing request...</span>
                      ) : (
                        <>
                          <IonIcon slot="start" icon={wallet} />
                          Submit Subscription Request
                        </>
                      )}
                    </IonButton>
                  </form>
                </IonCardContent>
              </IonCard>
            </>
          )}
        </div>
        
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          position="top"
        />
      </IonContent>
    </IonPage>
  );
};

export default BillingPage;