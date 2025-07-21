import React, { ReactNode, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import SideMenu from './SideMenu';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonMenuButton, IonButtons, IonSpinner } from '@ionic/react';

interface ProtectedLayoutProps {
  children: ReactNode;
  title?: string;
}

const ProtectedLayout: React.FC<ProtectedLayoutProps> = ({ children, title = 'Aura' }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const history = useHistory();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      if (!user) {
        history.replace('/login');
      }
    });
    return () => unsubscribe();
  }, [history]);

  if (loading) {
    return (
      <IonPage>
        <IonContent className="ion-padding" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <IonSpinner name="crescent" />
        </IonContent>
      </IonPage>
    );
  }

  if (!user) return null;

  return (
    <>
      <SideMenu contentId="main-content" />
      <IonPage id="main-content">
        <IonHeader>
          <IonToolbar color="primary">
            <IonButtons slot="start">
              <IonMenuButton />
            </IonButtons>
            <IonTitle>{title}</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          {children}
        </IonContent>
      </IonPage>
    </>
  );
};

export default ProtectedLayout; 