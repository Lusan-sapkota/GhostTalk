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
  IonChip,
  IonLoading,
  IonSpinner,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonRadioGroup,
  IonRadio
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
  heartCircleOutline,
  personRemoveOutline,
} from 'ionicons/icons';
import { useState, useEffect } from 'react';
import BackHeaderComponent from '../components/BackHeaderComponent';
import './Settings.css';
import { useAuth } from '../contexts/AuthContext';
import PullToRefresh from '../components/PullToRefresh';
import { useHistory } from 'react-router';
import themeService from '../services/ThemeService';
import { apiService } from '../services/api.service';

const Settings: React.FC = () => {
  // State variables
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [onlineStatus, setOnlineStatus] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deactivateConfirm, setDeactivateConfirm] = useState(false);
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
  const [favouritesRequests, setFavouritesRequests] = useState(true);
  const [usernamePrivacy, setUsernamePrivacy] = useState('all');
  const [memberSincePrivacy, setMemberSincePrivacy] = useState('all');
  const [emailPrivacy, setEmailPrivacy] = useState('all');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedAlert, setShowUnsavedAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveInProgress, setSaveInProgress] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [notificationSound, setNotificationSound] = useState('ghost');
  const [showRetentionModal, setShowRetentionModal] = useState(false);
  const [proStatus, setProStatus] = useState<string>('free');
  // Define isPro based on proStatus
  const isPro = proStatus === 'monthly' || proStatus === 'yearly';
  
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
      'privacy': ['privacy', 'security', 'read receipts', 'bio visibility', 'email visibility', 'member since visibility', 'username visibility', 'gender visibility', 'search visibility', 'message requests', 'favouritesRequests', 'app lock'],
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

  const handleSaveSettings = async () => {
    try {
      setSaveInProgress(true);
      
      // Create the settings object with explicit type mapping
      const settingsToUpdate = {
        requireMessageApproval: messageRequests,
        enableSearch: enableSearch,
        readReceipts: readReceipts,
        // Convert UI values to backend enum values (public/private)
        genderVisibility: mapUIToVisibility(genderPrivacy),
        bioVisibility: mapUIToVisibility(bioPrivacy),
        emailVisibility: mapUIToVisibility(emailPrivacy),
        memberSinceVisibility: mapUIToVisibility(memberSincePrivacy),
        // IMPORTANT: Note the singular vs plural field name
        favoritesRequest: favouritesRequests, // Fixed field name (singular)
        twoFactorAuthEnabled: twoFactorEnabled,
        chatRetention: chatRetention,
        enableNotifications: notificationsEnabled,
        notificationsSounds: notificationSound
      };
      
      console.log("Saving settings:", settingsToUpdate); // Debug log
      
      const response = await apiService.updateUserSettings(settingsToUpdate);
      
      if (response.success) {
        // Show success toast
        setShowSavedToast(true);
        
        // IMPORTANT: Set hasUnsavedChanges to false BEFORE reloading settings
        setHasUnsavedChanges(false);
        
        // Add a small delay before reloading to ensure state update is processed
        setTimeout(() => {
          loadUserSettings().catch(err => 
            console.error("Error reloading settings:", err)
          );
        }, 100);
      } else {
        console.error('Failed to save settings:', response.message);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaveInProgress(false);
    }
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

  const handleBackButton = (e?: any) => {
    if (hasUnsavedChanges) {
      // If there are unsaved changes, show confirmation
      setShowUnsavedAlert(true);
      if (e) e.preventDefault();
    } else {
      // If no changes, just go back
      history.goBack();
    }
  };

  const discardChangesAndExit = () => {
    // First reset the unsaved changes flag to prevent the block from triggering
    setHasUnsavedChanges(false);
    
    // Use a small timeout to ensure state is updated before navigation
    setTimeout(() => {
      history.goBack();
    }, 10);
  };

  const settingChanged = () => {
    setHasUnsavedChanges(true);
  };

  // Modify your useEffect for history blocking to prevent showing multiple alerts
  useEffect(() => {
    // This creates a listener that runs before any history navigation
    const unblock = history.block(() => {
      if (hasUnsavedChanges) {
        // Show our custom alert but don't show browser alert
        setShowUnsavedAlert(true);
        return false; // Prevent default navigation
      }
      return undefined; // Allow navigation if no changes
    });
    
    // Cleanup the history blocker when component unmounts
    return () => {
      unblock();
    };
  }, [hasUnsavedChanges, history]);

  // Update the hardware back button handler to not show its own alert
  useEffect(() => {
    const handleHardwareBackButton = (e: CustomEvent) => {
      if (hasUnsavedChanges) {
        // Prevent default back action
        e.preventDefault();
        // Show our custom alert only if it's not already showing
        if (!showUnsavedAlert) {
          setShowUnsavedAlert(true);
        }
        return false;
      }
      return true;
    };

    document.addEventListener('ionBackButton', handleHardwareBackButton as any);
    
    return () => {
      document.removeEventListener('ionBackButton', handleHardwareBackButton as any);
    };
  }, [hasUnsavedChanges, showUnsavedAlert]); // Add showUnsavedAlert as dependency

  // Load user settings on component mount
  useEffect(() => {
    loadUserSettings();
  }, []);

  const loadUserSettings = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getUserSettings();
      
      if (response.success) {
        const settings = response.settings;
        console.log("Loaded settings:", settings); // Debug log
        
        // Update state with backend values - using correct field names
        setMessageRequests(settings.requireMessageApproval ?? true);
        setEnableSearch(settings.enableSearch ?? true);
        setReadReceipts(settings.readReceipts ?? true);
        
        // Convert visibility enum values to match our UI options
        setGenderPrivacy(mapVisibilityToUI(settings.genderVisibility));
        setBioPrivacy(mapVisibilityToUI(settings.bioVisibility));
        setEmailPrivacy(mapVisibilityToUI(settings.emailVisibility));
        setMemberSincePrivacy(mapVisibilityToUI(settings.memberSinceVisibility));
        
        // IMPORTANT: Note the singular vs plural field name correction
        setFavouritesRequests(settings.favoritesRequest ?? true);
        setTwoFactorEnabled(settings.twoFactorAuthEnabled ?? false);
        
        // Set chat retention if available
        if (settings.chatRetention) {
          setChatRetention(settings.chatRetention);
        }

        // Notification settings
        setNotificationsEnabled(settings.enableNotifications ?? true);
        setNotificationSound(settings.notificationsSounds ?? 'ghost');
        
        // Add this inside your loadUserSettings function where you set other state variables
        // Around line 280-290
        setProStatus(settings.proStatus || 'free');
        
        // Don't set hasUnsavedChanges here as it might override what handleSaveSettings has set
        // Only set it to false if we're not in the middle of a save operation
        if (!saveInProgress) {
          setHasUnsavedChanges(false);
        }
      } else {
        console.error('Failed to load settings:', response.message);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper to map backend visibility values to UI values
  const mapVisibilityToUI = (visibility: string): string => {
    // Map the backend enum values to our UI values
    switch (visibility?.toLowerCase()) {
      case 'public':
        return 'all';
      case 'private':
        return 'none';
      default:
        return 'all'; // Default to "all" for safety
    }
  };
  
  // Helper to map UI visibility values to backend values
  const mapUIToVisibility = (uiValue: string): string => {
    switch (uiValue) {
      case 'all':
        return 'public';
      case 'none':
        return 'private';
      default:
        return 'public';
    }
  };

  return (
    <IonPage className="gt-settings-page">
      <BackHeaderComponent 
        title="Settings"
        showSearch={true}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search settings..."
        onBack={handleBackButton}
      />
      
      <IonContent fullscreen>
        <IonLoading isOpen={isLoading} message="Loading settings..." />
        <PullToRefresh 
          pullingText="Pull to refresh settings..."
          refreshingText="Updating settings..."
          fullPageRefresh={true}
          onRefresh={loadUserSettings}
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
                      onIonChange={(e) => {
                        setNotificationsEnabled(e.detail.checked);
                        settingChanged();
                      }} 
                      className="gt-settings-toggle"
                    />
                  </IonItem>
                  
                  <IonItem lines="full" className="gt-settings-item" disabled={!notificationsEnabled}>
                    <IonLabel>Notification Sound</IonLabel>
                    <IonSelect 
                      interface="popover" 
                      value={notificationSound} 
                      className="gt-settings-select" 
                      onIonChange={(e) => {
                        setNotificationSound(e.detail.value);
                        settingChanged();
                      }}
                    >
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
                      onIonChange={(e) => { setReadReceipts(e.detail.checked); settingChanged(); }} 
                      className="gt-settings-toggle"
                    />
                  </IonItem>
                  
                  <IonItem lines="full" className="gt-settings-item">
                    <IonIcon slot="start" icon={personOutline} />
                    <IonLabel>Gender Visibility</IonLabel>
                    <IonSelect 
                      value={genderPrivacy} 
                      onIonChange={(e) => { setGenderPrivacy(e.detail.value); settingChanged(); }}
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
                      onIonChange={(e) => { setBioPrivacy(e.detail.value); settingChanged(); }}
                      interface="popover"
                      className="gt-settings-select"
                    >
                      <IonSelectOption value="all">Public</IonSelectOption>
                      <IonSelectOption value="none">Only Me</IonSelectOption>
                    </IonSelect>
                  </IonItem>

                  <IonItem lines="full" className="gt-settings-item">
                    <IonIcon slot="start" icon={globeOutline} />
                    <IonLabel>Member Since Visibility</IonLabel>
                    <IonSelect 
                      value={memberSincePrivacy}
                      onIonChange={(e) => { setMemberSincePrivacy(e.detail.value); settingChanged(); }} 
                      interface="popover"
                      className="gt-settings-select"
                    >
                      <IonSelectOption value="all">Public</IonSelectOption>
                      <IonSelectOption value="none">Only Me</IonSelectOption>
                    </IonSelect>
                  </IonItem>

                  <IonItem lines="full" className="gt-settings-item">
                    <IonIcon slot="start" icon={globeOutline} />
                    <IonLabel>Email Visibility</IonLabel>
                    <IonSelect 
                      value={emailPrivacy}
                      onIonChange={(e) => { setEmailPrivacy(e.detail.value); settingChanged(); }}
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
                      onIonChange={(e) => { setEnableSearch(e.detail.checked); settingChanged(); }}
                      className="gt-settings-toggle"
                    />
                  </IonItem>
                  
                  <IonItem lines="full" className="gt-settings-item">
                    <IonIcon slot="start" icon={mailOutline} />
                    <IonLabel>Message Requests</IonLabel>
                    <IonToggle 
                      checked={messageRequests}
                      onIonChange={(e) => { setMessageRequests(e.detail.checked); settingChanged(); }}
                      className="gt-settings-toggle"
                    />
                  </IonItem>
                  <IonItem lines="full" className="gt-settings-item">
                    <IonIcon slot="start" icon={heartCircleOutline} />
                    <IonLabel>Favourites Requests</IonLabel>
                    <IonToggle 
                      checked={favouritesRequests}
                      onIonChange={(e) => { setFavouritesRequests(e.detail.checked); settingChanged(); }}
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
                    <IonLabel>2 Factor Authentication</IonLabel>
                    <IonToggle 
                      checked={twoFactorEnabled} 
                      onIonChange={(e) => { setTwoFactorEnabled(e.detail.checked); settingChanged(); }}
                      className="gt-settings-toggle" 
                    />
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
                  
                  <IonItem lines="full" className="gt-settings-item" onClick={() => setShowRetentionModal(true)}> {/* Will have modal */}
                    <IonIcon slot="start" icon={timeOutline} />
                    <IonLabel>Chat Retention</IonLabel>
                    <IonSelect 
                      value={chatRetention} 
                      onIonChange={(e) => {
                        setChatRetention(e.detail.value);
                        settingChanged();
                      }}
                      interface="popover"
                      className="gt-settings-select"
                    >
                        <IonSelectOption value="forever">Forever</IonSelectOption>
                        <IonSelectOption value="30days">30 Days</IonSelectOption>
                        <IonSelectOption value="7days">7 Days</IonSelectOption>
                        <IonSelectOption value="24hrs">24 Hours</IonSelectOption>
                        <IonSelectOption value="3hrs">3 Hours</IonSelectOption>
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
                      onIonChange={settingChanged}
                    >
                      <IonSelectOption value="en">English</IonSelectOption>
                    </IonSelect>
                  </IonItem>
                  
                  <IonItem lines="full" button onClick={() => history.push('/support')} className="gt-settings-item">
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
                
                <div className="gt-settings-section gt-danger-section">
                  <IonItem lines="full" button routerLink="/deactivate-account" className="gt-settings-item"
                  onClick={() => setDeactivateConfirm(true)}>
                    <IonIcon slot="start" icon={personRemoveOutline} color="warning" />
                    <IonLabel color="warning">Deactivate Account</IonLabel>
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
              disabled={saveInProgress || !hasUnsavedChanges}
            >
              {saveInProgress ? (
                <IonSpinner name="dots" />
              ) : (
                <>
                  <IonIcon slot="start" icon={saveOutline} />
                  Save Settings
                </>
              )}
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
          isOpen={deactivateConfirm}
          onDidDismiss={() => setDeactivateConfirm(false)}
          header="Deactivate Account"
          message="Are you sure you want to deactivate your account? You can reactivate it later by logging in."
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel',
              cssClass: 'gt-cancel-button'
            },
            {
              text: 'Deactivate',
              handler: () => history.push('/deactivate-account'),
              cssClass: 'gt-deactivate-button'
            }
          ]}
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
        
        <IonAlert
          isOpen={showUnsavedAlert}
          onDidDismiss={() => setShowUnsavedAlert(false)}
          header="Unsaved Changes"
          message="You have unsaved changes. Are you sure you want to leave without saving?"
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel',
              cssClass: 'gt-cancel-button'
            },
            {
              text: 'Discard Changes',
              handler: discardChangesAndExit,
              cssClass: 'gt-discard-button'
            },
            {
              text: 'Save Changes',
              handler: async () => {
                // Set a flag to indicate we're saving and then navigating
                const savingAndNavigating = true;
                
                try {
                  setSaveInProgress(true);
                  const response = await apiService.updateUserSettings({
                    requireMessageApproval: messageRequests,
                    enableSearch: enableSearch,
                    readReceipts: readReceipts,
                    genderVisibility: mapUIToVisibility(genderPrivacy),
                    bioVisibility: mapUIToVisibility(bioPrivacy),
                    emailVisibility: mapUIToVisibility(emailPrivacy),
                    memberSinceVisibility: mapUIToVisibility(memberSincePrivacy),
                    favoritesRequest: favouritesRequests,
                    twoFactorAuthEnabled: twoFactorEnabled,
                    chatRetention: chatRetention,
                    enableNotifications: notificationsEnabled,
                    notificationsSounds: notificationSound
                  });
                  
                  if (response.success) {
                    // Success! Clear the unsaved changes flag and navigate
                    setHasUnsavedChanges(false);
                    setSaveInProgress(false);
                    
                    // Use a short timeout to ensure state updates before navigation
                    setTimeout(() => {
                      history.goBack();
                    }, 50);
                  } else {
                    console.error('Failed to save settings:', response.message);
                  }
                } catch (error) {
                  console.error('Error saving settings:', error);
                } finally {
                  if (!savingAndNavigating) {
                    setSaveInProgress(false);
                  }
                }
              },
              cssClass: 'gt-save-button'
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

      <IonModal isOpen={showRetentionModal} onDidDismiss={() => setShowRetentionModal(false)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Chat Retention</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setShowRetentionModal(false)}>
                Close
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <h4 className="retention-title">How long should chats be stored?</h4>
          <p className="retention-description">
            Choose how long your chat messages will be retained before automatic deletion.
          </p>

          <IonRadioGroup value={chatRetention} onIonChange={e => {
            const newValue = e.detail.value;
            
            // Check if this option requires Pro
            if (!isPro && (newValue === '24hrs' || newValue === '7days' || newValue === '30days' || newValue === 'forever')) {
              // Show upgrade prompt
              history.push('/billing');
              return;
            }
            
            setChatRetention(newValue);
            settingChanged();
            setShowRetentionModal(false);
          }}>
            <IonItem className="retention-option">
              <IonLabel>
                <h2>3 Hours</h2>
                <p>Messages auto-delete after 3 hours</p>
              </IonLabel>
              <IonRadio value="3hrs" slot="end" />
            </IonItem>

            <IonItem className="retention-option">
              <IonLabel>
                <h2>24 Hours</h2>
                <p>Messages auto-delete after 24 hours</p>
              </IonLabel>
              {!isPro && <IonChip color="primary" outline>PRO</IonChip>}
              <IonRadio value="24hrs" slot="end" disabled={!isPro} />
            </IonItem>

            <IonItem className="retention-option">
              <IonLabel>
                <h2>7 Days</h2>
                <p>Messages auto-delete after 7 days</p>
              </IonLabel>
              {!isPro && <IonChip color="primary" outline>PRO</IonChip>}
              <IonRadio value="7days" slot="end" disabled={!isPro} />
            </IonItem>

            <IonItem className="retention-option">
              <IonLabel>
                <h2>30 Days</h2>
                <p>Messages auto-delete after 30 days</p>
              </IonLabel>
              {!isPro && <IonChip color="primary" outline>PRO</IonChip>}
              <IonRadio value="30days" slot="end" disabled={!isPro} />
            </IonItem>

            <IonItem className="retention-option">
              <IonLabel>
                <h2>Forever</h2>
                <p>Messages never auto-delete</p>
              </IonLabel>
              {!isPro && <IonChip color="primary" outline>PRO</IonChip>}
              <IonRadio value="forever" slot="end" disabled={!isPro} />
            </IonItem>
          </IonRadioGroup>

          {!isPro && (
            <div className="pro-upgrade-banner">
              <IonIcon icon={starOutline} />
              <h3>Upgrade to Pro</h3>
              <p>Get longer message retention and many more premium features</p>
              <IonButton 
                expand="block" 
                onClick={() => {
                  setShowRetentionModal(false);
                  history.push('/billing');
                }}
              >
                View Pro Benefits
              </IonButton>
            </div>
          )}
        </IonContent>
      </IonModal>
    </IonPage>
  );
};

export default Settings;