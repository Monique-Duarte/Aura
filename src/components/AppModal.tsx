import React from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
} from '@ionic/react';
import { close } from 'ionicons/icons';

interface AppModalProps {
  /**
   * O título que aparecerá no cabeçalho do modal.
   */
  title: string;
  /**
   * Controla se o modal está visível ou não.
   */
  isOpen: boolean;
  /**
   * Função a ser chamada quando o modal for fechado (pelo botão 'X' ou pelo gesto de arrastar).
   */
  onDidDismiss: () => void;
  /**
   * O conteúdo JSX a ser renderizado dentro do modal.
   */
  children: React.ReactNode;
}

const AppModal: React.FC<AppModalProps> = ({ title, isOpen, onDidDismiss, children }) => {
  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDidDismiss}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{title}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onDidDismiss}>
              <IonIcon icon={close} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {children}
      </IonContent>
    </IonModal>
  );
};

export default AppModal;
