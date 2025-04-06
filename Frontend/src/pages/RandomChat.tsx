import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonMenuButton,
  IonCard,
  IonCardHeader,
  IonCardContent,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonList,
  IonAvatar,
  IonChip,
  IonText,
  IonFab,
  IonFabButton,
  IonTextarea,
  IonFooter
} from '@ionic/react';
import { 
  chatbubbles, 
  send, 
  pulse, 
  personCircleOutline, 
  refresh, 
  ellipsisVertical,
  flash
} from 'ionicons/icons';
import { useState } from 'react';
import './RandomChat.css';
import { themeService } from '../services/ThemeService';

const RandomChat: React.FC = () => {
  const [message, setMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [chats, setChats] = useState<{text: string, isMe: boolean, time: string}[]>([]);
  const [darkMode, setDarkMode] = useState(themeService.getDarkMode());

  const handleToggleTheme = () => {
    const isDark = themeService.toggleTheme();
    setDarkMode(isDark);
  };

  const startChat = () => {
    setIsConnected(true);
    setChats([
      { text: "Hi there! I'm a random stranger. How are you doing today?", isMe: false, time: "Just now" }
    ]);
  };

  const disconnectChat = () => {
    setIsConnected(false);
    setChats([]);
  };

  const sendMessage = () => {
    if (message.trim() === '') return;
    
    const newChat = { text: message, isMe: true, time: "Just now" };
    setChats([...chats, newChat]);
    setMessage('');

    // Simulate response after a short delay
    setTimeout(() => {
      const responses = [
        "That's interesting!", 
        "I agree with you.", 
        "Tell me more about it.", 
        "Really? I didn't know that.",
        "I'm having a good day too!"
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      setChats(prev => [...prev, { text: randomResponse, isMe: false, time: "Just now" }]);
    }, 1500);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Random Chat</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleToggleTheme}>
              <IonIcon slot="icon-only" icon={darkMode ? flash : ellipsisVertical} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      
      <IonContent fullscreen>
        {!isConnected ? (
          <div className="start-container">
            <IonCard>
              <IonCardHeader>
                <div className="random-icon">
                  <IonIcon icon={pulse} color="primary" />
                </div>
                <h1 className="random-title">Talk to Random Strangers</h1>
              </IonCardHeader>
              <IonCardContent>
                <p className="description">
                  Connect instantly with random people from around the world. 
                  All chats are anonymous and encrypted.
                </p>
                <div className="stats-container">
                  <div className="stat-item">
                    <h3>1,324</h3>
                    <p>Online Now</p>
                  </div>
                  <div className="stat-item">
                    <h3>5M+</h3>
                    <p>Users</p>
                  </div>
                  <div className="stat-item">
                    <h3>100%</h3>
                    <p>Anonymous</p>
                  </div>
                </div>
                <IonButton expand="block" onClick={startChat}>
                  <IonIcon slot="start" icon={chatbubbles} />
                  Start Random Chat
                </IonButton>
              </IonCardContent>
            </IonCard>
          </div>
        ) : (
          <div className="chat-container">
            <div className="chat-header">
              <IonChip color="primary">
                <IonAvatar>
                  <img src="https://ionicframework.com/docs/img/demos/avatar.svg" alt="Anonymous" />
                </IonAvatar>
                <IonLabel>Anonymous Stranger</IonLabel>
              </IonChip>
              <IonButton color="danger" fill="clear" onClick={disconnectChat}>
                <IonIcon slot="icon-only" icon={refresh} />
                Next
              </IonButton>
            </div>
            
            <div className="messages-container">
              {chats.map((chat, index) => (
                <div key={index} className={`message-bubble ${chat.isMe ? 'my-message' : 'other-message'}`}>
                  <div className="message-content">
                    <p>{chat.text}</p>
                    <IonText color="medium" className="message-time">
                      {chat.time}
                    </IonText>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </IonContent>

      {isConnected && (
        <IonFooter>
          <div className="message-input-container">
            <IonTextarea
              placeholder="Type your message..."
              value={message}
              onIonChange={e => setMessage(e.detail.value!)}
              autoGrow={true}
              maxlength={500}
              rows={1}
            ></IonTextarea>
            <IonButton fill="clear" onClick={sendMessage} disabled={!message.trim()}>
              <IonIcon slot="icon-only" icon={send} color="primary" />
            </IonButton>
          </div>
        </IonFooter>
      )}
    </IonPage>
  );
};

export default RandomChat;