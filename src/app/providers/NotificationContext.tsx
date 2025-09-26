import React, { createContext, useContext, useState, ReactNode } from 'react';
import { IonToast } from '@ionic/react';

interface Notification {
  message: string;
  color: 'success' | 'danger' | 'warning';
}

interface NotificationContextData {
  showNotification: (notification: Notification) => void;
}

const NotificationContext = createContext<NotificationContextData | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notification, setNotification] = useState<Notification | null>(null);

  const showNotification = (newNotification: Notification) => {
    setNotification(newNotification);
  };

  const dismissNotification = () => {
    setNotification(null);
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {notification && (
        <IonToast
          isOpen={!!notification}
          message={notification.message}
          color={notification.color}
          duration={3000}
          onDidDismiss={dismissNotification}
        />
      )}
    </NotificationContext.Provider>
  );
};

export const useNotifier = (): NotificationContextData => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifier must be used within a NotificationProvider');
  }
  return context;
};