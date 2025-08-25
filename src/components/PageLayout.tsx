import React from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonMenuButton,
  IonTitle,
  IonContent,
} from '@ionic/react';

// A interface define as "props" que nosso layout vai aceitar
interface PageLayoutProps {
  /** O título que aparecerá no cabeçalho da página. */
  pageTitle: string;
  /** O conteúdo da página (o que você colocaria dentro do IonContent). */
  children: React.ReactNode;
  /**
   * Opcional: Permite adicionar botões ou outros elementos no final do cabeçalho.
   */
  headerActionButtons?: React.ReactNode;
}

const PageLayout: React.FC<PageLayoutProps> = ({ pageTitle, children, headerActionButtons }) => {
  return (
    <IonPage>
      <IonHeader translucent={true}>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>{pageTitle}</IonTitle>
          {headerActionButtons}
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen={true} className="ion-padding">
        {children}
      </IonContent>
    </IonPage>
  );
};

export default PageLayout;