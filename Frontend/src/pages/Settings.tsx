import {
  IonContent,
  IonPage,
  IonList,
  IonItem,
  IonIcon,
  IonLabel,
  IonToggle,
  IonSelect,
  IonSelectOption,
  IonItemDivider,
  IonButton,
  IonAlert,
  IonToast,
  IonChip
} from '@ionic/react';
import { 
  notificationsOutline, 
  moonOutline, 
  sunnyOutline,
  lockClosedOutline,
  contrastOutline,
  eyeOutline,
  trashOutline,
  cloudOutline,
  phonePortraitOutline,
  saveOutline,
  fingerPrintOutline,
  globeOutline,
  logOutOutline,
  peopleOutline,
  personOutline,
  searchOutline,
  mailOutline,
  timeOutline,
  hardwareChipOutline,
  helpCircleOutline,
  informationCircleOutline,
  languageOutline,
  starOutline,
  mailOpenOutline,
  optionsOutline,
} from 'ionicons/icons';
import { useState, useEffect } from 'react';
import BackHeaderComponent from '../components/BackHeaderComponent';
import './Settings.css';
import { useAuth } from '../contexts/AuthContext';
import PullToRefresh from '../components/PullToRefresh';
import { useHistory } from 'react-router';
import themeService from '../services/ThemeService';

const Settings: React.FC = () => {
  // State variables
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [onlineStatus, setOnlineStatus] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [theme, setTheme] = useState('system');
  const [chatBackup, setChatBackup] = useState(true);
  const [messageRequests, setMessageRequests] = useState(true);
  const [bioPrivacy, setBioPrivacy] = useState('all');
  const [genderPrivacy, setGenderPrivacy] = useState('all');
  const [dataSaver, setDataSaver] = useState(false);
  const [enableSearch, setEnableSearch] = useState(true);
  const [chatRetention, setChatRetention] = useState('30days');
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [filteredSections, setFilteredSections] = useState<string[]>([]);
  
  const { isAuthenticated, logout } = useAuth();
  const history = useHistory();

  // Handle search functionality through header
  const handleSearchChange = (value: string) => {
    const searchTerm = value.toLowerCase().trim();
    
    if (!searchTerm) {
      // Reset filter when search is cleared
      setFilteredSections([]);
      return;
    }
    
    // Build a map of sections and their searchable content
    const sections = {
      'appearance': ['theme', 'light', 'dark', 'system default'],
      'notifications': ['notifications', 'enable notifications', 'notification sound', 'ghost whisper', 'chime', 'bell'],
      'privacy': ['privacy', 'security', 'read receipts', 'online status', 'bio visibility', 'gender visibility', 'search visibility', 'message requests', 'app lock'],
      'data': ['data usage', 'data saver', 'back up chats', 'storage', 'chat retention'],
      'more': ['help', 'support', 'about', 'language', 'contact', 'rate', 'feedback'],
      'account': ['account', 'deactivate', 'delete'],
      'session': ['session', 'log out', 'logout', 'devices']
    };
    
    // Determine which sections match the search
    const matches = Object.keys(sections).filter(section => {
      return sections[section as keyof typeof sections].some(text => 
        text.includes(searchTerm)
      );
    });
    
    setFilteredSections(matches);
  };

  const handleSaveSettings = () => {
    // Show saved toast and simulate successful save
    setShowSavedToast(true);
    
    // Here you would also save to backend/storage
    console.log('Settings saved:', {
      theme,
      notificationsEnabled,
      readReceipts,
      onlineStatus,
      chatBackup,
      messageRequests,
      bioPrivacy,
      genderPrivacy,
      enableSearch,
      dataSaver,
      chatRetention
    });
  };
  
  const handleLogout = () => {
    logout();
    history.push('/');
  };

  const handleDeleteAccount = () => {
    // Add API call to delete the account
    console.log('Deleting account...');
    
    // Show a temporary success message
    setShowSavedToast(false); // Close any existing toast
    
    // Use a setTimeout to simulate an API call
    setTimeout(() => {
      // Log the user out
      logout();
      
      // Redirect to home/login
      history.replace('/');
    }, 1500);
  };
  
  // Helper function to check if section should be visible based on search
  const isSectionVisible = (sectionId: string): boolean => {
    if (filteredSections.length === 0) return true;
    return filteredSections.includes(sectionId);
  };

  const [showThemeInfo, setShowThemeInfo] = useState(false);
  const [darkMode, setDarkMode] = useState(themeService.getDarkMode());

  return (
    <IonPage className="gt-settings-page">
      <BackHeaderComponent 
        title="Settings"
        showSearch={true}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search settings..."
      />
      
      <IonContent fullscreen>
        <PullToRefresh 
          pullingText="Pull to refresh settings..."
          refreshingText="Updating settings..."
          fullPageRefresh={true}
        />
        
        <div className="gt-settings-container">
          <IonList className="gt-settings-list">
            {/* Appearance Section */}
            {isSectionVisible('appearance') && (
              <>
                <IonItemDivider className="gt-settings-divider gt-appearance-divider">
                  <IonIcon icon={contrastOutline} />
                  <IonLabel>Appearance</IonLabel>
                </IonItemDivider>
                
                <div className="gt-settings-section gt-appearance-section">
                  <IonItem 
                    className="theme-info-item staggered-item" 
                    onClick={() => setShowThemeInfo(true)} 
                    style={{ cursor: 'pointer' }}
                  >
                    <IonIcon 
                      slot="start" 
                      icon={darkMode ? moonOutline : sunnyOutline} 
                    />
                    <IonLabel>
                      system ({darkMode ? 'Dark' : 'Light'})
                    </IonLabel>
                  </IonItem>
                </div>
              </>
            )}
            
            {/* Notifications Section */}
            {isSectionVisible('notifications') && (
              <>
                <IonItemDivider className="gt-settings-divider gt-notifications-divider">
                  <IonIcon icon={notificationsOutline} />
                  <IonLabel>Notifications</IonLabel>
                </IonItemDivider>
                
                <div className="gt-settings-section gt-notifications-section">
                  <IonItem lines="full" className="gt-settings-item">
                    <IonLabel>Enable Notifications</IonLabel>
                    <IonToggle 
                      checked={notificationsEnabled} 
                      onIonChange={(e) => setNotificationsEnabled(e.detail.checked)} 
                      className="gt-settings-toggle"
                    />
                  </IonItem>
                  
                  <IonItem lines="full" className="gt-settings-item" disabled={!notificationsEnabled}>
                    <IonLabel>Notification Sound</IonLabel>
                    <IonSelect interface="popover" value="ghost" className="gt-settings-select">
                      <IonSelectOption value="ghost">Ghost Whisper</IonSelectOption>
                      <IonSelectOption value="chime">Chime</IonSelectOption>
                      <IonSelectOption value="bell">Bell</IonSelectOption>
                    </IonSelect>
                  </IonItem>
                </div>
              </>
            )}
            
            {/* Privacy & Security Section - Enhanced */}
            {isSectionVisible('privacy') && (
              <>
                <IonItemDivider className="gt-settings-divider gt-privacy-divider">
                  <IonIcon icon={lockClosedOutline} />
                  <IonLabel>Privacy & Security</IonLabel>
                </IonItemDivider>
                
                <div className="gt-settings-section gt-privacy-section">
                  <IonItem lines="full" className="gt-settings-item">
                    <IonIcon slot="start" icon={eyeOutline} />
                    <IonLabel>Read Receipts</IonLabel>
                    <IonToggle 
                      checked={readReceipts} 
                      onIonChange={(e) => setReadReceipts(e.detail.checked)} 
                      className="gt-settings-toggle"
                    />
                  </IonItem>
                  
                  <IonItem lines="full" className="gt-settings-item">
                    <IonIcon slot="start" icon={peopleOutline} />
                    <IonLabel>Show Online Status</IonLabel>
                    <IonToggle 
                      checked={onlineStatus} 
                      onIonChange={(e) => setOnlineStatus(e.detail.checked)} 
                      className="gt-settings-toggle"
                    />
                  </IonItem>
                  
                  <IonItem lines="full" className="gt-settings-item">
                    <IonIcon slot="start" icon={personOutline} />
                    <IonLabel>Gender Visibility</IonLabel>
                    <IonSelect 
                      value={genderPrivacy} 
                      onIonChange={(e) => setGenderPrivacy(e.detail.value)}
                      interface="popover"
                      className="gt-settings-select"
                    >
                      <IonSelectOption value="all">Public</IonSelectOption>
                      <IonSelectOption value="none">Only Me</IonSelectOption>
                    </IonSelect>
                  </IonItem>
                  
                  <IonItem lines="full" className="gt-settings-item">
                    <IonIcon slot="start" icon={globeOutline} />
                    <IonLabel>Bio Visibility</IonLabel>
                    <IonSelect 
                      value={bioPrivacy} 
                      onIonChange={(e) => setBioPrivacy(e.detail.value)}
                      interface="popover"
                      className="gt-settings-select"
                    >
                      <IonSelectOption value="all">Public</IonSelectOption>
                      <IonSelectOption value="none">Only Me</IonSelectOption>
                    </IonSelect>
                  </IonItem>
                  
                  <IonItem lines="full" className="gt-settings-item">
                    <IonIcon slot="start" icon={searchOutline} />
                    <IonLabel>Allow Others To Find Me</IonLabel>
                    <IonToggle 
                      checked={enableSearch}
                      onIonChange={(e) => setEnableSearch(e.detail.checked)}
                      className="gt-settings-toggle"
                    />
                  </IonItem>
                  
                  <IonItem lines="full" className="gt-settings-item">
                    <IonIcon slot="start" icon={mailOutline} />
                    <IonLabel>Message Requests</IonLabel>
                    <IonToggle 
                      checked={messageRequests}
                      onIonChange={(e) => setMessageRequests(e.detail.checked)}
                      className="gt-settings-toggle"
                    />
                  </IonItem>
                  
                  <IonItem lines="full" button routerLink="/logged-devices" className="gt-settings-item">
                    <IonIcon slot="start" icon={hardwareChipOutline} />
                    <IonLabel>Devices Logged In</IonLabel>
                    <IonChip color="primary" outline={true} className="gt-devices-chip">3</IonChip>
                  </IonItem>
                  
                  <IonItem lines="full" className="gt-settings-item">
                    <IonIcon slot="start" icon={fingerPrintOutline} />
                    <IonLabel>App Lock</IonLabel>
                    <IonToggle className="gt-settings-toggle" />
                  </IonItem>
                </div>
              </>
            )}
            
            {/* Data Usage Section - Enhanced */}
            {isSectionVisible('data') && (
              <>
                <IonItemDivider className="gt-settings-divider gt-data-divider">
                  <IonIcon icon={phonePortraitOutline} />
                  <IonLabel>Data Usage</IonLabel>
                </IonItemDivider>
                
                <div className="gt-settings-section gt-data-section">
                  <IonItem lines="full" className="gt-settings-item">
                    <IonLabel>Data Saver Mode</IonLabel>
                    <IonToggle 
                      checked={dataSaver} 
                      onIonChange={(e) => setDataSaver(e.detail.checked)}
                      className="gt-settings-toggle"
                    />
                  </IonItem>
                  
                  <IonItem lines="full" className="gt-settings-item">
                    <IonIcon slot="start" icon={cloudOutline} />
                    <IonLabel>Back Up Chats</IonLabel>
                    <IonToggle 
                      checked={chatBackup} 
                      onIonChange={(e) => setChatBackup(e.detail.checked)} 
                      className="gt-settings-toggle"
                    />
                  </IonItem>
                  
                  <IonItem lines="full" className="gt-settings-item">
                    <IonIcon slot="start" icon={timeOutline} />
                    <IonLabel>Chat Retention</IonLabel>
                    <IonSelect 
                      value={chatRetention} 
                      onIonChange={(e) => setChatRetention(e.detail.value)}
                      interface="popover"
                      className="gt-settings-select"
                    >
                      <IonSelectOption value="24hrs">24 Hours</IonSelectOption>
                      <IonSelectOption value="7days">7 Days</IonSelectOption>
                      <IonSelectOption value="30days">30 Days</IonSelectOption>
                      <IonSelectOption value="forever">Forever</IonSelectOption>
                    </IonSelect>
                  </IonItem>
                  
                  <IonItem lines="full" button routerLink="/storage-usage" className="gt-settings-item">
                    <IonLabel>Storage Usage</IonLabel>
                    <IonChip color="primary" outline={true} className="gt-storage-chip">2.4 GB</IonChip>
                  </IonItem>
                </div>
              </>
            )}
            
            {/* Additional Options Section */}
            {isSectionVisible('more') && (
              <>
                <IonItemDivider className="gt-settings-divider gt-additional-divider">
                  <IonIcon icon={optionsOutline} />
                  <IonLabel>Additional Options</IonLabel>
                </IonItemDivider>
                
                <div className="gt-settings-section gt-additional-section">
                  <IonItem lines="full" button routerLink="/help" className="gt-settings-item">
                    <IonIcon slot="start" icon={helpCircleOutline} />
                    <IonLabel>Help & Support</IonLabel>
                  </IonItem>
                  
                  <IonItem lines="full" button routerLink="/about" className="gt-settings-item">
                    <IonIcon slot="start" icon={informationCircleOutline} />
                    <IonLabel>About GhostTalk</IonLabel>
                  </IonItem>
                  
                  <IonItem lines="full" className="gt-settings-item">
                    <IonIcon slot="start" icon={languageOutline} />
                    <IonLabel>Language</IonLabel>
                    <IonSelect 
                      value="en" 
                      interface="popover"
                      className="gt-settings-select"
                    >
                      <IonSelectOption value="en">English</IonSelectOption>
                      <IonSelectOption value="es">Español</IonSelectOption>
                      <IonSelectOption value="fr">Français</IonSelectOption>
                      <IonSelectOption value="de">Deutsch</IonSelectOption>
                    </IonSelect>
                  </IonItem>
                  
                  <IonItem lines="full" button onClick={() => window.open('mailto:support@ghosttalk.app')} className="gt-settings-item">
                    <IonIcon slot="start" icon={mailOpenOutline} />
                    <IonLabel>Contact Us</IonLabel>
                  </IonItem>
                  
                  <IonItem lines="full" button onClick={() => window.open('https://appstore.com/ghosttalk')} className="gt-settings-item">
                    <IonIcon slot="start" icon={starOutline} />
                    <IonLabel>Rate the App</IonLabel>
                  </IonItem>
                </div>
              </>
            )}
            
            {/* Account Section */}
            {/* {isAuthenticated && isSectionVisible('account') && ( */}
              <>
                <IonItemDivider className="gt-settings-divider gt-danger-divider">
                  <IonIcon icon={trashOutline} color="danger" />
                  <IonLabel color="danger">Account</IonLabel>
                </IonItemDivider>
                
                <div className="gt-settings-section gt-danger-section">
                  <IonItem lines="full" button routerLink="/deactivate-account" className="gt-settings-item">
                    <IonLabel color="medium">Deactivate Account</IonLabel>
                  </IonItem>
                  
                  <IonItem 
                    lines="full" 
                    button 
                    onClick={() => setDeleteConfirm(true)}
                    className="gt-settings-item gt-delete-account-item"
                  >
                    <IonIcon slot="start" icon={trashOutline} color="danger" />
                    <IonLabel color="danger">Delete Account</IonLabel>
                  </IonItem>
                </div>
              </>
            {/* )} */}
            
            {/* Logout Section */}
            {isSectionVisible('session') && (
              <>
                <IonItemDivider className="gt-settings-divider gt-logout-divider">
                  <IonIcon icon={logOutOutline} color="medium" />
                  <IonLabel color="medium">Session</IonLabel>
                </IonItemDivider>
                
                <div className="gt-settings-section gt-logout-section">
                  <IonItem 
                    lines="none" 
                    button 
                    onClick={() => setLogoutConfirm(true)}
                    className="gt-settings-item gt-logout-item"
                  >
                    <IonIcon slot="start" icon={logOutOutline} color="medium" />
                    <IonLabel color="medium">Log Out</IonLabel>
                  </IonItem>
                </div>
              </>
            )}
          </IonList>
          
          <div className="gt-settings-actions">
            <IonButton 
              expand="block" 
              onClick={handleSaveSettings}
              className="gt-settings-save-button"
            >
              <IonIcon slot="start" icon={saveOutline} />
              Save Settings
            </IonButton>
          </div>
        </div>

        {/* Alerts */}
        <IonAlert
          isOpen={deleteConfirm}
          onDidDismiss={() => setDeleteConfirm(false)}
          header="Delete Account"
          message="This will permanently delete your account and all your data. This action cannot be undone."
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel',
              cssClass: 'gt-cancel-button'
            },
            {
              text: 'Delete',
              role: 'destructive',
              cssClass: 'gt-delete-button',
              handler: handleDeleteAccount
            }
          ]}
        />

        <IonAlert
          isOpen={showThemeInfo}
          onDidDismiss={() => setShowThemeInfo(false)}
          header="System Theme"
          message="GhostTalk follows your device's theme setting. To change between light and dark mode, update your system settings."
          buttons={['Got it!']}
        />
        
        <IonAlert
          isOpen={logoutConfirm}
          onDidDismiss={() => setLogoutConfirm(false)}
          header="Log Out"
          message="Are you sure you want to log out of your account?"
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel',
              cssClass: 'gt-cancel-button'
            },
            {
              text: 'Log Out',
              handler: handleLogout,
              cssClass: 'gt-logout-button'
            }
          ]}
        />
        
        <IonToast
          isOpen={showSavedToast}
          onDidDismiss={() => setShowSavedToast(false)}
          message="Settings saved successfully!"
          duration={2000}
          position="bottom"
          color="success"
          buttons={[
            {
              icon: 'close',
              role: 'cancel',
              side: 'end'
            }
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default Settings;