import { Redirect, Route } from 'react-router-dom';
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
  IonToggle
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
  closeOutline
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

setupIonicReact();

const SideMenu: React.FC = () => {
  const [darkMode, setDarkMode] = useState(themeService.getDarkMode());
  const { isAuthenticated, logout } = useAuth();
  
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
          
          <IonItem className="theme-toggle-item staggered-item">
            <IonIcon slot="start" icon={darkMode ? moon : sunny} />
            <IonLabel>{darkMode ? 'Dark Mode' : 'Light Mode'}</IonLabel>
            <IonToggle 
              checked={darkMode} 
              onIonChange={handleToggleTheme} 
              slot="end" 
            />
          </IonItem>

          {isAuthenticated && (
            <IonItem button onClick={() => logout()} className="staggered-item logout-item">
              <IonIcon slot="start" icon={logOutOutline} />
              <IonLabel>Logout</IonLabel>
            </IonItem>
          )}
        </IonList>
      </IonContent>
      <IonFooter className="menu-footer">
        <p>GhostTalk v1.0.0</p>
        <p className="copyright">© {new Date().getFullYear()} GhostTalk</p>
      </IonFooter>
    </IonMenu>
  );
};

const App: React.FC = () => {
  // Apply initial theme
  useEffect(() => {
    const darkMode = themeService.getDarkMode();
    document.body.classList.toggle('dark', darkMode);
  }, []);

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
              <Route exact path="/home" component={Home} />
              <Route exact path="/random-chat" component={RandomChat} />
              <Route exact path="/chat-room" component={ChatRoom} />
              <PrivateRoute exact path="/chat-individual" component={ChatIndividual} />
              <Route exact path="/about" component={About} />
              <PrivateRoute exact path="/profile" component={Profile} />
              <Route exact path="/login" component={Login} />
              <Route exact path="/register" component={Register} />
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
              <Route exact path="/">
                <Redirect to="/home" />
              </Route>
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
