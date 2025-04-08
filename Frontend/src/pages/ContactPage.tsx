import React, { useState } from 'react';
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
  IonListHeader
} from '@ionic/react';
import { paperPlaneOutline, mailOutline, logoGithub, checkmarkCircleOutline } from 'ionicons/icons';
import { apiService } from '../services/api.service';
import './ContactPage.css';

const ContactPage: React.FC = () => {
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

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!name.trim()) errors.name = 'Name is required';
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Email is invalid';
    }
    if (!subject.trim()) errors.subject = 'Subject is required';
    if (!message.trim()) errors.message = 'Message is required';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      // Replace with your actual API call to submit tickets
    //   await apiService.post('/support/ticket', {
    //     name,
    //     email,
    //     subject,
    //     category,
    //     message
    //   });
      
      setToastMessage('Your ticket has been submitted successfully!');
      setToastColor('success');
      setShowToast(true);
      setFormSubmitted(true);
      
      // Reset form
      setName('');
      setEmail('');
      setSubject('');
      setCategory('general');
      setMessage('');
    } catch (error) {
      console.error('Failed to submit ticket:', error);
      setToastMessage('Failed to submit your ticket. Please try again.');
      setToastColor('danger');
      setShowToast(true);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary" className="ghost-shadow">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>Contact Us</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent>
        <div className="contact-container">
          {formSubmitted ? (
            <IonCard className="success-card ghost-float">
              <IonCardContent className="success-content">
                <IonIcon icon={checkmarkCircleOutline} className="success-icon" />
                <h2>Thank You!</h2>
                <p>Your ticket has been submitted successfully. Our team will get back to you soon.</p>
                <IonButton expand="block" onClick={() => setFormSubmitted(false)}>Submit Another Ticket</IonButton>
              </IonCardContent>
            </IonCard>
          ) : (
            <IonCard className="contact-form-card ghost-float">
              <IonCardHeader>
                <IonCardTitle>Submit a Support Ticket</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <form onSubmit={handleSubmit}>
                  <IonItem className={formErrors.name ? 'ion-invalid' : ''}>
                    <IonLabel position="floating">Name</IonLabel>
                    <IonInput 
                      value={name} 
                      onIonChange={e => setName(e.detail.value!)} 
                      required
                    />
                    {formErrors.name && <div className="error-message">{formErrors.name}</div>}
                  </IonItem>
                  
                  <IonItem className={formErrors.email ? 'ion-invalid' : ''}>
                    <IonLabel position="floating">Email</IonLabel>
                    <IonInput 
                      type="email" 
                      value={email} 
                      onIonChange={e => setEmail(e.detail.value!)} 
                      required
                    />
                    {formErrors.email && <div className="error-message">{formErrors.email}</div>}
                  </IonItem>
                  
                  <IonItem>
                    <IonLabel position="floating">Category</IonLabel>
                    <IonSelect value={category} onIonChange={e => setCategory(e.detail.value)}>
                      <IonSelectOption value="general">General Inquiry</IonSelectOption>
                      <IonSelectOption value="bug">Bug Report</IonSelectOption>
                      <IonSelectOption value="feature">Feature Request</IonSelectOption>
                      <IonSelectOption value="account">Account Issues</IonSelectOption>
                      <IonSelectOption value="other">Other</IonSelectOption>
                    </IonSelect>
                  </IonItem>
                  
                  <IonItem className={formErrors.subject ? 'ion-invalid' : ''}>
                    <IonLabel position="floating">Subject</IonLabel>
                    <IonInput 
                      value={subject} 
                      onIonChange={e => setSubject(e.detail.value!)} 
                      required
                    />
                    {formErrors.subject && <div className="error-message">{formErrors.subject}</div>}
                  </IonItem>
                  
                  <IonItem className={formErrors.message ? 'ion-invalid' : ''}>
                    <IonLabel position="floating">Message</IonLabel>
                    <IonTextarea 
                      value={message} 
                      onIonChange={e => setMessage(e.detail.value!)} 
                      rows={6}
                      required
                    />
                    {formErrors.message && <div className="error-message">{formErrors.message}</div>}
                  </IonItem>
                  
                  <IonButton 
                    expand="block" 
                    type="submit" 
                    className="submit-button"
                  >
                    <IonIcon slot="start" icon={paperPlaneOutline} />
                    Submit Ticket
                  </IonButton>
                </form>
              </IonCardContent>
            </IonCard>
          )}
          
          <IonCard className="contact-info-card ghost-float">
            <IonCardHeader>
              <IonCardTitle>Other Ways to Contact Us</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonList lines="none">
                <IonListHeader>Direct Contact</IonListHeader>
                <IonItem href="mailto:support@ghosttalk.app" className="contact-item">
                  <IonIcon icon={mailOutline} slot="start" color="primary" />
                  <IonLabel>
                    <h2>Email Support</h2>
                    <p>support@ghosttalk.app</p>
                  </IonLabel>
                </IonItem>
                
                <IonListHeader>Development</IonListHeader>
                <IonItem href="https://github.com/yourusername/ghosttalk" target="_blank" className="contact-item">
                  <IonIcon icon={logoGithub} slot="start" color="dark" />
                  <IonLabel>
                    <h2>GitHub Repository</h2>
                    <p>Report issues or contribute to GhostTalk</p>
                  </IonLabel>
                </IonItem>
              </IonList>
            </IonCardContent>
          </IonCard>
        </div>
        
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          color={toastColor}
        />
      </IonContent>
    </IonPage>
  );
};

export default ContactPage;