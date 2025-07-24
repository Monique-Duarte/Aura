import React from 'react';
import { IonButton, IonIcon } from '@ionic/react';

interface ActionButtonProps {
  /**
   * A função a ser executada quando o botão for clicado.
   */
  onClick: () => void;
  /**
   * O texto ou elemento a ser exibido dentro do botão.
   */
  children: React.ReactNode;
  /**
   * Ícone opcional do ionicons a ser exibido no início do botão.
   */
  icon?: string;
  /**
   * Desabilita o botão, útil durante o carregamento de formulários.
   */
  disabled?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({ onClick, children, icon, disabled }) => {
  return (
    <IonButton 
      expand="block" 
      onClick={onClick} 
      disabled={disabled}
      className="save-button" // Mantém a sua classe para estilização
    >
      {icon && <IonIcon slot="start" icon={icon} />}
      {children}
    </IonButton>
  );
};

export default ActionButton;