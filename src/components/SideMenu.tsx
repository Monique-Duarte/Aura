import React, { useState, useEffect, useRef } from 'react';
import {
  IonMenu,
  IonHeader,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonMenuToggle,
  IonIcon,
  IonLabel,
  IonAvatar,
  IonFooter,
  IonNote,
  IonSpinner
} from '@ionic/react';

import { 
  cashOutline, 
  cardOutline, 
  walletOutline, 
  homeOutline, 
  receiptOutline, 
  logOutOutline, 
  personCircleOutline,
  settingsOutline, 
  documentTextOutline,
  flagOutline 
} from 'ionicons/icons';
import { useLocation, useHistory } from 'react-router-dom';
import { getAuth, signOut, onAuthStateChanged, User, updateProfile } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import '../theme/variables.css';

const menuOptions = [
  { title: 'Dashboard', icon: homeOutline, path: '/app/dashboard' },
  { title: 'Renda', icon: cashOutline, path: '/app/renda' },
  { title: 'Despesas', icon: receiptOutline, path: '/app/despesas' },
  { title: 'Definir Metas', icon: flagOutline, path: '/app/metas' },
  { title: 'Cartão', icon: cardOutline, path: '/app/cartao' },
  { title: 'Faturas', icon: documentTextOutline, path: '/app/faturas' },
  { title: 'Reserva', icon: walletOutline, path: '/app/reserva' },
  { title: 'Configurações', icon: settingsOutline, path: '/app/configuracao' },
];

const SideMenu: React.FC<{ contentId: string }> = ({ contentId }) => {
  const history = useHistory();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    const auth = getAuth();
    try {
      await signOut(auth);
      history.push('/login');
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    const storage = getStorage();
    const auth = getAuth();

    const storageRef = ref(storage, `profile_pictures/${user.uid}`);

    try {
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL });
      }
      setUser(prevUser => prevUser ? { ...prevUser, photoURL } : null);

    } catch (error) {
      console.error("Erro ao fazer upload da imagem:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <IonMenu contentId={contentId} type="overlay">
      <IonHeader className="ion-no-border">
        <div className="user-profile">
          <IonAvatar onClick={handleAvatarClick} className="user-avatar">
            {isUploading ? (
              <IonSpinner name="crescent" />
            ) : user?.photoURL ? (
              <img src={user.photoURL} alt="Avatar" />
            ) : (
              <IonIcon icon={personCircleOutline} className="generic-avatar-icon" />
            )}
          </IonAvatar>
          <input
            type="file"
            accept="image/png, image/jpeg"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <IonTitle>Olá, {user?.displayName || 'Usuário'}</IonTitle>
          <IonNote>{user?.email}</IonNote>
        </div>
      </IonHeader>

      <IonContent>
        <IonList id="menu-list">
          {menuOptions.map(option => (
            <IonMenuToggle key={option.title} autoHide={false}>
              <IonItem
                button
                onClick={() => history.push(option.path)}
                className={location.pathname === option.path ? 'selected' : ''}
                lines="none"
              >
                <IonIcon slot="start" icon={option.icon} />
                <IonLabel>{option.title}</IonLabel>
              </IonItem>
            </IonMenuToggle>
          ))}
        </IonList>
      </IonContent>

      <IonFooter className="ion-no-border">
         <IonList>
           <IonMenuToggle autoHide={false}>
             <IonItem button lines="none" onClick={handleLogout}>
               <IonIcon slot="start" icon={logOutOutline} />
               <IonLabel>Sair</IonLabel>
             </IonItem>
           </IonMenuToggle>
         </IonList>
      </IonFooter>
    </IonMenu>
  );
};

export default SideMenu;