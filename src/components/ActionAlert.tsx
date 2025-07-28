import React from 'react';
import { IonAlert } from '@ionic/react';

interface ActionAlertProps {
  isOpen: boolean;
  header: string;
  message: string;
  onDidDismiss: () => void;
  onConfirm: () => void;
  confirmButtonText?: string;
  cancelButtonText?: string;
}

const ActionAlert: React.FC<ActionAlertProps> = ({
  isOpen,
  header,
  message,
  onDidDismiss,
  onConfirm,
  confirmButtonText = 'Confirmar',
  cancelButtonText = 'Cancelar',
}) => {
  return (
    <IonAlert
      isOpen={isOpen}
      onDidDismiss={onDidDismiss}
      header={header}
      message={message}
      buttons={[
        { text: cancelButtonText, role: 'cancel', handler: onDidDismiss },
        { text: confirmButtonText, cssClass: 'alert-button-danger', handler: onConfirm }
      ]}
    />
  );
};

export default ActionAlert;