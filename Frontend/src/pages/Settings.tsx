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
  IonRange,
  IonNote,
  IonButton,
  IonAlert
} from '@ionic/react';
import { 
  notificationsOutline, 
  moonOutline, 
  lockClosedOutline,
  languageOutline,
  contrastOutline,
  textOutline,
  volumeHighOutline,
  eyeOutline,
  trashOutline,
  cloudOutline,
  phonePortraitOutline,
  colorPaletteOutline,
  saveOutline,
  fingerPrintOutline,
  globeOutline
} from 'ionicons/icons';
import { useState, useEffect } from 'react';
import BackHeaderComponent from '../components/BackHeaderComponent';
import { themeService } from '../services/ThemeService';
import './Settings.css';
import { useAuth } from '../contexts/AuthContext';
// import RoamingGhost from '../components/RoamingGhost';

const Settings: React.FC = () => {
  const [darkMode, setDarkMode] = useState(themeService.getDarkMode());
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [onlineStatus, setOnlineStatus] = useState(true);
  const [fontSize, setFontSize] = useState(16);
  const [language, setLanguage] = useState('en');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [theme, setTheme] = useState('system');
  const [chatBackup, setChatBackup] = useState(true);
  const [blockUnknown, setBlockUnknown] = useState(false);
  const [bioPrivacy, setBioPrivacy] = useState('all');
  const [dataSaver, setDataSaver] = useState(false);
  const [messagePrivacy, setMessagePrivacy] = useState('everyone');
  
  const { isAuthenticated } = useAuth();
  
  useEffect(() => {
    const cleanup = themeService.onThemeChange((isDark) => {
      setDarkMode(isDark);
    });
    return cleanup;
  }, []);

  const handleToggleTheme = () => {
    const isDark = themeService.toggleTheme();
    setDarkMode(isDark);
  };

  const handleThemeChange = (value: string) => {
    setTheme(value);
    if (value === 'dark') {
      themeService.setDarkMode(true);
    } else if (value === 'light') {
      themeService.setDarkMode(false);
    } else {
      // Handle system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      themeService.setDarkMode(prefersDark);
    }
  };

  const handleSaveSettings = () => {
    // Show a success notification
    document.querySelector('ion-toast')?.setAttribute('is-open', 'true');
  };

  return (
    <IonPage className="ghost-appear">
      <BackHeaderComponent 
        title="Settings" 
      />
      
      <IonContent fullscreen>
        {/* <RoamingGhost pageId="settings" /> */}
        
        <div className="settings-container">
          <IonList className="settings-list ghost-shadow">
            <IonItemDivider className="settings-divider">
              <IonIcon icon={contrastOutline} />
              <IonLabel>Appearance</IonLabel>
            </IonItemDivider>
            
            <IonItem lines="full">
              <IonIcon slot="start" icon={moonOutline} />
              <IonLabel>Theme</IonLabel>
              <IonSelect 
                value={theme} 
                onIonChange={(e) => handleThemeChange(e.detail.value)}
                interface="popover"
              >
                <IonSelectOption value="system">System Default</IonSelectOption>
                <IonSelectOption value="light">Light</IonSelectOption>
                <IonSelectOption value="dark">Dark</IonSelectOption>
              </IonSelect>
            </IonItem>
            
            <IonItem lines="full">
              <IonIcon slot="start" icon={colorPaletteOutline} />
              <IonLabel>Accent Color</IonLabel>
              <div className="color-options">
                <div className="color-circle purple active"></div>
                <div className="color-circle blue"></div>
                <div className="color-circle teal"></div>
                <div className="color-circle pink"></div>
              </div>
            </IonItem>
            
            <IonItem lines="full">
              <IonIcon slot="start" icon={textOutline} />
              <IonLabel>
                <h2>Font Size</h2>
                <p>Adjust the text size throughout the app</p>
              </IonLabel>
            </IonItem>
            <IonItem lines="full" className="font-size-item">
              <IonRange
                min={12}
                max={24}
                step={1}
                value={fontSize}
                onIonChange={(e) => setFontSize(e.detail.value as number)}
              >
                <IonNote slot="start">A</IonNote>
                <IonNote slot="end">A</IonNote>
              </IonRange>
              <IonNote slot="end">{fontSize}px</IonNote>
            </IonItem>
            
            <IonItemDivider className="settings-divider">
              <IonIcon icon={notificationsOutline} />
              <IonLabel>Notifications</IonLabel>
            </IonItemDivider>
            
            <IonItem lines="full">
              <IonLabel>Enable Notifications</IonLabel>
              <IonToggle 
                checked={notificationsEnabled} 
                onIonChange={(e) => setNotificationsEnabled(e.detail.checked)} 
              />
            </IonItem>
            
            <IonItem lines="full">
              <IonLabel>Sound</IonLabel>
              <IonToggle checked={true} />
            </IonItem>
            
            <IonItem lines="full">
              <IonIcon slot="start" icon={volumeHighOutline} />
              <IonLabel>Notification Sound</IonLabel>
              <IonSelect interface="popover" value="ghost">
                <IonSelectOption value="ghost">Ghost Whisper</IonSelectOption>
                <IonSelectOption value="chime">Chime</IonSelectOption>
                <IonSelectOption value="bell">Bell</IonSelectOption>
              </IonSelect>
            </IonItem>
            
            <IonItemDivider className="settings-divider">
              <IonIcon icon={lockClosedOutline} />
              <IonLabel>Privacy & Security</IonLabel>
            </IonItemDivider>
            
            <IonItem lines="full">
              <IonIcon slot="start" icon={eyeOutline} />
              <IonLabel>Read Receipts</IonLabel>
              <IonToggle 
                checked={readReceipts} 
                onIonChange={(e) => setReadReceipts(e.detail.checked)} 
              />
            </IonItem>
            
            <IonItem lines="full">
              <IonLabel>Show Online Status</IonLabel>
              <IonToggle 
                checked={onlineStatus} 
                onIonChange={(e) => setOnlineStatus(e.detail.checked)} 
              />
            </IonItem>
            
            <IonItem lines="full">
              <IonIcon slot="start" icon={globeOutline} />
              <IonLabel>Bio Visibility</IonLabel>
              <IonSelect 
                value={bioPrivacy} 
                onIonChange={(e) => setBioPrivacy(e.detail.value)}
                interface="popover"
              >
                <IonSelectOption value="all">Everyone</IonSelectOption>
                <IonSelectOption value="contacts">Contacts Only</IonSelectOption>
                <IonSelectOption value="none">No One</IonSelectOption>
              </IonSelect>
            </IonItem>
            
            <IonItem lines="full">
              <IonIcon slot="start" icon={fingerPrintOutline} />
              <IonLabel>App Lock</IonLabel>
              <IonToggle />
            </IonItem>
            
            <IonItem lines="full">
              <IonLabel>Block Messages from Unknown Users</IonLabel>
              <IonToggle 
                checked={blockUnknown} 
                onIonChange={(e) => setBlockUnknown(e.detail.checked)} 
              />
            </IonItem>
            
            <IonItem lines="full" button routerLink="/blocked-users">
              <IonLabel>Blocked Users</IonLabel>
            </IonItem>
            
            <IonItem lines="full">
              <IonIcon slot="start" icon={cloudOutline} />
              <IonLabel>Back Up Chats</IonLabel>
              <IonToggle 
                checked={chatBackup} 
                onIonChange={(e) => setChatBackup(e.detail.checked)} 
              />
            </IonItem>
            
            <IonItemDivider className="settings-divider">
              <IonIcon icon={languageOutline} />
              <IonLabel>Language & Region</IonLabel>
            </IonItemDivider>
            
            <IonItem lines="full">
              <IonLabel>App Language</IonLabel>
              <IonSelect 
                value={language} 
                onIonChange={(e) => setLanguage(e.detail.value)}
                interface="popover"
              >
                <IonSelectOption value="en">English</IonSelectOption>
                <IonSelectOption value="es">Spanish</IonSelectOption>
                <IonSelectOption value="fr">French</IonSelectOption>
                <IonSelectOption value="de">German</IonSelectOption>
                <IonSelectOption value="ja">Japanese</IonSelectOption>
              </IonSelect>
            </IonItem>
            
            <IonItemDivider className="settings-divider">
              <IonIcon icon={phonePortraitOutline} />
              <IonLabel>Data Usage</IonLabel>
            </IonItemDivider>
            
            <IonItem lines="full">
              <IonLabel>Data Saver Mode</IonLabel>
              <IonToggle 
                checked={dataSaver} 
                onIonChange={(e) => setDataSaver(e.detail.checked)}
              />
            </IonItem>
            
            <IonItem lines="full" button routerLink="/storage-usage">
              <IonLabel>Storage Usage</IonLabel>
            </IonItem>
            
            {isAuthenticated && (
              <>
                <IonItemDivider className="settings-divider danger-section">
                  <IonIcon icon={trashOutline} color="danger" />
                  <IonLabel color="danger">Account</IonLabel>
                </IonItemDivider>
                
                <IonItem lines="full" button routerLink="/deactivate-account">
                  <IonLabel color="medium">Deactivate Account</IonLabel>
                </IonItem>
                
                <IonItem 
                  lines="full" 
                  button 
                  onClick={() => setDeleteConfirm(true)}
                  className="delete-account-item"
                >
                  <IonLabel color="danger">Delete Account</IonLabel>
                </IonItem>
              </>
            )}
          </IonList>
          
          <div className="settings-actions">
            <IonButton 
              expand="block" 
              onClick={handleSaveSettings}
              className="save-settings-button ghost-shadow"
            >
              <IonIcon slot="start" icon={saveOutline} />
              Save Settings
            </IonButton>
          </div>
        </div>

        <IonAlert
          isOpen={deleteConfirm}
          onDidDismiss={() => setDeleteConfirm(false)}
          header="Delete Account"
          message="This will permanently delete your account and all your data. This action cannot be undone."
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel',
              cssClass: 'secondary'
            },
            {
              text: 'Delete',
              role: 'destructive',
              handler: () => {
                console.log('Delete account confirmed');
                // Handle account deletion
              }
            }
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default Settings;