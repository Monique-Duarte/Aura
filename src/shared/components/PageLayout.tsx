import React, { useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonMenuButton,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonBadge,
  IonPopover,
  IonListHeader,
} from '@ionic/react';
import { notificationsOutline } from 'ionicons/icons';
import { useNotifications, Notification } from '../../features/notifications/hooks/useNotifications';
import NotificationList from '../../features/notifications/components/NotificationList';

interface PageLayoutProps {
  pageTitle: string;
  children: React.ReactNode;
  headerActionButtons?: React.ReactNode;
}

const PageLayout: React.FC<PageLayoutProps> = ({ pageTitle, children, headerActionButtons }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [popoverState, setPopoverState] = useState<{show: boolean, event: Event | undefined}>({ show: false, event: undefined });

  const openNotifications = (e: React.MouseEvent) => {
    e.persist();
    setPopoverState({ show: true, event: e.nativeEvent });
  };

  const onNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    setPopoverState({ show: false, event: undefined });
  };

  return (
    <IonPage>
      <IonHeader translucent={true}>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>{pageTitle}</IonTitle>
          <IonButtons slot="end">
            {/* Ícone de Notificação */}
            <IonButton onClick={openNotifications}>
              <IonIcon slot="icon-only" icon={notificationsOutline} />
              {unreadCount > 0 && (
                <IonBadge color="danger" className="notification-badge">{unreadCount}</IonBadge>
              )}
            </IonButton>
            {headerActionButtons}
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen={true} className="ion-padding">
        {children}
      </IonContent>

      <IonPopover
        isOpen={popoverState.show}
        event={popoverState.event}
        onClose={() => setPopoverState({ show: false, event: undefined })}
        translucent={true}
        className="notification-popover"
      >
        <IonContent>
          <IonListHeader>Notificações</IonListHeader>
          <NotificationList notifications={notifications} onNotificationClick={onNotificationClick} />
          {unreadCount > 0 && (
            <IonButton 
              expand="block" 
              fill="clear" 
              size="small"
              onClick={() => markAllAsRead()}
            >
              Marcar todas como lidas
            </IonButton>
          )}
        </IonContent>
      </IonPopover>
    </IonPage>
  );
};

export default PageLayout;