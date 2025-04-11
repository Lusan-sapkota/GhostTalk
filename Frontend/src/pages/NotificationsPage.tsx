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

// Define notification types
interface Notification {
  id: string;
  type: 'friendRequest' | 'message' | 'system' | 'like' | 'update';
  title: string;
  description: string;
  time: string;
  read: boolean;
  actionable: boolean;
  actionText?: string;
  actionLink?: string;
  icon: string;
}

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [muteAll, setMuteAll] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Simulate loading notifications
    const timer = setTimeout(() => {
      setNotifications([
        {
          id: 'notif1',
          type: 'friendRequest',
          title: 'New Friend Request',
          description: 'Alex Morgan sent you a friend request',
          time: '10 min ago',
          read: false,
          actionable: true,
          actionText: 'View',
          actionLink: '/favorites',
          icon: personAdd
        },
        {
          id: 'notif2',
          type: 'message',
          title: 'New Message',
          description: 'Jamie sent you a message: "Hey, how are you doing?"',
          time: '30 min ago',
          read: false,
          actionable: true,
          actionText: 'Reply',
          actionLink: '/chat-individual',
          icon: chatbubbleOutline
        },
        {
          id: 'notif3',
          type: 'system',
          title: 'Security Alert',
          description: 'Your account was accessed from a new device',
          time: '2 hours ago',
          read: true,
          actionable: true,
          actionText: 'Review',
          actionLink: '/settings',
          icon: alertCircleOutline
        },
        {
          id: 'notif4',
          type: 'like',
          title: 'Someone liked your message',
          description: 'Taylor liked your message in "Privacy Discussion"',
          time: '1 day ago',
          read: true,
          actionable: false,
          icon: heart
        },
        {
          id: 'notif5',
          type: 'update',
          title: 'App Update Available',
          description: 'GhostTalk v2.1 is now available with new features',
          time: '2 days ago',
          read: true,
          actionable: true,
          actionText: 'Update',
          actionLink: '/settings',
          icon: star
        }
      ]);
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

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
      case 'message': return 'success';
      case 'system': return 'warning';
      case 'like': return 'danger';
      case 'update': return 'tertiary';
      default: return 'medium';
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
                <IonButton 
                  fill="clear" 
                  size="small" 
                  routerLink={notification.actionLink} 
                  className="notification-action"
                >
                  {notification.actionText}
                </IonButton>
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

export default NotificationsPage;