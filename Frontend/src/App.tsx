import { Redirect, Route, useHistory } from 'react-router-dom';
import {
  IonApp,
  IonRouterOutlet,
  IonMenu,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonIcon,
  IonLabel,
  IonMenuToggle,
  IonTabBar,
  IonTabButton,
  IonTabs,
  setupIonicReact,
  IonButtons,
  IonButton,
  IonSearchbar,
  IonFooter,
  IonItemDivider,
  IonToggle,
  IonSelect,
  IonSelectOption,
  IonAlert
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';

import { 
  homeOutline,
  compassOutline,
  peopleOutline,
  chatbubblesOutline, 
  searchOutline,
  logInOutline,
  personAddOutline,
  personCircleOutline,
  settingsOutline,
  informationCircleOutline,
  documentTextOutline,
  shieldOutline,
  helpCircleOutline,
  contrastOutline,
  moon,
  sunny,
  logOutOutline,
  lockClosedOutline,
  globeOutline,
  closeOutline,
  phonePortraitOutline
} from 'ionicons/icons';

import Home from './pages/Home';
import RandomChat from './pages/RandomChat';
import ChatRoom from './pages/ChatRoom';
import ChatIndividual from './pages/ChatIndividual';
import About from './pages/About';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import SupportPage from './pages/SupportPage';
import Settings from './pages/Settings';
import SearchPage from './pages/SearchPage';
import VerifyEmail from './pages/VerifyEmail';
import MagicLinkSent from './pages/MagicLinkSent';
import PasswordResetSent from './pages/PasswordResetSent';
import ResetPassword from './pages/ResetPassword';
import MagicLogin from './pages/MagicLogin';
import Onboarding from './pages/Onboarding';
/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Import Ionic dark mode CSS */
import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';
import './theme/animations.css';
import './theme/menu.css';
import './App.css';
import { useEffect, useState } from 'react';
import themeService from './services/ThemeService';
import { AuthProvider } from './contexts/AuthContext';
import { apiService } from './services/api.service';
import { useAuth } from './contexts/AuthContext';
import { StatusBar, Style } from '@capacitor/status-bar';
import { isPlatform } from '@ionic/react';

setupIonicReact();

const setupStatusBar = async () => {
  // Only run on actual devices, not in browser
  if (isPlatform('android') || isPlatform('ios')) {
    try {
      // Check if StatusBar plugin is available before using it
      if (typeof StatusBar.setStyle === 'function') {
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#6736e9' });
        await StatusBar.setOverlaysWebView({ overlay: false });
      }
    } catch (err) {
      console.error('Error setting up status bar', err);
    }
  }
};

const SideMenu: React.FC = () => {
  const [darkMode, setDarkMode] = useState(themeService.getDarkMode());
  const { isAuthenticated, logout } = useAuth();
  const [showThemeInfo, setShowThemeInfo] = useState(false);

  useEffect(() => {
    const cleanup = themeService.onThemeChange((isDark) => {
      setDarkMode(isDark);
    });
    
    return cleanup;
  }, []);

  useEffect(() => {
    // Apply initial system theme
    themeService.applySystemTheme();
  }, []);

  const [currentTheme, setCurrentTheme] = useState(localStorage.getItem('themePreference') || 'system');

  useEffect(() => {
    // Get saved theme preference or default to system
    const savedTheme = localStorage.getItem('themePreference') || 'system';
    setCurrentTheme(savedTheme);
    
    // Apply the theme
    if (savedTheme === 'dark') {
      themeService.setDarkMode(true);
    } else if (savedTheme === 'light') {
      themeService.setDarkMode(false);
    } else {
      // For system theme, check the preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      themeService.setDarkMode(prefersDark);
    }
  }, []);

  useEffect(() => {
    // Set up system theme preference change listener
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      if (currentTheme === 'system') {
        themeService.setDarkMode(e.matches);
      }
    };
    
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [currentTheme]);

  return (
    <IonMenu contentId="main" className="ghost-fade-in">
      <IonHeader>
        <IonToolbar color="primary" className="ghost-shadow">
          <IonTitle className="ghost-pulse">GhostTalk</IonTitle>
          <IonButtons slot="end">
            <IonButton className="menu-close-btn" onClick={() => document.querySelector('ion-menu')?.close()}>
              <IonIcon slot="icon-only" icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div className="menu-header ghost-float">
          <div className="ghost-icon">
            <div className="ghost-eyes"></div>
          </div>
          <h2>Welcome, Ghost</h2>
          <p>Connect anonymously</p>
        </div>
        
        <IonList className="menu-list" lines="none">
          <IonMenuToggle>
            <IonItem routerLink="/home" routerDirection="none" detail={false} className="staggered-item">
              <IonIcon slot="start" icon={homeOutline} />
              <IonLabel>Home</IonLabel>
            </IonItem>
          </IonMenuToggle>
          
          <IonMenuToggle>
            <IonItem routerLink="/random-chat" routerDirection="none" detail={false} className="staggered-item">
              <IonIcon slot="start" icon={compassOutline} /> 
              <IonLabel>Random Chat</IonLabel>
            </IonItem>
          </IonMenuToggle>
          
          <IonMenuToggle>
            <IonItem routerLink="/chat-room" routerDirection="none" detail={false} className="staggered-item">
              <IonIcon slot="start" icon={peopleOutline} />
              <IonLabel>Chat Rooms</IonLabel>
            </IonItem>
          </IonMenuToggle>
          
          {isAuthenticated && (
          <IonMenuToggle>
            <IonItem routerLink="/chat-individual" routerDirection="none" detail={false} className="staggered-item">
              <IonIcon slot="start" icon={chatbubblesOutline} />
              <IonLabel>Private Chat</IonLabel>
            </IonItem>
          </IonMenuToggle>
          )}

          <IonMenuToggle>
            <IonItem routerLink="/search" routerDirection="none" detail={false} className="staggered-item">
              <IonIcon slot="start" icon={searchOutline} />
              <IonLabel>Search Users</IonLabel>
            </IonItem>
          </IonMenuToggle>

          <IonItemDivider className="menu-divider">Authentication</IonItemDivider>
          <IonMenuToggle>
            <IonItem routerLink="/login" routerDirection="none" detail={false} className="staggered-item">
              <IonIcon slot="start" icon={logInOutline} /> {/* Changed: more appropriate for login */}
              <IonLabel>Login</IonLabel>
            </IonItem>
          </IonMenuToggle>
          <IonMenuToggle>
            <IonItem routerLink="/register" routerDirection="none" detail={false} className="staggered-item">
              <IonIcon slot="start" icon={personAddOutline} /> {/* Changed: more appropriate for registration */}
              <IonLabel>Register</IonLabel>
            </IonItem>
          </IonMenuToggle>
          
          {isAuthenticated && (
          <IonItemDivider className="menu-divider">Profile & Settings</IonItemDivider>
          )}
          
          {isAuthenticated && (
          <IonMenuToggle>
            <IonItem routerLink="/profile" routerDirection="none" detail={false} className="staggered-item">
              <IonIcon slot="start" icon={personCircleOutline} /> {/* Changed: better represents profile */}
              <IonLabel>Profile</IonLabel>
            </IonItem>
          </IonMenuToggle>
          )}
          {isAuthenticated && (
          <IonMenuToggle>
            <IonItem routerLink="/settings" routerDirection="none" detail={false} className="staggered-item">
              <IonIcon slot="start" icon={settingsOutline} /> {/* Changed: proper settings icon */}
              <IonLabel>Settings</IonLabel>
            </IonItem>
          </IonMenuToggle>
          )}

          <IonItemDivider className="menu-divider">Info & Support</IonItemDivider>
          <IonMenuToggle>
            <IonItem routerLink="/about" routerDirection="none" detail={false} className="staggered-item">
              <IonIcon slot="start" icon={informationCircleOutline} />
              <IonLabel>About</IonLabel>
            </IonItem>
          </IonMenuToggle>
          <IonMenuToggle>
            <IonItem routerLink="/terms" routerDirection="none" detail={false} className="staggered-item">
              <IonIcon slot="start" icon={documentTextOutline} /> {/* Changed: better represents terms document */}
              <IonLabel>Terms & Conditions</IonLabel>
            </IonItem>
          </IonMenuToggle>
          <IonMenuToggle>
            <IonItem routerLink="/privacy" routerDirection="none" detail={false} className="staggered-item">
              <IonIcon slot="start" icon={shieldOutline} /> {/* Changed: shield represents privacy/protection */}
              <IonLabel>Privacy Policy</IonLabel>
            </IonItem>
          </IonMenuToggle>
          <IonMenuToggle>
            <IonItem routerLink="/support" routerDirection="none" detail={false} className="staggered-item">
              <IonIcon slot="start" icon={helpCircleOutline} /> {/* Changed: help icon for support */}
              <IonLabel>Help & Support</IonLabel>
            </IonItem>
          </IonMenuToggle>

          <IonItemDivider className="menu-divider">Preferences</IonItemDivider>
          
          <IonItem className="theme-info-item staggered-item">
            <IonIcon slot="start" icon={contrastOutline} />
            <IonLabel>
              system ({darkMode ? 'Dark' : 'Light'})
            </IonLabel>
            <IonButton 
              fill="clear" 
              slot="end" 
              onClick={() => setShowThemeInfo(true)}
              className="info-button"
            >
              <IonIcon slot="icon-only" icon={informationCircleOutline} />
            </IonButton>
          </IonItem>

          {isAuthenticated && (
            <IonItem button onClick={() => logout()} className="staggered-item logout-item">
              <IonIcon slot="start" icon={logOutOutline} />
              <IonLabel>Logout</IonLabel>
            </IonItem>
          )}
        </IonList>
      </IonContent>
      
      <IonAlert
        isOpen={showThemeInfo}
        onDidDismiss={() => setShowThemeInfo(false)}
        header="System Theme"
        message="GhostTalk follows your device's theme setting. To change between light and dark mode, update your system settings."
        buttons={['Got it!']}
      />
      
    </IonMenu>
  );
};

const App: React.FC = () => {
  // Move useHistory to the top level of the component
  const history = useHistory();

  // Apply initial theme
  useEffect(() => {
    const darkMode = themeService.getDarkMode();
    document.body.classList.toggle('dark', darkMode);
  }, []);

  // Apply initial theme more comprehensively
  useEffect(() => {
    const darkMode = themeService.getDarkMode();
    
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    
    // Listen for changes in the system theme preference if using system setting
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      const currentTheme = localStorage.getItem('themePreference') || 'system';
      if (currentTheme === 'system') {
        themeService.setDarkMode(e.matches);
      }
    };
    
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, []);

  useEffect(() => {
    // Only attempt to use statusbar on mobile platforms
    if (isPlatform('android') || isPlatform('ios')) {
      setupStatusBar();
    }
    // Rest of your existing useEffect code...
  }, []);

  useEffect(() => {
    // No need to call useHistory here anymore
    // Listen for navigation events from native code
    const handleInitialLoad = (event: Event) => {
      try {
        const customEvent = event as CustomEvent;
        const data = JSON.parse(customEvent.detail);
        if (data && data.initialPath) {
          // Navigate to the path specified by native code
          history.replace(data.initialPath);
        }
      } catch (error) {
        console.error('Failed to parse initial load event', error);
      }
    };
    
    window.addEventListener('initialLoad', handleInitialLoad as EventListener);
    
    return () => {
      window.removeEventListener('initialLoad', handleInitialLoad as EventListener);
    };
  }, [history]); // Add history to dependencies array

  useEffect(() => {
    // Check for the force onboarding flag on component mount
    const forceOnboarding = localStorage.getItem('forceOnboarding');
    if (forceOnboarding === 'true') {
      console.log('Force onboarding flag detected, redirecting to onboarding');
      history.replace('/onboarding');
      // Clear the flag after redirecting
      localStorage.removeItem('forceOnboarding');
    }
  }, [history]);

  const { isAuthenticated } = useAuth();

  // Protected route component
  const PrivateRoute = ({ component: Component, ...rest }: { component: React.ComponentType<any>; [x: string]: any }) => (
    <Route 
      {...rest} 
      render={props => 
        isAuthenticated ? (
          <Component {...props} />
        ) : (
          <Redirect to={{ pathname: '/login', state: { from: props.location } }} />
        )
      } 
    />
  );

  return (
    <AuthProvider>
      <IonApp>
        <IonReactRouter>
          <SideMenu />
          
          <IonTabs>
            <IonRouterOutlet id="main">
              {/* Make the onboarding route higher priority */}
              <Route path="/onboarding" component={Onboarding} exact={true} />
              
              {/* Other routes */}
              <Route exact path="/home" component={Home} />
              <Route exact path="/random-chat" component={RandomChat} />
              <Route exact path="/chat-room" component={ChatRoom} />
              <PrivateRoute exact path="/chat-individual" component={ChatIndividual} />
              <Route exact path="/about" component={About} />
              <PrivateRoute exact path="/profile" component={Profile} />
              <Route exact path="/login" component={Login} />
              <Route exact path="/register" component={Register} />
              <Route path="/onboarding" component={Onboarding} exact={true} />
              <Route exact path="/verify-email/:token" component={VerifyEmail} />
              <Route exact path="/terms" component={TermsPage} />
              <Route exact path="/privacy" component={PrivacyPage} />
              <Route exact path="/support" component={SupportPage} />
              <PrivateRoute exact path="/settings" component={Settings} />
              <Route exact path="/search" component={SearchPage} />
              <Route exact path="/magic-link-sent" component={MagicLinkSent} />
              <Route exact path="/password-reset-sent" component={PasswordResetSent} /> 
              <Route exact path="/reset-password/:token" component={ResetPassword} />
              <Route exact path="/magic-login/:token" component={MagicLogin} />
              
              {/* Redirects */}
              <Route exact path="/" render={() => {
                // Check if we should show onboarding based on URL hash
                const hash = window.location.hash;
                if (hash && hash.includes('/onboarding')) {
                  console.log('Found onboarding in hash, redirecting');
                  return <Redirect to="/onboarding" />;
                }
                return <Redirect to="/home" />;
              }} />
            </IonRouterOutlet>
            
            {isAuthenticated && (
            <IonTabBar slot="bottom" className="ghost-shadow">
              <IonTabButton tab="home" href="/home">
                <IonIcon icon={homeOutline} />
                <IonLabel>Home</IonLabel>
              </IonTabButton>
              <IonTabButton tab="privatechat" href="/chat-individual">
                <IonIcon icon={chatbubblesOutline} />
                <IonLabel>Chat</IonLabel>
              </IonTabButton>
              <IonTabButton tab="chatRoom" href="/chat-room">
                <IonIcon icon={peopleOutline} />
                <IonLabel>Rooms</IonLabel>
              </IonTabButton>
              <IonTabButton tab="profile" href="/profile">
                <IonIcon icon={personCircleOutline} />
                <IonLabel>Profile</IonLabel>
              </IonTabButton>
            </IonTabBar>
            )}
          </IonTabs>
        </IonReactRouter>
      </IonApp>
    </AuthProvider>
  );
};

export default App;
