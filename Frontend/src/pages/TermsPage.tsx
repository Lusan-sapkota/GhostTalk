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
  IonBadge,
  IonGrid,
  IonRow,
  IonCol,
  IonChip,
  IonList,
  IonItemDivider
} from '@ionic/react';
import {
  documentTextOutline,
  alertCircleOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  mailOutline,
  chevronDownOutline,
  shieldOutline,
  timeOutline,
  helpCircleOutline,
  arrowUpCircleOutline,
  informationCircleOutline,
  personOutline
} from 'ionicons/icons';
import './TermsPage.css';
import BackHeaderComponent from '../components/BackHeaderComponent';
import { useEffect, useState } from 'react';

const TermsPage: React.FC = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Listen for scroll events to show/hide scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      setShowScrollTop(scrollTop > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Scroll to section function
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <IonPage className="ghost-appear">
      <BackHeaderComponent title="Terms & Conditions" />
      <IonContent fullscreen>
        <div className="terms-container">
          {/* Header Section */}
          <div className="terms-header ghost-shadow">
            <div className="terms-icon-container">
              <div className="terms-icon">
                <IonIcon icon={documentTextOutline} />
              </div>
              <div className="pulse-ring"></div>
            </div>
            <h1>Terms & Conditions</h1>
            <p className="last-updated">Last Updated: {new Date().toLocaleDateString()}</p>
          </div>
          
          {/* Introduction Card */}
          <div className="terms-intro">
            <IonCard className="ghost-shadow">
              <IonCardContent>
                <p>
                  Welcome to GhostTalk! These Terms and Conditions ("Terms") govern your use of our application and 
                  services. By using GhostTalk, you agree to these Terms. If you do not agree with any part of these 
                  Terms, you should not use our application.
                </p>
                <p>
                  Please read these Terms carefully as they contain important information about your legal rights, 
                  remedies, and obligations.
                </p>
              </IonCardContent>
            </IonCard>
          </div>
          
          {/* Navigate to Sections */}
          <div className="terms-navigation">
            <IonCard className="ghost-shadow">
              <IonCardHeader>
                <IonCardTitle style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <IonIcon icon={informationCircleOutline} /> Quick Navigation
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonGrid>
                  <IonRow>
                    <IonCol size="12" size-md="6">
                      <IonButton 
                        expand="block" 
                        fill="outline" 
                        className="nav-button"
                        onClick={() => scrollToSection('section-acceptance')}
                      >
                        1. Acceptance
                      </IonButton>
                    </IonCol>
                    <IonCol size="12" size-md="6">
                      <IonButton 
                        expand="block" 
                        fill="outline" 
                        className="nav-button"
                        onClick={() => scrollToSection('section-account')}
                      >
                        2. Account Registration
                      </IonButton>
                    </IonCol>
                    <IonCol size="12" size-md="6">
                      <IonButton 
                        expand="block" 
                        fill="outline" 
                        className="nav-button"
                        onClick={() => scrollToSection('section-conduct')}
                      >
                        3. User Conduct
                      </IonButton>
                    </IonCol>
                    <IonCol size="12" size-md="6">
                      <IonButton 
                        expand="block" 
                        fill="outline" 
                        className="nav-button"
                        onClick={() => scrollToSection('section-content')}
                      >
                        4. User Content
                      </IonButton>
                    </IonCol>
                    <IonCol size="12" size-md="6">
                      <IonButton 
                        expand="block" 
                        fill="outline" 
                        className="nav-button"
                        onClick={() => scrollToSection('section-intellectual')}
                      >
                        5. Intellectual Property
                      </IonButton>
                    </IonCol>
                    <IonCol size="12" size-md="6">
                      <IonButton 
                        expand="block" 
                        fill="outline" 
                        className="nav-button"
                        onClick={() => scrollToSection('section-privacy')}
                      >
                        6. Privacy
                      </IonButton>
                    </IonCol>
                    <IonCol size="12" size-md="6">
                      <IonButton 
                        expand="block" 
                        fill="outline" 
                        className="nav-button"
                        onClick={() => scrollToSection('section-disclaimer')}
                      >
                        7. Disclaimers
                      </IonButton>
                    </IonCol>
                    <IonCol size="12" size-md="6">
                      <IonButton 
                        expand="block" 
                        fill="outline" 
                        className="nav-button"
                        onClick={() => scrollToSection('section-limitation')}
                      >
                        8. Limitation of Liability
                      </IonButton>
                    </IonCol>
                  </IonRow>
                </IonGrid>
              </IonCardContent>
            </IonCard>
          </div>
          
          {/* Key Points Summary */}
          <div className="terms-summary">
            <IonCard className="ghost-shadow">
              <IonCardHeader>
                <IonCardTitle>
                  <span className="section-icon-terms">📋</span> Summary of Key Points
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonGrid>
                  <IonRow>
                    <IonCol size="12" size-md="6">
                      <div className="summary-point">
                        <div className="summary-icon green">
                          <IonIcon icon={checkmarkCircleOutline} />
                        </div>
                        <div>
                          <h3>Your Content</h3>
                          <p>You retain ownership of the content you share on GhostTalk</p>
                        </div>
                      </div>
                    </IonCol>
                    
                    <IonCol size="12" size-md="6">
                      <div className="summary-point">
                        <div className="summary-icon green">
                          <IonIcon icon={checkmarkCircleOutline} />
                        </div>
                        <div>
                          <h3>Privacy First</h3>
                          <p>We're committed to protecting your privacy and data security</p>
                        </div>
                      </div>
                    </IonCol>
                    
                    <IonCol size="12" size-md="6">
                      <div className="summary-point">
                        <div className="summary-icon red">
                          <IonIcon icon={closeCircleOutline} />
                        </div>
                        <div>
                          <h3>Prohibited Activities</h3>
                          <p>Any illegal, harmful, or abusive activities are not allowed</p>
                        </div>
                      </div>
                    </IonCol>
                    
                    <IonCol size="12" size-md="6">
                      <div className="summary-point">
                        <div className="summary-icon red">
                          <IonIcon icon={closeCircleOutline} />
                        </div>
                        <div>
                          <h3>Age Restriction</h3>
                          <p>Users must be at least 13 years old to use GhostTalk</p>
                        </div>
                      </div>
                    </IonCol>
                  </IonRow>
                </IonGrid>
                
                <div className="terms-callout">
                  <IonIcon icon={alertCircleOutline} />
                  <div>
                    <strong>Note:</strong> This summary is for convenience only and does not replace 
                    the full Terms and Conditions below.
                  </div>
                </div>
              </IonCardContent>
            </IonCard>
          </div>
          
          {/* Main Terms & Conditions Content */}
          <IonItemDivider className="terms-divider">
            <IonLabel>Full Terms & Conditions</IonLabel>
          </IonItemDivider>
          
          <div className="terms-sections-container">
            <IonAccordionGroup className="terms-sections" multiple={true}>
              {/* Section 1: Acceptance */}
              <IonAccordion value="acceptance" id="section-acceptance" className="terms-accordion">
                <IonItem slot="header" className="terms-accordion-header">
                  <div className="section-number">1</div>
                  <IonLabel>Acceptance of Terms</IonLabel>
                  <IonChip slot="end" color="primary" className="section-badge">Essential</IonChip>
                </IonItem>
                <div className="ion-padding accordion-content" slot="content">
                  <p>
                    By accessing or using the GhostTalk application ("App"), you agree to be bound by these Terms and Conditions.
                    If you disagree with any part of these Terms, you may not access or use the App.
                  </p>
                  <p>
                    We may modify these Terms at any time. We will provide notice of any material changes through the App or by other means.
                    Your continued use of GhostTalk after such modifications constitutes your acceptance of the modified Terms.
                  </p>
                  <div className="terms-info-box">
                    <IonIcon icon={timeOutline} />
                    <p>
                    We recommend checking these Terms occasionally. We'll let you know if any major changes affect your use of the app.
                    </p>
                  </div>
                </div>
              </IonAccordion>
              
              {/* Section 2: Account Registration */}
              <IonAccordion value="account" id="section-account" className="terms-accordion">
                <IonItem slot="header" className="terms-accordion-header">
                  <div className="section-number">2</div>
                  <IonLabel>Account Registration & Security</IonLabel>
                  <IonChip slot="end" color="primary" className="section-badge">Essential</IonChip>
                </IonItem>
                <div className="ion-padding accordion-content" slot="content">
                  <h3>Account Creation</h3>
                  <p>
                    To use certain features of the App, you must create an account. You agree to provide accurate, current, and complete 
                    information during the registration process and to update such information to keep it accurate, current, and complete.
                  </p>
                  
                  <h3>Age Restrictions</h3>
                  <p>
                    You must be at least 13 years old to create an account and use the App. By creating an account, you represent and 
                    warrant that you are at least 13 years old.
                  </p>
                  
                  <h3>Account Security</h3>
                  <p>
                    You are responsible for:
                  </p>
                  <ul className="terms-list">
                    <li>Maintaining the confidentiality of your account password</li>
                    <li>Restricting access to your account</li>
                    <li>All activities that occur under your account</li>
                  </ul>
                  
                  <p>
                    You must notify us immediately upon becoming aware of any breach of security or unauthorized 
                    use of your account.
                  </p>
                  
                  <div className="terms-info-box">
                    <IonIcon icon={shieldOutline} />
                    <p>
                      We strongly recommend using a unique, strong password and enabling any available 
                      additional security features such as two-factor authentication.
                    </p>
                  </div>
                </div>
              </IonAccordion>
              
              {/* Section 3: User Conduct */}
              <IonAccordion value="conduct" id="section-conduct" className="terms-accordion">
                <IonItem slot="header" className="terms-accordion-header">
                  <div className="section-number">3</div>
                  <IonLabel>User Conduct</IonLabel>
                  <IonChip slot="end" color="warning" className="section-badge">Important</IonChip>
                </IonItem>
                <div className="ion-padding accordion-content" slot="content">
                  <p>
                    You agree not to use the App to:
                  </p>
                  <ul className="terms-list">
                    <li>
                      Post, transmit, or distribute content that is illegal, harmful, threatening, abusive, harassing, defamatory, 
                      vulgar, obscene, or otherwise objectionable
                    </li>
                    <li>
                      Impersonate any person or entity, falsely state or otherwise misrepresent your affiliation with a person or entity
                    </li>
                    <li>
                      Interfere with or disrupt the operation of the App or servers or networks connected to the App
                    </li>
                    <li>
                      Attempt to gain unauthorized access to any portion of the App or any other accounts, computer systems, or networks
                    </li>
                    <li>
                      Use the App for any illegal purpose, or in violation of any local, state, national, or international law
                    </li>
                    <li>
                      Harvest or collect email addresses or personal information of other users
                    </li>
                    <li>
                      Distribute malware, viruses, or any other technologies that may harm GhostTalk or the interests of other users
                    </li>
                  </ul>
                  
                  <div className="terms-callout warning">
                    <IonIcon icon={alertCircleOutline} />
                    <div>
                      <strong>Important:</strong> Violations of these conduct rules may result in account suspension or termination 
                      without prior notice. We maintain a zero-tolerance policy for certain violations, particularly those involving 
                      illegal activities or harm to other users.
                    </div>
                  </div>
                </div>
              </IonAccordion>
              
              {/* Section 4: User Content */}
              <IonAccordion value="content" id="section-content" className="terms-accordion">
                <IonItem slot="header" className="terms-accordion-header">
                  <div className="section-number">4</div>
                  <IonLabel>User Content</IonLabel>
                  <IonChip slot="end" color="secondary" className="section-badge">Key</IonChip>
                </IonItem>
                <div className="ion-padding accordion-content" slot="content">
                  <h3>Ownership</h3>
                  <p>
                    You retain all ownership rights to the content you post, upload, or share through the App ("User Content"). 
                    By submitting User Content, you grant us a limited license to transmit, store, and display this content solely 
                    for the purpose of providing and improving the App's services.
                  </p>
                  
                  <h3>Content Responsibility</h3>
                  <p>
                    You are solely responsible for your User Content and the consequences of posting or publishing it. You represent and 
                    warrant that:
                  </p>
                  <ul className="terms-list">
                    <li>You own or have the necessary licenses, rights, consents, and permissions to use and authorize us to use all 
                    intellectual property rights in and to your User Content</li>
                    <li>Your User Content does not infringe or violate the rights of any third party</li>
                  </ul>
                  
                  <h3>Content Removal</h3>
                  <p>
                    We reserve the right to remove any User Content that violates these Terms or that we determine to be 
                    harmful, offensive, or otherwise inappropriate, without prior notice.
                  </p>
                  
                  <div className="terms-info-box">
                    <IonIcon icon={informationCircleOutline} />
                    <p>
                      While we strive to protect users' privacy and content ownership, we may need to review content 
                      in response to legitimate legal requests or reported violations.
                    </p>
                  </div>
                </div>
              </IonAccordion>
              
              {/* Section 5: Intellectual Property */}
              <IonAccordion value="intellectual" id="section-intellectual" className="terms-accordion">
                <IonItem slot="header" className="terms-accordion-header">
                  <div className="section-number">5</div>
                  <IonLabel>Intellectual Property</IonLabel>
                  <IonChip slot="end" color="medium" className="section-badge">Standard</IonChip>
                </IonItem>
                <div className="ion-padding accordion-content" slot="content">
                  <h3>GhostTalk Property</h3>
                  <p>
                    The App, including its design, graphics, text, and other content (excluding User Content), is protected by copyright, 
                    trademark, and other intellectual property laws. GhostTalk and its licensors own all right, title, and interest in and 
                    to the App.
                  </p>
                  
                  <h3>Limited License</h3>
                  <p>
                    Subject to these Terms, we grant you a limited, non-exclusive, non-transferable, and revocable license to use the App 
                    for personal, non-commercial purposes.
                  </p>
                  
                  <h3>Restrictions</h3>
                  <p>
                    You may not:
                  </p>
                  <ul className="terms-list">
                    <li>Copy, modify, or create derivative works based on the App</li>
                    <li>Distribute, publicly display, publicly perform, or otherwise use the App in any manner not expressly authorized by these Terms</li>
                    <li>Reverse engineer, decompile, disassemble, or otherwise attempt to discover the source code of the App</li>
                    <li>Remove, alter, or obscure any copyright, trademark, or other proprietary notices on the App</li>
                  </ul>
                </div>
              </IonAccordion>
              
              {/* Section 6: Privacy */}
              <IonAccordion value="privacy" id="section-privacy" className="terms-accordion">
                <IonItem slot="header" className="terms-accordion-header">
                  <div className="section-number">6</div>
                  <IonLabel>Privacy</IonLabel>
                  <IonChip slot="end" color="secondary" className="section-badge">Key</IonChip>
                </IonItem>
                <div className="ion-padding accordion-content" slot="content">
                  <p>
                    Your privacy is important to us. Our <a href="/privacy" className="terms-link">Privacy Policy</a> explains how we collect, use, 
                    and protect your personal information. By using the App, you agree to the collection and use of information 
                    in accordance with our Privacy Policy.
                  </p>
                  
                  <div className="privacy-highlights">
                    <div className="highlight-item">
                      <IonIcon icon={shieldOutline} />
                      <div>
                        <h4>End-to-End Encryption</h4>
                        <p>Your messages are encrypted and secure</p>
                      </div>
                    </div>
                    
                    <div className="highlight-item">
                      <IonIcon icon={personOutline} />
                      <div>
                        <h4>Data Control</h4>
                        <p>You control your personal information</p>
                      </div>
                    </div>
                    
                    <div className="highlight-item">
                      <IonIcon icon={timeOutline} />
                      <div>
                        <h4>Limited Retention</h4>
                        <p>We don't store messages after delivery</p>
                      </div>
                    </div>
                  </div>
                  
                  <IonButton expand="block" href="/privacy" className="privacy-button">
                    Read Our Full Privacy Policy
                  </IonButton>
                </div>
              </IonAccordion>
              
              {/* Section 7: Disclaimer of Warranties */}
              <IonAccordion value="disclaimer" id="section-disclaimer" className="terms-accordion">
                <IonItem slot="header" className="terms-accordion-header">
                  <div className="section-number">7</div>
                  <IonLabel>Disclaimer of Warranties</IonLabel>
                  <IonChip slot="end" color="medium" className="section-badge">Legal</IonChip>
                </IonItem>
                <div className="ion-padding accordion-content" slot="content">
                  <div className="legal-section">
                    <p>
                      THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, 
                      INCLUDING, BUT NOT LIMITED TO, IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, 
                      AND NON-INFRINGEMENT.
                    </p>
                    <p>
                      WE DO NOT WARRANT THAT:
                    </p>
                    <ul className="terms-list">
                      <li>THE APP WILL MEET YOUR REQUIREMENTS</li>
                      <li>THE APP WILL BE UNINTERRUPTED, TIMELY, SECURE, OR ERROR-FREE</li>
                      <li>THE RESULTS THAT MAY BE OBTAINED FROM THE USE OF THE APP WILL BE ACCURATE OR RELIABLE</li>
                      <li>THE QUALITY OF ANY PRODUCTS, SERVICES, INFORMATION, OR OTHER MATERIAL PURCHASED OR OBTAINED BY YOU THROUGH THE APP WILL MEET YOUR EXPECTATIONS</li>
                      <li>ANY ERRORS IN THE APP WILL BE CORRECTED</li>
                    </ul>
                  </div>
                  
                  <div className="terms-info-box">
                    <IonIcon icon={helpCircleOutline} />
                    <p>
                      This means that while we strive to provide a reliable service, we cannot guarantee the App will always function 
                      perfectly or meet every user's specific needs.
                    </p>
                  </div>
                </div>
              </IonAccordion>
              
              {/* Section 8: Limitation of Liability */}
              <IonAccordion value="limitation" id="section-limitation" className="terms-accordion">
                <IonItem slot="header" className="terms-accordion-header">
                  <div className="section-number">8</div>
                  <IonLabel>Limitation of Liability</IonLabel>
                  <IonChip slot="end" color="medium" className="section-badge">Legal</IonChip>
                </IonItem>
                <div className="ion-padding accordion-content" slot="content">
                  <div className="legal-section">
                    <p>
                      TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL GHOSTTALK, ITS AFFILIATES, DIRECTORS, 
                      EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, 
                      OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, 
                      GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
                    </p>
                    <ul className="terms-list">
                      <li>YOUR ACCESS TO OR USE OF OR INABILITY TO ACCESS OR USE THE APP</li>
                      <li>ANY CONDUCT OR CONTENT OF ANY THIRD PARTY ON THE APP</li>
                      <li>ANY CONTENT OBTAINED FROM THE APP</li>
                      <li>UNAUTHORIZED ACCESS, USE, OR ALTERATION OF YOUR TRANSMISSIONS OR CONTENT</li>
                    </ul>
                    <p>
                      IN NO EVENT SHALL GHOSTTALK'S AGGREGATE LIABILITY FOR ALL CLAIMS RELATING TO THE APP EXCEED THE AMOUNT YOU 
                      PAID US, IF ANY, IN THE PAST SIX MONTHS FOR THE APP.
                    </p>
                  </div>
                  
                  <div className="terms-info-box">
                    <IonIcon icon={helpCircleOutline} />
                    <p>
                      This section limits what we can be held legally responsible for if something goes wrong 
                      while using GhostTalk.
                    </p>
                  </div>
                </div>
              </IonAccordion>
              
              {/* Section 9: Contact Information */}
              <IonAccordion value="contact" id="section-contact" className="terms-accordion">
                <IonItem slot="header" className="terms-accordion-header">
                  <div className="section-number">9</div>
                  <IonLabel>Contact Information</IonLabel>
                  <IonChip slot="end" color="success" className="section-badge">Support</IonChip>
                </IonItem>
                <div className="ion-padding accordion-content" slot="content">
                  <p>
                    If you have any questions about these Terms, please contact us at:
                  </p>
                  
                  <div className="contact-methods">
                    <div className="contact-method">
                      <IonIcon icon={mailOutline} />
                      <div>
                        <strong>Email:</strong> support@ghosttalk.me
                      </div>
                    </div>
                  </div>
                  
                  <IonButton expand="block" href="/support" className="contact-button">
                    <IonIcon slot="start" icon={mailOutline} />
                    Contact Support
                  </IonButton>
                </div>
              </IonAccordion>
            </IonAccordionGroup>
          </div>
          
          {/* Footer */}
          <div className="terms-footer">
            <p>Thank you for using GhostTalk and reviewing our Terms & Conditions.</p>
            <p>© {new Date().getFullYear()} GhostTalk. All rights reserved.</p>
          </div>
        </div>
        
        {/* Scroll to top button */}
        {showScrollTop && (
          <div className="scroll-to-top" onClick={scrollToTop}>
            <IonIcon icon={arrowUpCircleOutline} />
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default TermsPage;