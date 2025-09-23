import React from 'react';
import { IonButton, IonIcon } from '@ionic/react';

interface ActionButtonProps extends React.ComponentProps<typeof IonButton> {
  children: React.ReactNode;
  icon?: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({ 
  children,
  icon, 
  ...props 
}) => {
  return (
    <IonButton 
      className={`ion-margin-top ${props.className || ''}`}
      {...props}
    >
      {icon && <IonIcon slot="start" icon={icon} />}
      
      {children}
    </IonButton>
  );
};

export default ActionButton;