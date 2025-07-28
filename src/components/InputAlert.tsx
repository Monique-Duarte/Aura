import React from 'react';
import { IonAlert } from '@ionic/react';
import { AlertInput } from '@ionic/core';

interface InputAlertProps {
  isOpen: boolean;
  header: string;
  message: string;
  inputs: AlertInput[];
  onDidDismiss: () => void;
  onConfirm: (data: any) => void;
  confirmButtonText?: string;
  cancelButtonText?: string;
}

const InputAlert: React.FC<InputAlertProps> = ({
  isOpen,
  header,
  message,
  inputs,
  onDidDismiss,
  onConfirm,
  confirmButtonText = 'Ajustar',
  cancelButtonText = 'Cancelar',
}) => {
  return (
    <IonAlert
      isOpen={isOpen}
      onDidDismiss={onDidDismiss}
      header={header}
      message={message}
      inputs={inputs}
      buttons={[
        { text: cancelButtonText, role: 'cancel' },
        { text: confirmButtonText, handler: onConfirm }
      ]}
    />
  );
};

export default InputAlert;
