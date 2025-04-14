import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonBackButton,
  IonButtons,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonButton,
  IonIcon,
  IonToast,
  IonSelect,
  IonSelectOption,
  IonList,
  IonListHeader,
  IonFooter
} from '@ionic/react';
import { 
  paperPlaneOutline, 
  mailOutline, 
  logoGithub, 
  checkmarkCircleOutline, 
  helpCircleOutline,
  alertCircleOutline,
  sparklesOutline,
  informationCircleOutline
} from 'ionicons/icons';
import { apiService } from '../services/api.service';
import './ContactPage.css';
import '../components/BackHeaderComponent.css';
import BackHeaderComponent from '../components/BackHeaderComponent';
import { useAuth } from '../contexts/AuthContext';

const ContactPage: React.FC = () => {
  const { isAuthenticated, currentUser } = useAuth();
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [category, setCategory] = useState<string>('general');
  const [message, setMessage] = useState<string>('');
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastColor, setToastColor] = useState<string>('success');
  const [formSubmitted, setFormSubmitted] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      if (currentUser.name) {
        setName(currentUser.name);
      }
      if (currentUser.email) {
        setEmail(currentUser.email);
      }
    }
  }, [isAuthenticated, currentUser]);

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!name.trim()) errors.name = 'Name is required';
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Email address is invalid';
    }
    if (!subject.trim()) errors.subject = 'Subject is required';
    if (!message.trim()) errors.message = 'Message is required';
    else if (message.trim().length < 10) errors.message = 'Message must be at least 10 characters';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Get the file from the file input element
      const fileInput = document.getElementById('attachment') as HTMLInputElement;
      const attachment = fileInput?.files?.[0];
      
      // Call the API service
      const response = await apiService.submitSupportTicket({
        name,
        email,
        subject,
        category,
        message,
        attachment
      });
      
      if (response.success) {
        setToastMessage('Your message has been sent successfully!');
        setToastColor('success');
        setShowToast(true);
        setFormSubmitted(true);
        
        // Reset form
        setName('');
        setEmail('');
        setSubject('');
        setCategory('general');
        setMessage('');
        
        // Clear the file input
        if (fileInput) {
          fileInput.value = '';
        }
      } else {
        setToastMessage(response.message || 'Failed to send your message. Please try again.');
        setToastColor('danger');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Failed to submit contact form:', error);
      setToastMessage('Failed to send your message. Please try again.');
      setToastColor('danger');
      setShowToast(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch(cat) {
      case 'bug': return alertCircleOutline;
      case 'feature': return sparklesOutline;
      case 'account': return helpCircleOutline;
      default: return helpCircleOutline;
    }
  };

  return (
    <IonPage className="contact-page">
      <BackHeaderComponent title="Contact Us" defaultHref='/support' />
      
      <IonContent className="contact-content">
        <div className="contact-container">
          <div className="contact-header">
            <h1>Get in touch with us!</h1>
            <p>Fill out the form below and we'll get back to you as soon as possible.</p>
          </div>
          
          {formSubmitted ? (
            <IonCard className="contact-success-card">
              <div className="contact-success-glow"></div>
              <IonCardContent className="contact-success-content">
                <IonIcon icon={checkmarkCircleOutline} className="contact-success-icon" />
                <h2>Thank You!</h2>
                <p>Your message has been sent successfully. Our team will get back to you soon.</p>
                <IonButton 
                  expand="block" 
                  className="contact-new-message-btn"
                  onClick={() => setFormSubmitted(false)}
                >
                  Send Another Message
                </IonButton>
              </IonCardContent>
            </IonCard>
          ) : (
            <div className="contact-form-wrapper">
              <IonCard className="contact-form-card">
                <IonCardHeader>
                  <IonCardTitle>Get in Touch</IonCardTitle>
                  {isAuthenticated && currentUser && (
                    <p className="pre-filled-notice">
                      <IonIcon icon={informationCircleOutline} />
                      Form pre-filled with your account information
                    </p>
                  )}
                </IonCardHeader>
                <IonCardContent>
                  <form onSubmit={handleSubmit} className="contact-form">
                    <div className="contact-form-row">
                      <IonItem className={`contact-form-item ${formErrors.name ? 'contact-item-error' : ''}`}>
                        <IonInput 
                          value={name} 
                          onIonChange={e => setName(e.detail.value!)} 
                          placeholder="Your Ghostly Name"
                        />
                      </IonItem>
                      {formErrors.name && <div className="contact-error-message">{formErrors.name}</div>}
                    </div>
                    
                    <div className="contact-form-row">
                      <IonItem className={`contact-form-item ${formErrors.email ? 'contact-item-error' : ''}`}>
                        <IonInput 
                          type="email" 
                          value={email} 
                          onIonChange={e => setEmail(e.detail.value!)} 
                          placeholder="youremail@example.com"
                          disabled={isAuthenticated && !!currentUser?.email}
                        />
                      </IonItem>
                      {formErrors.email && <div className="contact-error-message">{formErrors.email}</div>}
                      {isAuthenticated && currentUser?.email && 
                        <div className="contact-info-message">Using your account email</div>}
                    </div>
                    
                    <div className="contact-form-row">
                      <IonItem className="contact-form-item">
                        <IonSelect value={category} onIonChange={e => setCategory(e.detail.value)} placeholder='Choose One'>
                          <IonSelectOption value="general">General Inquiry</IonSelectOption>
                          <IonSelectOption value="bug">Bug Report</IonSelectOption>
                          <IonSelectOption value="feature">Feature Request</IonSelectOption>
                          <IonSelectOption value="account">Account Issues</IonSelectOption>
                          <IonSelectOption value="other">Other (specify in Message)</IonSelectOption>
                        </IonSelect>
                      </IonItem>
                    </div>
                    
                    <div className="contact-form-row">
                      <IonItem className={`contact-form-item ${formErrors.subject ? 'contact-item-error' : ''}`}>
                        <IonInput 
                          value={subject} 
                          onIonChange={e => setSubject(e.detail.value!)} 
                          placeholder="Subject of Your Message"
                        />
                      </IonItem>
                      {formErrors.subject && <div className="contact-error-message">{formErrors.subject}</div>}
                    </div>
                    
                    <div className="contact-form-row">
                      <IonItem className={`contact-form-item ${formErrors.message ? 'contact-item-error' : ''}`}>
                        <IonTextarea 
                          value={message} 
                          onIonChange={e => setMessage(e.detail.value!)} 
                          rows={6}
                          autoGrow={true}
                          placeholder="Write your message here..."
                        />
                      </IonItem>
                      {formErrors.message && <div className="contact-error-message">{formErrors.message}</div>}
                    </div>

                    <div className="contact-form-row">
                      <IonItem className={`contact-form-item ${formErrors.attachment ? 'contact-item-error' : ''}`}>
                      <input
                        type="file"
                        id="attachment"
                        className="contact-file-input"
                        onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && file.size > 5 * 1024 * 1024) {
                          setFormErrors({...formErrors, attachment: 'File size must be under 5MB'});
                        } else if (file) {
                          setFormErrors({...formErrors, attachment: ''});
                          // Handle file storage in your state as needed
                        }
                        }}
                      />
                      <IonLabel position="stacked">Attachment (optional, max 5MB)</IonLabel>
                      </IonItem>
                      {formErrors.attachment && <div className="contact-error-message">{formErrors.attachment}</div>}
                    </div>
                    
                    <IonButton 
                      expand="block" 
                      type="submit" 
                      className="contact-submit-button"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <span className="contact-submitting">Sending message...</span>
                      ) : (
                        <>
                          <IonIcon slot="start" icon={paperPlaneOutline} />
                          Send Message
                        </>
                      )}
                    </IonButton>
                  </form>
                </IonCardContent>
              </IonCard>

              <IonCard className="contact-info-card">
                <IonCardHeader>
                  <IonCardTitle>Other Ways to Reach Us</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonList lines="none" className="contact-info-list">
                    <IonItem href="mailto:support@ghosttalk.me" className="contact-info-item">
                      <IonIcon icon={mailOutline} slot="start" className="contact-info-icon" />
                      <IonLabel>
                        <h2>Email Support</h2>
                        <p>support@ghosttalk.me</p>
                      </IonLabel>
                    </IonItem>
                    
                    <IonItem href="https://github.com/Lusan-sapkota/GhostTalk" target="_blank" className="contact-info-item">
                      <IonIcon icon={logoGithub} slot="start" className="contact-info-icon" />
                      <IonLabel>
                        <h2>GitHub Repository</h2>
                        <p>Report issues or contribute</p>
                      </IonLabel>
                    </IonItem>
                  </IonList>
                </IonCardContent>
              </IonCard>
            </div>
          )}
        </div>
        
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          color={toastColor}
          position="top"
          className="contact-toast"
        />
      </IonContent>
      
      <IonFooter className="contact-footer">
        <div className="contact-footer-content">
          <p>GhostTalk © {new Date().getFullYear()} - We're here to help</p>
        </div>
      </IonFooter>
    </IonPage>
  );
};

export default ContactPage;