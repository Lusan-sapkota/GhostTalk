import { Redirect, Route } from 'react-router-dom';
import { 
  IonApp, 
  IonRouterOutlet, 
  IonTabBar, 
  IonTabButton, 
  IonIcon, 
  IonLabel, 
  setupIonicReact,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonBadge,
  IonMenuButton,
  IonMenu,
  IonContent,
  IonList,
  IonItem,
  IonListHeader,
  IonToast,
  IonFooter
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { home, chatbubbles, person, settings, search, notifications, logIn, personAdd, logOut } from 'ionicons/icons';
import { useState, useEffect } from 'react';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ChatRoom from './pages/ChatRoom';
import RandomChat from './pages/RandomChat';
import ChatIndividual from './pages/ChatIndividual';
import NotFound from './pages/NotFound';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

// Providers
import { ThemeContext } from './contexts/ThemeContext';

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

/* Theme variables */
import './theme/variables.css';

setupIonicReact();

const App: React.FC = () => {
  // Theme state management
  const [darkMode, setDarkMode] = useState(false);
  const [notificationCount, setNotificationCount] = useState(3);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // Initialize theme from localStorage on component mount
  useEffect(() => {
    const prefersDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(prefersDark);
    document.body.classList.toggle('dark', prefersDark);
    
    // Check authentication
    const userSession = localStorage.getItem('userSession');
    if (userSession) {
      try {
        const userData = JSON.parse(userSession);
        setUser(userData);
        setIsAuthenticated(true);
      } catch (e) {
        localStorage.removeItem('userSession');
        setIsAuthenticated(false);
      }
    }
  }, []);
  
  // Toggle theme function
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    document.body.classList.toggle('dark', newDarkMode);
    localStorage.setItem('darkMode', String(newDarkMode));
  };

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem('userSession');
    setIsAuthenticated(false);
    setUser(null);
    setToastMessage('You have been logged out');
    setShowToast(true);
  };
  
  // Auth guard only for protected routes
  const ProtectedRoute: React.FC<{
    component: React.ComponentType<any>;
    path: string;
    exact?: boolean;
  }> = ({ component: Component, ...rest }) => {
    return (
      <Route
        {...rest}
        render={props =>
          isAuthenticated ? (
            <Component {...props} user={user} />
          ) : (
            <Redirect to={{
              pathname: "/login",
              state: { from: props.location }
            }} />
          )
        }
      />
    );
  };

  // Common header component
  const AppHeader = () => (
    <IonHeader>
      <IonToolbar color="primary">
        <IonButtons slot="start">
          <IonMenuButton />
        </IonButtons>
        <IonTitle>GhostTalk</IonTitle>
        <IonButtons slot="end">
          <IonButton>
            <IonIcon slot="icon-only" icon={notifications} />
            {notificationCount > 0 && (
              <IonBadge color="danger" className="notification-badge">{notificationCount}</IonBadge>
            )}
          </IonButton>
        </IonButtons>
      </IonToolbar>
    </IonHeader>
  );

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode, setThemeMode: setDarkMode }}>
      <IonApp>
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          position="top"
        />
        
        <IonReactRouter>
          {/* Side menu for navigation */}
          <IonMenu contentId="main-content" type="overlay">
            <IonHeader>
              <IonToolbar color="primary">
                <IonTitle>GhostTalk</IonTitle>
              </IonToolbar>
            </IonHeader>
            <IonContent>
              <IonList>
                {!isAuthenticated ? (
                  <>
                    <IonListHeader>Account</IonListHeader>
                    <IonItem routerLink="/login">
                      <IonIcon icon={logIn} slot="start" />
                      <IonLabel>Login</IonLabel>
                    </IonItem>
                    <IonItem routerLink="/register">
                      <IonIcon icon={personAdd} slot="start" />
                      <IonLabel>Register</IonLabel>
                    </IonItem>
                    <IonListHeader>Explore</IonListHeader>
                    <IonItem routerLink="/home">
                      <IonIcon icon={home} slot="start" />
                      <IonLabel>Home</IonLabel>
                    </IonItem>
                    <IonItem routerLink="/chat">
                      <IonIcon icon={chatbubbles} slot="start" />
                      <IonLabel>Public Chats</IonLabel>
                    </IonItem>
                  </>
                ) : (
                  <>
                    <IonListHeader>Navigation</IonListHeader>
                    <IonItem routerLink="/home">
                      <IonIcon icon={home} slot="start" />
                      <IonLabel>Home</IonLabel>
                    </IonItem>
                    <IonItem routerLink="/profile">
                      <IonIcon icon={person} slot="start" />
                      <IonLabel>My Profile</IonLabel>
                    </IonItem>
                    <IonItem routerLink="/settings">
                      <IonIcon icon={settings} slot="start" />
                      <IonLabel>Settings</IonLabel>
                    </IonItem>
                    <IonItem onClick={handleLogout}>
                      <IonIcon icon={logOut} slot="start" />
                      <IonLabel>Logout</IonLabel>
                    </IonItem>
                  </>
                )}
              </IonList>
            </IonContent>
          </IonMenu>

          {/* Main Content with global header */}
          <div id="main-content" className="main-content">
            <AppHeader />
            
            <IonRouterOutlet>
              {/* Public routes */}
              <Route path="/login" component={Login} exact />
              <Route path="/register" component={Register} exact />
              <Route path="/home" component={Home} exact />
              <Route path="/chat" component={ChatRoom} exact />
              <Route path="/chat/random" component={RandomChat} exact />
              
              {/* Protected routes */}
              <ProtectedRoute path="/profile" component={Profile} exact />
              <ProtectedRoute path="/settings" component={Settings} exact />
              <ProtectedRoute path="/chat/:id" component={ChatIndividual} exact />
              
              <Route exact path="/">
                <Redirect to="/home" />
              </Route>
              
              <Route component={NotFound} />
            </IonRouterOutlet>
            
            {/* Global bottom tab bar */}
            <IonFooter>
              <IonTabBar>
                <IonTabButton tab="home" href="/home">
                  <IonIcon icon={home} />
                  <IonLabel>Home</IonLabel>
                </IonTabButton>
                
                <IonTabButton tab="chat" href="/chat">
                  <IonIcon icon={chatbubbles} />
                  <IonLabel>Chat</IonLabel>
                </IonTabButton>
                
                <IonTabButton tab="search" href="/search">
                  <IonIcon icon={search} />
                  <IonLabel>Search</IonLabel>
                </IonTabButton>
                
                <IonTabButton tab="profile" href={isAuthenticated ? "/profile" : "/login"}>
                  <IonIcon icon={person} />
                  <IonLabel>Profile</IonLabel>
                </IonTabButton>
                
                <IonTabButton tab="settings" href={isAuthenticated ? "/settings" : "/login"}>
                  <IonIcon icon={settings} />
                  <IonLabel>Settings</IonLabel>
                </IonTabButton>
              </IonTabBar>
            </IonFooter>
          </div>
        </IonReactRouter>
      </IonApp>
    </ThemeContext.Provider>
  );
};

export default App;