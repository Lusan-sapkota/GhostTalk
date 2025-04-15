import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonButton,
  IonRefresher,
  IonRefresherContent,
  IonSkeletonText,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonToggle,
  IonCard,
  IonCardContent,
  IonChip
} from '@ionic/react';
import { 
  personAdd, 
  chatbubbleOutline, 
  notificationsOutline, 
  timeOutline, 
  heart, 
  star, 
  alertCircleOutline,
  settingsOutline,
  trashOutline,
  checkmarkDoneOutline,
  notificationsOffOutline,
  megaphoneOutline,
  ribbonOutline,
  pulseOutline
} from 'ionicons/icons';
import { useAuth } from '../contexts/AuthContext';
import BackHeaderComponent from '../components/BackHeaderComponent';
import './NotificationsPage.css';
import { useHistory } from 'react-router-dom';
import { socket, socketService } from '../services/socket.service';
import {apiService} from '../services/api.service';
import { isPlatform } from '@ionic/react';
import { PushNotifications } from '@capacitor/push-notifications';

// Define notification types
interface Notification {
  id: string;
  type: 'friendRequest' | 'friendRequestAccepted' | 'message' | 'system' | 'like' | 'update';
  title: string;
  description: string;
  time: string;
  read: boolean;
  actionable: boolean;
  actionText?: string;
  actionLink?: string;
  icon: string;
}

interface FriendRequestAcceptedData {
  userName: string;
  userId: string;
  requestId?: string;
  timestamp?: string;
  type: string;
}

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [muteAll, setMuteAll] = useState(false);
  const { isAuthenticated } = useAuth();
  const history = useHistory();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setIsLoading(true);
        const response = await apiService.makeRequest('/notifications', 'GET');
        if (response.success && response.notifications) {
          setNotifications(response.notifications);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchNotifications();
      
      // Connect to socket for real-time notifications
      interface NotificationData {
        id?: string;
        type?: 'friendRequest' | 'message' | 'system' | 'like' | 'update';
        title?: string;
        message?: string;
        time?: string;
        metadata?: any;
      }

      socket.on('notification', (data: NotificationData) => {
        console.log('New notification received:', data);
        
        const newNotification: Notification = {
          id: data.id || `notif-${Date.now()}`,
          type: data.type || 'system',
          title: data.title || 'New Notification',
          description: data.message || '',
          time: data.time || 'Just now',
          read: false,
          actionable: true,
          actionText: getActionTextByType(data.type || 'system'),
          actionLink: getActionLinkByType(data.type || 'system', data.metadata),
          icon: getIconByType(data.type || 'system')
        };
        
        // Add to notifications list
        setNotifications(prev => [newNotification, ...prev]);
      });
      
      // Friend request specific events
      interface FriendRequestData {
        senderName: string;
        senderId?: string;
        requestId?: string;
        timestamp?: string;
        type?: string;
      }

      socket.on('friend_request', (data: any) => {
        console.log('Friend request event received:', data);
        
        // Check if this is a new request or an acceptance based on the 'type' field
        if (data.type === 'friend_request_accepted') {
          // This is a friend request acceptance
          const newNotification: Notification = {
            id: `friend-req-accept-${Date.now()}`,
            type: 'friendRequestAccepted',
            title: 'Friend Request Accepted',
            description: `${data.userName} accepted your friend request`,
            time: 'Just now',
            read: false,
            actionable: true,
            actionText: 'Message',
            actionLink: `/chat-individual/${data.userId}`,
            icon: personAdd
          };
          
          setNotifications(prev => [newNotification, ...prev]);
          console.log('Added acceptance notification:', newNotification);
        } else if (data.type === 'friend_request') {
          // This is a new friend request
          const newNotification: Notification = {
            id: `friend-req-${Date.now()}`,
            type: 'friendRequest',
            title: 'New Friend Request',
            description: `${data.senderName} sent you a friend request`,
            time: 'Just now',
            read: false,
            actionable: true,
            actionText: 'View',
            actionLink: '/favorites?tab=requests',
            icon: personAdd
          };
          
          setNotifications(prev => [newNotification, ...prev]);
          console.log('Added request notification:', newNotification);
        } else {
          console.log('Unknown friend request event type:', data.type);
        }
      });

      // Add a general catch-all notification handler
      socket.on('*', (event: string, data: any) => {
        console.log('Catch-all socket event:', event, data);
      });
      
      // Session login events
      interface SessionLoginData {
        device: string;
        location: string;
      }

      socket.on('session_login', (data: SessionLoginData) => {
        const newNotification: Notification = {
          id: `session-${Date.now()}`,
          type: 'system',
          title: 'New Login Detected',
          description: `Your account was accessed from ${data.device} in ${data.location}`,
          time: 'Just now',
          read: false,
          actionable: true,
          actionText: 'Review',
          actionLink: '/settings',
          icon: alertCircleOutline
        };
        
        setNotifications(prev => [newNotification, ...prev]);
      });
      
      // Chat message events
      interface ChatMessageData {
        senderName: string;
        messagePreview: string;
        senderId: string;
      }

      socket.on('chat_message', (data: ChatMessageData) => {
        const newNotification: Notification = {
          id: `chat-${Date.now()}`,
          type: 'message',
          title: 'New Message',
          description: `${data.senderName}: ${data.messagePreview}`,
          time: 'Just now',
          read: false,
          actionable: true,
          actionText: 'Reply',
          actionLink: `/chat-individual/${data.senderId}`,
          icon: chatbubbleOutline
        };
        
        setNotifications(prev => [newNotification, ...prev]);
      });
    }
    
    return () => {
      if (isAuthenticated) {
        socket.off('notification');
        socket.off('friend_request');
        socket.off('session_login');
        socket.off('chat_message');
      }
    };
  }, [isAuthenticated]);

  // Add this to NotificationsPage.tsx to debug socket connections
  useEffect(() => {
    if (isAuthenticated) {
      // Log socket connection status
      console.log("Socket connected:", socket.connected);
      
      if (!socket.connected) {
        console.log("Socket not connected, attempting to connect...");
        // Get token and ensure socket is connected with it
        const token = localStorage.getItem('token');
        if (token) {
          socketService.ensureConnected(token);
        }
      }
      
      // Add connect/disconnect listeners
      socket.on('connect', () => {
        console.log('Socket connected!');
      });
      
      socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });
      
      return () => {
        socket.off('connect');
        socket.off('disconnect');
      };
    }
  }, [isAuthenticated]);

  // Add a better socket debugging and connection management
  useEffect(() => {
    if (isAuthenticated) {
      console.log("Socket status at initialization:", socket.connected ? "connected" : "disconnected");
      
      if (!socket.connected) {
        // Get token from apiService instead of localStorage
        const token = apiService.getToken();
        if (token) {
          console.log("Attempting to connect socket with token");
          socketService.ensureConnected(token);
        } else {
          console.error("No token available for socket connection");
        }
      }
      
      // Add connect/disconnect listeners
      const onConnect = () => {
        console.log('Socket connected!', socket.id);
      };
      
      const onDisconnect = (reason: string) => {
        console.log('Socket disconnected:', reason);
        
        // Auto-reconnect on disconnection
        const token = localStorage.getItem('token');
        if (token) {
          console.log("Auto-reconnecting socket after disconnect");
          setTimeout(() => {
        socketService.ensureConnected(token);
          }, 1000);
        }
      };
      
      socket.on('connect', onConnect);
      socket.on('disconnect', onDisconnect);
      
      // Add error handler
      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
      });
      
      // Test connection
      if (socket.connected) {
        console.log("Emitting ping to test connection");
        socket.emit('ping', { time: new Date().toISOString() });
      }
      
      return () => {
        socket.off('connect', onConnect);
        socket.off('disconnect', onDisconnect);
        socket.off('connect_error');
      };
    }
  }, [isAuthenticated]);

  // Add push notification setup for mobile devices
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const setupPushNotifications = async () => {
      if (isPlatform('capacitor')) {
        try {
          // Request permission
          await PushNotifications.requestPermissions();
          
          // Register with FCM
          await PushNotifications.register();
          
          // Register handlers
          PushNotifications.addListener('registration', async (token) => {
            console.log('Push registration success, token:', token.value);
            
            // Send this token to your backend
            try {
              await apiService.makeRequest('/user/push-token', 'POST', {
                token: token.value
              });
            } catch (error) {
              console.error('Failed to save push token:', error);
            }
          });
          
          PushNotifications.addListener('registrationError', (error) => {
            console.error('Push registration failed:', error);
          });
          
          PushNotifications.addListener('pushNotificationReceived', (notification) => {
            console.log('Push notification received:', notification);
            
            // Add the notification to the state
            const newNotification: Notification = {
              id: `push-${Date.now()}`,
              type: notification.data?.type || 'system',
              title: notification.title || 'New Notification',
              description: notification.body || '',
              time: 'Just now',
              read: false,
              actionable: true,
              actionText: getActionTextByType(notification.data?.type || 'system'),
              actionLink: getActionLinkByType(notification.data?.type || 'system', notification.data),
              icon: getIconByType(notification.data?.type || 'system')
            };
            
            setNotifications(prev => [newNotification, ...prev]);
          });
          
          PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
            console.log('Push notification action performed:', action);
            
            // Handle navigation based on the notification type
            if (action.notification.data?.type === 'friendRequest') {
              history.push('/favorites?tab=requests');
            } else if (action.notification.data?.type === 'friendRequestAccepted') {
              history.push(`/chat-individual/${action.notification.data.userId}`);
            } else if (action.notification.data?.type === 'message') {
              history.push(`/chat-individual/${action.notification.data.senderId}`);
            }
          });
        } catch (error) {
          console.error('Error setting up push notifications:', error);
        }
      }
    };
    
    setupPushNotifications();
    
    return () => {
      if (isPlatform('capacitor')) {
        PushNotifications.removeAllListeners();
      }
    };
  }, [isAuthenticated, history]);

  const handleRefresh = (event: CustomEvent) => {
    // Simulate refreshing notifications
    setTimeout(() => {
      // Refresh your data here
      console.log('Notifications refreshed');
      event.detail.complete();
    }, 1000);
  };

  const handleDeleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
  };

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === notificationId ? { ...notif, read: true } : notif
    ));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
  };

  const getUnreadCount = () => {
    return notifications.filter(notif => !notif.read).length;
  };

  const getIconForType = (type: string) => {
    switch(type) {
      case 'friendRequest': return personAdd;
      case 'message': return chatbubbleOutline;
      case 'system': return alertCircleOutline;
      case 'like': return heart;
      case 'update': return star;
      default: return notificationsOutline;
    }
  };

  const getColorForType = (type: string) => {
    switch(type) {
      case 'friendRequest': return 'primary';
      case 'friendRequestAccepted': return 'success'; // Use green for acceptances
      case 'message': return 'success';
      case 'system': return 'warning';
      case 'like': return 'danger';
      case 'update': return 'tertiary';
      default: return 'medium';
    }
  };

  const handleFriendRequestNotification = (notification: Notification) => {
    // Navigate to the favorites page and select the requests tab
    history.push({
      pathname: '/favorites',
      search: '?tab=requests'  // Add query parameter to indicate which tab
    });
    
    // Also mark the notification as read
    handleMarkAsRead(notification.id);
  };

  const getNotificationAction = (notification: Notification) => {
    switch(notification.type) {
      case 'friendRequest':
        return (
          <IonButton 
            fill="outline" 
            size="small" 
            className="notification-action"
            onClick={() => handleFriendRequestNotification(notification)}
          >
            View
          </IonButton>
        );
      case 'friendRequestAccepted':
        return (
          <IonButton 
            fill="outline" 
            size="small" 
            className="notification-action"
            routerLink={notification.actionLink}
          >
            Message
          </IonButton>
        );
      case 'message':
        return (
          <IonButton 
            fill="outline" 
            size="small" 
            className="notification-action"
            routerLink={notification.actionLink}
          >
            Reply
          </IonButton>
        );
      default:
        return notification.actionable ? (
          <IonButton 
            fill="outline" 
            size="small" 
            className="notification-action"
            routerLink={notification.actionLink}
          >
            {notification.actionText}
          </IonButton>
        ) : null;
    }
  };

  const renderNotificationsList = () => {
    if (isLoading) {
      return Array(3).fill(0).map((_, index) => (
        <IonItem key={`skeleton-${index}`} className="notification-item skeleton">
          <div className="notification-icon skeleton" slot="start">
            <IonSkeletonText animated />
          </div>
          <IonLabel>
            <h2><IonSkeletonText animated style={{ width: '60%' }} /></h2>
            <p><IonSkeletonText animated style={{ width: '80%' }} /></p>
            <p><IonSkeletonText animated style={{ width: '30%' }} /></p>
          </IonLabel>
        </IonItem>
      ));
    }

    if (notifications.length === 0) {
      return (
        <div className="empty-notifications">
          <IonIcon icon={notificationsOffOutline} />
          <h3>No Notifications</h3>
          <p>When you receive notifications, they'll appear here</p>
        </div>
      );
    }

    return notifications.map(notification => (
      <IonItemSliding key={notification.id}>
        <IonItem 
          className={`notification-item staggered-item ${!notification.read ? 'unread' : ''}`}
          detail={false}
        >
          <div 
            className={`notification-icon ${getColorForType(notification.type)}`} 
            slot="start"
          >
            <IonIcon icon={getIconForType(notification.type)} />
          </div>
          
          <IonLabel>
            <div className="notification-header">
              <h2>{notification.title}</h2>
              {!notification.read && <div className="unread-dot"></div>}
            </div>
            <p className="notification-description">{notification.description}</p>
            <div className="notification-footer">
              <span className="notification-time">
                <IonIcon icon={timeOutline} />
                {notification.time}
              </span>
              
              {notification.actionable && (
                getNotificationAction(notification)
              )}
            </div>
          </IonLabel>
        </IonItem>
        
        <IonItemOptions side="end">
          {!notification.read && (
            <IonItemOption color="primary" onClick={() => handleMarkAsRead(notification.id)}>
              <IonIcon slot="icon-only" icon={checkmarkDoneOutline} />
            </IonItemOption>
          )}
          <IonItemOption color="danger" onClick={() => handleDeleteNotification(notification.id)}>
            <IonIcon slot="icon-only" icon={trashOutline} />
          </IonItemOption>
        </IonItemOptions>
      </IonItemSliding>
    ));
  };

  return (
    <IonPage className="notifications-page">
      <BackHeaderComponent 
        title="Notifications" 
        defaultHref="/profile"
      />
      
      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>
        
        {notifications.length > 0 && !isLoading && (
          <div className="notifications-actions">
            <IonButton 
              fill="clear" 
              size="small" 
              onClick={handleMarkAllAsRead}
              disabled={getUnreadCount() === 0}
            >
              <IonIcon slot="start" icon={checkmarkDoneOutline} />
              Mark all read
            </IonButton>
            
            <IonButton 
              fill="clear" 
              size="small" 
              color="danger"
              onClick={handleClearAllNotifications}
            >
              <IonIcon slot="start" icon={trashOutline} />
              Clear all
            </IonButton>
          </div>
        )}
        
        <IonList className="notifications-list">
          {renderNotificationsList()}
        </IonList>
        
        {!isLoading && (
          <div className="settings-section">
            <IonCard className="notification-settings-card">
              <IonCardContent>
                <div className="settings-header">
                  <IonIcon icon={settingsOutline} color="primary" />
                  <h3>Notification Settings</h3>
                </div>
                
                <IonItem lines="none" className="settings-item">
                  <IonLabel>Mute All Notifications</IonLabel>
                  <IonToggle 
                    checked={muteAll} 
                    onIonChange={e => setMuteAll(e.detail.checked)}
                  />
                </IonItem>
                
                <div className="categories-section">
                  <h4>Notification Categories</h4>
                  <div className="category-chips">
                    <IonChip outline color="primary" className="category-chip">
                      <IonIcon icon={personAdd} />
                      <IonLabel>Friend Requests</IonLabel>
                    </IonChip>
                    <IonChip outline color="success" className="category-chip">
                      <IonIcon icon={chatbubbleOutline} />
                      <IonLabel>Messages</IonLabel>
                    </IonChip>
                    <IonChip outline color="warning" className="category-chip">
                      <IonIcon icon={alertCircleOutline} />
                      <IonLabel>Alerts</IonLabel>
                    </IonChip>
                    <IonChip outline color="tertiary" className="category-chip">
                      <IonIcon icon={megaphoneOutline} />
                      <IonLabel>Updates</IonLabel>
                    </IonChip>
                  </div>
                </div>
                
                <IonButton 
                  expand="block" 
                  fill="clear" 
                  routerLink="/settings"
                  className="advanced-settings-btn"
                >
                  Advanced Notification Settings
                </IonButton>
              </IonCardContent>
            </IonCard>
            
            <div className="notification-tips">
              <div className="tip-item">
                <IonIcon icon={pulseOutline} color="primary" />
                <p>Real-time notifications help you stay connected</p>
              </div>
            </div>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

const getActionTextByType = (type: string): string => {
  switch (type) {
    case 'friendRequest': return 'View';
    case 'friendRequestAccepted': return 'Message';
    case 'message': return 'Reply';
    case 'system': return 'Review';
    default: return 'View';
  }
};

const getActionLinkByType = (type: string, metadata?: any): string => {
  switch (type) {
    case 'friendRequest': return '/favorites?tab=requests';
    case 'friendRequestAccepted': 
      return metadata?.userId ? `/chat-individual/${metadata.userId}` : '/favorites';
    case 'message': return metadata?.chatId ? `/chat-individual/${metadata.chatId}` : '/chat';
    case 'system': return '/settings';
    default: return '/';
  }
};

const getIconByType = (type: string): string => {
  switch (type) {
    case 'friendRequest': 
    case 'friendRequestAccepted': return personAdd;
    case 'message': return chatbubbleOutline;
    case 'system': return alertCircleOutline;
    default: return notificationsOutline;
  }
};

export default NotificationsPage;