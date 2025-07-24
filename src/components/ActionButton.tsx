import React from 'react';
import { IonButton, IonIcon } from '@ionic/react';

// Pega os tipos de 'fill' diretamente do IonButton para garantir a consistência
type IonButtonFill = React.ComponentProps<typeof IonButton>['fill'];

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
  /**
   * O estilo do botão. Padrão é 'solid'.
   */
  fill?: IonButtonFill;
}

const ActionButton: React.FC<ActionButtonProps> = ({ 
  onClick, 
  children, 
  icon, 
  disabled, 
  fill = "solid" // Define 'solid' como padrão
}) => {
  return (
    <IonButton 
      expand="block" 
      onClick={onClick} 
      disabled={disabled}
      fill={fill} // Usa a propriedade 'fill'
      // A classe 'save-button' pode ser removida se a estilização for geral
      className={fill === 'solid' ? 'save-button' : ''} 
    >
      {icon && <IonIcon slot="start" icon={icon} />}
      {children}
    </IonButton>
  );
};

export default ActionButton;