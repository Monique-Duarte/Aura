import React from 'react';
import { IonList, IonItem, IonLabel, IonText, IonIcon } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { Notification } from '../hooks/useNotifications';
import { mailUnreadOutline, mailOpenOutline } from 'ionicons/icons';

interface NotificationListProps {
  notifications: Notification[];
  onNotificationClick: (notification: Notification) => void;
}

const NotificationList: React.FC<NotificationListProps> = ({ notifications, onNotificationClick }) => {
  const history = useHistory();

  const handleItemClick = (notification: Notification) => {
    // Chama a função passada pelo pai (que marcará como lida e fechará o popover)
    onNotificationClick(notification);
    // Navega para a rota definida na notificação
    history.push(notification.link);
  };

  if (notifications.length === 0) {
    return (
      <IonText className="ion-padding" color="medium">
        <p>Nenhuma notificação por aqui.</p>
      </IonText>
    );
  }

  return (
    <IonList lines="full">
      {notifications.map(notif => (
        <IonItem 
          key={notif.id}
          button 
          onClick={() => handleItemClick(notif)}
          className={!notif.isRead ? 'notification-unread' : ''}
        >
          <IonIcon 
            slot="start" 
            icon={!notif.isRead ? mailUnreadOutline : mailOpenOutline} 
            color={!notif.isRead ? 'primary' : 'medium'}
          />
          <IonLabel>
            <h2>{notif.title}</h2>
            <p>{notif.body}</p>
            <p className="notification-date">
              {notif.createdAt.toLocaleDateString('pt-BR')} às {notif.createdAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </IonLabel>
        </IonItem>
      ))}
    </IonList>
  );
};

export default NotificationList;