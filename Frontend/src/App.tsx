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
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';

import { home, chatbubbles, people, informationCircle, person, flashlight } from 'ionicons/icons';

import Home from './pages/Home';
import RandomChat from './pages/RandomChat';
import ChatRoom from './pages/ChatRoom';
import ChatIndividual from './pages/ChatIndividual';
import About from './pages/About';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';

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
import { useEffect } from 'react';
import { themeService } from './services/ThemeService';

setupIonicReact();

const App: React.FC = () => {
  // Apply initial theme
  useEffect(() => {
    const darkMode = themeService.getDarkMode();
    document.body.classList.toggle('dark', darkMode);
  }, []);

  return (
    <IonApp>
      <IonReactRouter>
        <IonMenu contentId="main">
          <IonHeader>
            <IonToolbar color="primary">
              <IonTitle>GhostTalk</IonTitle>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <IonList>
              <IonMenuToggle>
                <IonItem routerLink="/home" routerDirection="none" lines="none">
                  <IonIcon slot="start" icon={home} />
                  <IonLabel>Home</IonLabel>
                </IonItem>
              </IonMenuToggle>
              <IonMenuToggle>
                <IonItem routerLink="/random-chat" routerDirection="none" lines="none">
                  <IonIcon slot="start" icon={chatbubbles} />
                  <IonLabel>Random Chat</IonLabel>
                </IonItem>
              </IonMenuToggle>
              <IonMenuToggle>
                <IonItem routerLink="/chat-room" routerDirection="none" lines="none">
                  <IonIcon slot="start" icon={people} />
                  <IonLabel>Chat Rooms</IonLabel>
                </IonItem>
              </IonMenuToggle>
              <IonMenuToggle>
                <IonItem routerLink="/chat-individual" routerDirection="none" lines="none">
                  <IonIcon slot="start" icon={chatbubbles} />
                  <IonLabel>Individual Chat</IonLabel>
                </IonItem>
              </IonMenuToggle>
              <IonMenuToggle>
                <IonItem routerLink="/about" routerDirection="none" lines="none">
                  <IonIcon slot="start" icon={informationCircle} />
                  <IonLabel>About</IonLabel>
                </IonItem>
              </IonMenuToggle>
              <IonMenuToggle>
                <IonItem routerLink="/profile" routerDirection="none" lines="none">
                  <IonIcon slot="start" icon={person} />
                  <IonLabel>Profile</IonLabel>
                </IonItem>
              </IonMenuToggle>
            </IonList>
          </IonContent>
        </IonMenu>
        
        <IonTabs>
          <IonRouterOutlet id="main">
            <Route exact path="/home" component={Home} />
            <Route exact path="/random-chat" component={RandomChat} />
            <Route exact path="/chat-room" component={ChatRoom} />
            <Route exact path="/chat-individual" component={ChatIndividual} />
            <Route exact path="/about" component={About} />
            <Route exact path="/profile" component={Profile} />
            <Route exact path="/login" component={Login} />
            <Route exact path="/register" component={Register} />
            <Route exact path="/">
              <Redirect to="/home" />
            </Route>
          </IonRouterOutlet>
          
          <IonTabBar slot="bottom">
            <IonTabButton tab="home" href="/home">
              <IonIcon icon={home} />
              <IonLabel>Home</IonLabel>
            </IonTabButton>
            <IonTabButton tab="randomChat" href="/random-chat">
              <IonIcon icon={flashlight} />
              <IonLabel>Random</IonLabel>
            </IonTabButton>
            <IonTabButton tab="chatRoom" href="/chat-room">
              <IonIcon icon={people} />
              <IonLabel>Rooms</IonLabel>
            </IonTabButton>
            <IonTabButton tab="profile" href="/profile">
              <IonIcon icon={person} />
              <IonLabel>Profile</IonLabel>
            </IonTabButton>
          </IonTabBar>
        </IonTabs>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
