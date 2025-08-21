import React from 'react';
import { IonButton, IonIcon } from '@ionic/react';

// ===================================================================================
// CORREÇÃO AQUI: Em vez de importar 'IonButtonProps', usamos esta abordagem
// que é o padrão do React para obter os tipos de um componente.
// ===================================================================================
interface ActionButtonProps extends React.ComponentProps<typeof IonButton> {
  // Apenas garantimos que 'children' seja obrigatório, pois no tipo base ele pode ser opcional.
  children: React.ReactNode;
}

const ActionButton: React.FC<ActionButtonProps> = ({ 
  children,
  ...props // O '...props' agora contém TODOS os tipos corretos: color, fill, expand, className, etc.
}) => {
  return (
    <IonButton 
      // A classe 'ion-margin-top' garante o espaçamento padrão.
      className={`ion-margin-top ${props.className || ''}`}
      {...props} // Repassamos todas as propriedades diretamente para o IonButton
    >
      {/* O IonIcon não precisa ser passado como prop, ele pode ser usado como filho, 
          mas manteremos assim por enquanto se for o seu padrão. */}
      {children}
    </IonButton>
  );
};

export default ActionButton;