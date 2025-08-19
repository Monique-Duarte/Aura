import React from 'react';
import { IonButton, IonIcon } from '@ionic/react';

type IonButtonFill = React.ComponentProps<typeof IonButton>['fill'];
type IonButtonExpand = React.ComponentProps<typeof IonButton>['expand'];

interface ActionButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  icon?: string;
  disabled?: boolean;
  fill?: IonButtonFill;
  slot?: string;
  expand?: IonButtonExpand;
  className?: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({ 
  onClick, 
  children, 
  icon, 
  disabled, 
  fill = "solid",
  slot,
  expand,
  className
}) => {
  const buttonClasses = `ion-margin-top ${className || ''}`;

  return (
    <IonButton 
      expand={expand} 
      onClick={onClick} 
      disabled={disabled}
      fill={fill}
      slot={slot} 
      className={buttonClasses} 
    >
      {icon && <IonIcon slot="start" icon={icon} />}
      {children}
    </IonButton>
  );
};

export default ActionButton;