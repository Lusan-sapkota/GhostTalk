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
  phonePortraitOutline,
  moonOutline,
  sunnyOutline,
  notifications,
  heartOutline,
  notificationsOutline,
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
import DocsPage from './pages/DocsPage';
import ContactPage from './pages/ContactPage';
import CommunityPage from './pages/CommunityPage';
import FavoritesPage from './pages/FavoritesPage';
import NotificationsPage from './pages/NotificationsPage';
import TwoFactorAuth from './pages/TwoFactorAuth';
import VerifySession from './pages/VerifySession';
import VerificationNeeded from './pages/VerificationNeeded';
import BillingPage from './pages/BillingPage';
import LoggedDevicesPage from './pages/LoggedDevicesPage';

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
import './theme/SessionVerification.css';
import { useEffect, useState } from 'react';
import themeService from './services/ThemeService';
import { AuthProvider } from './contexts/AuthContext';
import { apiService } from './services/api.service';
import { useAuth } from './contexts/AuthContext';
import { StatusBar, Style } from '@capacitor/status-bar';
import { isPlatform } from '@ionic/react';
import { Capacitor } from '@capacitor/core';
import { fixAndroidPaths } from './utils/androidPathFix';
import FirstLaunch from './plugins/firstLaunch';
import NotFound from './pages/NotFound';
import SessionVerificationPrompt from './components/SessionVerificationPrompt';

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

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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
          <IonMenuToggle>
            <IonItem routerLink="/notifications" routerDirection="none" detail={false} className="staggered-item">
              <IonIcon slot="start" icon={notificationsOutline} />
              <IonLabel>Notifications</IonLabel>
            </IonItem>
          </IonMenuToggle>
          <IonMenuToggle>
            <IonItem routerLink="/favorites" routerDirection="none" detail={false} className="staggered-item">
              <IonIcon slot="start" icon={heartOutline} />
              <IonLabel>Favourites</IonLabel>
            </IonItem>
          </IonMenuToggle>

          {!isAuthenticated && (
          <IonItemDivider className="menu-divider">Authentication</IonItemDivider>
          )}
          
          {!isAuthenticated && (
          <IonMenuToggle>
            <IonItem routerLink="/login" routerDirection="none" detail={false} className="staggered-item">
              <IonIcon slot="start" icon={logInOutline} /> {/* Changed: more appropriate for login */}
              <IonLabel>Login</IonLabel>
            </IonItem>
          </IonMenuToggle>
          )}
          {!isAuthenticated && (
          <IonMenuToggle>
            <IonItem routerLink="/register" routerDirection="none" detail={false} className="staggered-item">
              <IonIcon slot="start" icon={personAddOutline} /> {/* Changed: more appropriate for registration */}
              <IonLabel>Register</IonLabel>
            </IonItem>
          </IonMenuToggle>
          )}
          
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

            {isAuthenticated && (
            <>
              <IonItem button onClick={() => setShowLogoutConfirm(true)} className="staggered-item logout-item">
              <IonIcon slot="start" icon={logOutOutline} />
              <IonLabel>Logout</IonLabel>
              </IonItem>
              
              <IonAlert
              isOpen={showLogoutConfirm}
              onDidDismiss={() => setShowLogoutConfirm(false)}
              header="Confirm Logout"
              message="Are you sure you want to log out of your account?"
              buttons={[
                {
                text: 'Cancel',
                role: 'cancel',
                cssClass: 'secondary'
                },
                {
                text: 'Logout',
                handler: () => {
                  logout();
                  document.querySelector('ion-menu')?.close();
                }
                }
              ]}
              />
            </>
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
    const setupStatusBar = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          await StatusBar.setStyle({ style: Style.Dark });
          await StatusBar.setBackgroundColor({ color: '#6736e9' });
          
          // Add extra handling for Android
          if (isPlatform('android')) {
            StatusBar.setOverlaysWebView({ overlay: false });
          }
        } catch (err) {
          console.error('Error setting up status bar', err);
        }
      }
    };
    
    setupStatusBar();
  }, []);

  useEffect(() => {
    // Fix Android path issues
    if (isPlatform('android') && Capacitor.isNativePlatform()) {
      fixAndroidPaths();
    }
    
    // Rest of your initialization code...
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
      // Add small delay to ensure app is fully initialized
      setTimeout(() => {
        history.replace('/onboarding');
      }, 100);
      
      // Don't remove the flag here - let the onboarding component remove it when complete
    } else if (Capacitor.isNativePlatform()) {
      // Check if we should show onboarding based on localStorage
      const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
      if (hasSeenOnboarding !== 'true') {
        console.log('First time user detected, showing onboarding');
        setTimeout(() => {
          history.replace('/onboarding');
        }, 100);
      }
    }
  }, [history]);

  useEffect(() => {
    // Check if on native platform
    if (Capacitor.isNativePlatform()) {
      const checkFirstLaunch = async () => {
        try {
          // Call the FirstLaunch plugin
          const result = await FirstLaunch.checkFirstLaunch();
          
          if (result.isFirstLaunch) {
            console.log('First launch detected, showing onboarding');
            // Use the history from react-router
            history.replace('/onboarding');
          }
        } catch (error) {
          console.error('Error checking first launch status:', error);
        }
      };
      
      // Check on app load
      checkFirstLaunch();
    }
  }, [history]);

  useEffect(() => {
    // Check token validity early to prevent UI flicker
    const validateToken = async () => {
      const token = apiService.getToken();
      if (token) {
        try {
          // Make a lightweight request to verify token
          const response = await apiService.makeRequest('/auth/verify-token', 'POST');
          if (!response.success) {
            // Invalid token, clear it
            console.log("Token validation failed on app init, clearing auth state");
            apiService.clearToken();
          }
        } catch (error) {
          console.error("Error validating token on app init:", error);
          apiService.clearToken();
        }
      }
    };
    
    validateToken();
  }, []);

  const { isAuthenticated } = useAuth();

  // Protected route component
  const PrivateRoute = ({ component: Component, ...rest }: { component: React.ComponentType<any>; [x: string]: any }) => {
    const { isAuthenticated, isLoading } = useAuth();
    
    return (
      <Route 
        {...rest} 
        render={props => {
          // Show loading or splash while auth state is being determined
          if (isLoading) {
            return (
              <div className="auth-loading-container">
                <div className="ghost-loader"></div>
                <p>Loading...</p>
              </div>
            );
          }
          
          // Once loaded, either show component or redirect
          return isAuthenticated ? (
            <Component {...props} />
          ) : (
            <Redirect 
              to={{ 
                pathname: '/login', 
                state: { from: props.location } 
              }} 
            />
          );
        }} 
      />
    );
  };

  return (
    <IonReactRouter>
      <AuthProvider>
        <IonApp>
          <IonReactRouter>
            <SideMenu />
            
            <IonTabs>
              <IonRouterOutlet id="main">
                {/* Special routes that need to be matched first */}
                <Route path="/onboarding" component={Onboarding} exact={true} />
                
                {/* Authentication routes */}
                <Route exact path="/login" component={Login} />
                <Route exact path="/register" component={Register} />
                <Route exact path="/verify-email/:token" component={VerifyEmail} />
                <Route exact path="/verification-needed" component={VerificationNeeded} />
                <Route exact path="/magic-link-sent" component={MagicLinkSent} />
                <Route exact path="/password-reset-sent" component={PasswordResetSent} /> 
                <Route exact path="/reset-password/:token" component={ResetPassword} />
                <Route exact path="/magic-login/:token" component={MagicLogin} />
                
                {/* Public routes */}
                <Route exact path="/home" component={Home} />
                <Route exact path="/random-chat" component={RandomChat} />
                <Route exact path="/chat-room" component={ChatRoom} />
                <Route exact path="/about" component={About} />
                <Route exact path="/terms" component={TermsPage} />
                <Route exact path="/privacy" component={PrivacyPage} />
                <Route exact path="/support" component={SupportPage} />
                <Route exact path="/contact" component={ContactPage} />
                <Route exact path="/search" component={SearchPage} />
                <Route exact path="/docs" component={DocsPage} />
                <Route exact path="/community" component={CommunityPage} />
                <Route path="/verify-2fa/:userId" component={TwoFactorAuth} />
                <Route exact path="/verify-session/:token" component={VerifySession} />
                <Route path="/billing" component={BillingPage} exact />
                <Route path="/logged-devices" component={LoggedDevicesPage} exact />
                
                {/* Settings routes */}
                
                {/* Protected routes with authentication */}
                <PrivateRoute exact path="/chat-individual" component={ChatIndividual} />
                <PrivateRoute exact path="/profile" component={Profile} />
                <PrivateRoute exact path="/settings" component={Settings} />
                <PrivateRoute exact path="/favorites" component={FavoritesPage} />
                <PrivateRoute exact path="/notifications" component={NotificationsPage} />
                
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
                
                {/* 404 catch-all route - MUST be last */}
                <Route render={(props) => {
                  // Check if we're at a route that should be matched by another route
                  const knownRoutes = [
                    '/login', '/register', '/home', '/random-chat', '/chat-room', 
                    '/about', '/terms', '/privacy', '/support', '/contact', 
                    '/search', '/docs', '/community', '/chat-individual',
                    '/profile', '/settings', '/favorites', '/notifications',
                    '/onboarding', '/verify-email', '/magic-link-sent', 
                    '/password-reset-sent', '/reset-password', '/magic-login', '/verify-2fa', '/verify-session',
                    '/verification-needed'
                  ];
                  
                  // Check if current path starts with any known route
                  const isKnownRoute = knownRoutes.some(route => 
                    props.location.pathname === route || 
                    props.location.pathname.startsWith(`${route}/`)
                  );
                  
                  // Only show NotFound for unknown routes
                  return isKnownRoute ? null : <NotFound />;
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
          <SessionVerificationPrompt />
        </IonApp>
      </AuthProvider>
    </IonReactRouter>
  );
};

export default App;
